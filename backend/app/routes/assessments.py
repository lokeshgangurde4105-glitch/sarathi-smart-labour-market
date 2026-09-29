import json
import random
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import (
    User,
    StudentProfile,
    AssessmentQuestion,
    AssessmentAttempt,
    AssessmentAnswer,
    StudentSkillGap,
    Course,
    AIRecommendation,
)
from ..routes.students import get_optional_user_id

router = APIRouter()


# ============================================================
# SCHEMAS
# ============================================================

class AnswerSubmission(BaseModel):
    question_id: int
    selected_option: str


class AssessmentSubmission(BaseModel):
    answers: List[AnswerSubmission]


# ============================================================
# GET QUESTIONS (Requirement 42)
# ============================================================

@router.get("/questions")
def get_assessment_questions(
    limit: int = 10,
    category: Optional[str] = None,
    skill: Optional[str] = None,
    db: Session = Depends(get_db),
):
    query = db.query(AssessmentQuestion)
    if category:
        query = query.filter(AssessmentQuestion.category == category)
    if skill:
        query = query.filter(AssessmentQuestion.skill_name == skill)

    all_questions = query.all()
    if not all_questions:
        # Fallback to all questions if specific filter has none
        all_questions = db.query(AssessmentQuestion).all()

    # Random selection
    selected = random.sample(all_questions, min(len(all_questions), limit))

    return {
        "success": True,
        "total": len(selected),
        "data": [
            {
                "id": q.id,
                "skill_name": q.skill_name,
                "question": q.question,
                "options": {
                    "A": q.option_a,
                    "B": q.option_b,
                    "C": q.option_c,
                    "D": q.option_d,
                },
                "difficulty": q.difficulty,
                "category": q.category,
            }
            for q in selected
        ],
    }


# ============================================================
# SUBMIT ASSESSMENT (Requirement 42 & 43)
# ============================================================

@router.post("/submit")
def submit_assessment(
    submission: AssessmentSubmission | List[AnswerSubmission],
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    answers_list = submission if isinstance(submission, list) else submission.answers

    if not answers_list:
        raise HTTPException(status_code=400, detail="No answers provided in submission")

    # Evaluate answers
    total_questions = len(answers_list)
    correct_count = 0
    skill_stats: Dict[str, Dict[str, int]] = {}
    detailed_answers = []

    # Prepare attempt record
    attempt = AssessmentAttempt(
        user_id=user.id,
        total_score=0,
        max_score=total_questions * 10,
        percentage=0.0,
        passed=False,
    )
    db.add(attempt)
    db.flush()

    for item in answers_list:
        q = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == item.question_id).first()
        if not q:
            continue

        is_correct = (item.selected_option.strip().upper() == q.correct_option.strip().upper())
        if is_correct:
            correct_count += 1

        # Track per-skill performance
        if q.skill_name not in skill_stats:
            skill_stats[q.skill_name] = {"correct": 0, "total": 0}
        skill_stats[q.skill_name]["total"] += 1
        if is_correct:
            skill_stats[q.skill_name]["correct"] += 1

        # Record answer
        db.add(AssessmentAnswer(
            attempt_id=attempt.id,
            question_id=q.id,
            selected_option=item.selected_option.strip().upper(),
            is_correct=is_correct,
        ))

        detailed_answers.append({
            "question_id": q.id,
            "skill_name": q.skill_name,
            "question": q.question,
            "selected_option": item.selected_option.strip().upper(),
            "correct_option": q.correct_option,
            "is_correct": is_correct,
            "explanation": q.explanation,
        })

    # Calculations
    percentage = round((correct_count / max(total_questions, 1)) * 100, 1)
    passed = percentage >= 60.0

    skill_scores = {}
    identified_gaps = []
    recommended_courses = []

    all_courses = db.query(Course).all()

    for skill_name, stats in skill_stats.items():
        skill_pct = round((stats["correct"] / stats["total"]) * 100, 1)
        skill_scores[skill_name] = skill_pct

        # If skill score is low, record Skill Gap
        if skill_pct < 75.0:
            gap_amount = round(85.0 - skill_pct, 1)
            priority = "Critical" if skill_pct < 50.0 else "High"

            # Find matching course
            matching_course = None
            for c in all_courses:
                if skill_name.lower() in (c.name + " " + (c.description or "")).lower():
                    matching_course = c.name
                    if c.name not in recommended_courses:
                        recommended_courses.append(c.name)
                    break
            if not matching_course and all_courses:
                matching_course = all_courses[0].name

            # Update or create StudentSkillGap
            existing_gap = db.query(StudentSkillGap).filter(
                StudentSkillGap.user_id == user.id,
                StudentSkillGap.skill_name == skill_name,
            ).first()

            if existing_gap:
                existing_gap.current_score = skill_pct
                existing_gap.gap_score = gap_amount
                existing_gap.priority = priority
                existing_gap.recommended_course = matching_course
            else:
                db.add(StudentSkillGap(
                    user_id=user.id,
                    skill_name=skill_name,
                    current_score=skill_pct,
                    required_score=85.0,
                    gap_score=gap_amount,
                    priority=priority,
                    recommended_course=matching_course,
                ))

            identified_gaps.append({
                "skill_name": skill_name,
                "current_score": skill_pct,
                "required_score": 85.0,
                "gap_score": gap_amount,
                "priority": priority,
                "recommended_course": matching_course,
            })

    attempt.total_score = correct_count * 10
    attempt.percentage = percentage
    attempt.passed = passed
    attempt.skill_scores_json = json.dumps(skill_scores)

    # Update Student Profile metrics
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    if profile:
        profile.skill_score = percentage
        profile.industry_readiness = min(100.0, round(percentage * 1.05, 1))

    # Add AI Recommendation record
    if identified_gaps:
        rec_title = f"Strengthen {identified_gaps[0]['skill_name']} Competency"
        rec_desc = f"Based on your recent assessment, your proficiency in {identified_gaps[0]['skill_name']} is {identified_gaps[0]['current_score']}%. We recommend enrolling in '{identified_gaps[0]['recommended_course']}'."
        db.add(AIRecommendation(
            title=rec_title,
            recommendation=rec_desc,
            reason=f"Identified {identified_gaps[0]['priority']} gap of {identified_gaps[0]['gap_score']}% in {identified_gaps[0]['skill_name']}.",
            priority=identified_gaps[0]['priority'],
            confidence_score=94.5,
            status="Active",
        ))

    db.commit()
    db.refresh(attempt)

    return {
        "success": True,
        "message": "Assessment evaluated and results saved successfully",
        "data": {
            "attempt_id": attempt.id,
            "total_questions": total_questions,
            "correct_answers": correct_count,
            "score": attempt.total_score,
            "total_score": attempt.total_score,
            "max_score": attempt.max_score,
            "percentage": percentage,
            "passed": passed,
            "skill_scores": skill_scores,
            "skill_gaps": identified_gaps,
            "recommended_courses": recommended_courses,
            "answers_review": detailed_answers,
            "submitted_at": attempt.created_at.strftime("%d %b %Y, %I:%M %p"),
        },
    }


# ============================================================
# ASSESSMENT HISTORY
# ============================================================

@router.get("/history")
def get_assessment_history(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    attempts = (
        db.query(AssessmentAttempt)
        .filter(AssessmentAttempt.user_id == user_id)
        .order_by(AssessmentAttempt.created_at.desc())
        .all()
    )

    results = []
    for att in attempts:
        scores = {}
        if att.skill_scores_json:
            try:
                scores = json.loads(att.skill_scores_json)
            except Exception:
                pass

        results.append({
            "id": att.id,
            "total_score": att.total_score,
            "max_score": att.max_score,
            "percentage": att.percentage,
            "passed": att.passed,
            "skill_scores": scores,
            "completed_at": att.created_at.strftime("%d %b %Y, %I:%M %p"),
        })

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


# ============================================================
# SPECIFIC ATTEMPT RESULT
# ============================================================

@router.get("/attempt/{attempt_id}")
def get_attempt_detail(
    attempt_id: int,
    db: Session = Depends(get_db),
):
    attempt = db.query(AssessmentAttempt).filter(AssessmentAttempt.id == attempt_id).first()
    if not attempt:
        raise HTTPException(status_code=404, detail="Assessment attempt not found")

    answers = db.query(AssessmentAnswer).filter(AssessmentAnswer.attempt_id == attempt.id).all()
    review = []
    for a in answers:
        q = db.query(AssessmentQuestion).filter(AssessmentQuestion.id == a.question_id).first()
        if q:
            review.append({
                "question": q.question,
                "skill_name": q.skill_name,
                "selected_option": a.selected_option,
                "correct_option": q.correct_option,
                "is_correct": a.is_correct,
                "explanation": q.explanation,
            })

    skill_scores = {}
    if attempt.skill_scores_json:
        try:
            skill_scores = json.loads(attempt.skill_scores_json)
        except Exception:
            pass

    return {
        "success": True,
        "data": {
            "id": attempt.id,
            "total_score": attempt.total_score,
            "max_score": attempt.max_score,
            "percentage": attempt.percentage,
            "passed": attempt.passed,
            "skill_scores": skill_scores,
            "completed_at": attempt.created_at.strftime("%d %b %Y, %I:%M %p"),
            "answers": review,
        },
    }
