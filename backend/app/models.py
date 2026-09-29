from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


# ============================================================
# LOCATION
# ============================================================

class Location(Base):
    __tablename__ = "locations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    state: Mapped[str] = mapped_column(
        String(100),
        index=True,
    )

    district: Mapped[str] = mapped_column(
        String(100),
        index=True,
    )

    city: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    demands = relationship(
        "JobDemand",
        back_populates="location",
    )

    candidates = relationship(
        "Candidate",
        back_populates="location",
    )


# ============================================================
# INDUSTRY SECTOR
# ============================================================

class Sector(Base):
    __tablename__ = "sectors"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    growth_rate: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    job_demands = relationship(
        "JobDemand",
        back_populates="sector",
    )

    employers = relationship(
        "Employer",
        back_populates="sector",
    )


# ============================================================
# JOB ROLE
# ============================================================

class JobRole(Base):
    __tablename__ = "job_roles"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    sector_id: Mapped[int | None] = mapped_column(
        ForeignKey("sectors.id"),
        nullable=True,
    )

    required_experience: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    average_salary: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    sector = relationship(
        "Sector",
    )

    job_demands = relationship(
        "JobDemand",
        back_populates="job_role",
    )


# ============================================================
# SKILL
# ============================================================

class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(150),
        unique=True,
        index=True,
    )

    category: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    is_emerging: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    is_obsolete: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    demand_records = relationship(
        "SkillDemand",
        back_populates="skill",
    )

    gap_records = relationship(
        "SkillGap",
        back_populates="skill",
    )


# ============================================================
# JOB MARKET DEMAND
# ============================================================

class JobDemand(Base):
    __tablename__ = "job_demands"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    job_role_id: Mapped[int] = mapped_column(
        ForeignKey("job_roles.id"),
        index=True,
    )

    sector_id: Mapped[int] = mapped_column(
        ForeignKey("sectors.id"),
        index=True,
    )

    location_id: Mapped[int] = mapped_column(
        ForeignKey("locations.id"),
        index=True,
    )

    posting_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    growth_rate: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    salary_min: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    salary_max: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    demand_level: Mapped[str] = mapped_column(
        String(50),
        default="Medium",
    )

    period: Mapped[str] = mapped_column(
        String(30),
        index=True,
    )

    source: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    job_role = relationship(
        "JobRole",
        back_populates="job_demands",
    )

    sector = relationship(
        "Sector",
        back_populates="job_demands",
    )

    location = relationship(
        "Location",
        back_populates="demands",
    )


# ============================================================
# SKILL DEMAND
# ============================================================

class SkillDemand(Base):
    __tablename__ = "skill_demands"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id"),
        index=True,
    )

    job_role_id: Mapped[int | None] = mapped_column(
        ForeignKey("job_roles.id"),
        nullable=True,
    )

    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.id"),
        nullable=True,
    )

    required_proficiency: Mapped[str] = mapped_column(
        String(50),
    )

    demand_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    growth_rate: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    period: Mapped[str] = mapped_column(
        String(30),
    )

    skill = relationship(
        "Skill",
        back_populates="demand_records",
    )


# ============================================================
# SKILL GAP
# ============================================================

class SkillGap(Base):
    __tablename__ = "skill_gaps"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    skill_id: Mapped[int] = mapped_column(
        ForeignKey("skills.id"),
        index=True,
    )

    job_role_id: Mapped[int | None] = mapped_column(
        ForeignKey("job_roles.id"),
        nullable=True,
    )

    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.id"),
        nullable=True,
    )

    required_proficiency: Mapped[str] = mapped_column(
        String(50),
    )

    current_proficiency: Mapped[str] = mapped_column(
        String(50),
    )

    demand_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    available_candidates: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    gap_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    priority: Mapped[str] = mapped_column(
        String(50),
        default="Medium",
    )

    recommended_course: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    skill = relationship(
        "Skill",
        back_populates="gap_records",
    )


# ============================================================
# COURSE
# ============================================================

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    sector_id: Mapped[int | None] = mapped_column(
        ForeignKey("sectors.id"),
        nullable=True,
    )

    qualification: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    duration_months: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    training_capacity: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    enrolled_students: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    placement_rate: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    alignment_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    demand_level: Mapped[str] = mapped_column(
        String(50),
        default="Medium",
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="Active",
    )

    last_updated: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    curriculum = relationship(
        "Curriculum",
        back_populates="course",
    )


# ============================================================
# CURRICULUM
# ============================================================

class Curriculum(Base):
    __tablename__ = "curriculums"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    course_id: Mapped[int] = mapped_column(
        ForeignKey("courses.id"),
        index=True,
    )

    version: Mapped[str] = mapped_column(
        String(50),
    )

    current_content: Mapped[str] = mapped_column(
        Text,
    )

    industry_requirements: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    alignment_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    update_required: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    course = relationship(
        "Course",
        back_populates="curriculum",
    )


# ============================================================
# EMPLOYER
# ============================================================

class Employer(Base):
    __tablename__ = "employers"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    company_name: Mapped[str] = mapped_column(
        String(200),
        index=True,
    )

    industry: Mapped[str | None] = mapped_column(
        String(150),
        nullable=True,
    )

    sector_id: Mapped[int | None] = mapped_column(
        ForeignKey("sectors.id"),
        nullable=True,
    )

    location: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    company_size: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    sector = relationship(
        "Sector",
        back_populates="employers",
    )

    surveys = relationship(
        "EmployerSurvey",
        back_populates="employer",
    )


# ============================================================
# EMPLOYER SURVEY
# ============================================================

class EmployerSurvey(Base):
    __tablename__ = "employer_surveys"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    employer_id: Mapped[int] = mapped_column(
        ForeignKey("employers.id"),
        index=True,
    )

    job_role: Mapped[str] = mapped_column(
        String(200),
    )

    required_skills: Mapped[str] = mapped_column(
        Text,
    )

    required_proficiency: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    experience_required: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    technology_used: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    expected_hiring: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    salary_min: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    salary_max: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    future_skill_demand: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    hiring_difficulty: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )

    employer = relationship(
        "Employer",
        back_populates="surveys",
    )


# ============================================================
# TRAINER
# ============================================================

class Trainer(Base):
    __tablename__ = "trainers"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
    )

    institute: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    current_skills: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    industry_required_skills: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    skill_gap: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    certifications: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    upskilling_recommendation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    capacity: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )


# ============================================================
# INFRASTRUCTURE
# ============================================================

class Infrastructure(Base):
    __tablename__ = "infrastructure"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    district: Mapped[str] = mapped_column(
        String(100),
        index=True,
    )

    course: Mapped[str] = mapped_column(
        String(200),
    )

    students: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    training_seats: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    computers_required: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    computers_available: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    gpu_required: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    gpu_available: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    labs_required: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    labs_available: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    trainers_required: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    trainers_available: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    internet_required: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    software_requirements: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )


# ============================================================
# DISTRICT TRAINING PLAN
# ============================================================

class DistrictTrainingPlan(Base):
    __tablename__ = "district_training_plans"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    district: Mapped[str] = mapped_column(
        String(100),
        index=True,
    )

    priority_industries: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    priority_job_roles: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    priority_skills: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    recommended_courses: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    student_capacity: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    trainer_capacity: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    equipment_requirements: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    institute_allocation: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    expected_placement: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    generated_by_ai: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )


# ============================================================
# CANDIDATE
# ============================================================

class Candidate(Base):
    __tablename__ = "candidates"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
    )

    location_id: Mapped[int | None] = mapped_column(
        ForeignKey("locations.id"),
        nullable=True,
    )

    education: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    skills: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    target_job: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    career_readiness_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    experience_years: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    certifications: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    location = relationship(
        "Location",
        back_populates="candidates",
    )


# ============================================================
# PLACEMENT OUTCOME
# ============================================================

class PlacementOutcome(Base):
    __tablename__ = "placement_outcomes"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    candidate_id: Mapped[int] = mapped_column(
        ForeignKey("candidates.id"),
        index=True,
    )

    course_id: Mapped[int | None] = mapped_column(
        ForeignKey("courses.id"),
        nullable=True,
    )

    employer_name: Mapped[str | None] = mapped_column(
        String(200),
        nullable=True,
    )

    placed: Mapped[bool] = mapped_column(
        Boolean,
        default=False,
    )

    salary: Mapped[float | None] = mapped_column(
        Float,
        nullable=True,
    )

    skill_match_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    retention_months: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    employer_satisfaction: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    placement_date: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )


# ============================================================
# AI RECOMMENDATION
# ============================================================

class AIRecommendation(Base):
    __tablename__ = "ai_recommendations"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    title: Mapped[str] = mapped_column(
        String(300),
    )

    recommendation: Mapped[str] = mapped_column(
        Text,
    )

    reason: Mapped[str] = mapped_column(
        Text,
    )

    data_evidence: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    expected_impact: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    priority: Mapped[str] = mapped_column(
        String(50),
        default="Medium",
    )

    action: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="Pending",
    )

    confidence_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    generated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )


# ============================================================
# EMPLOYER FEEDBACK
# ============================================================

class EmployerFeedback(Base):
    __tablename__ = "employer_feedback"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    employer_id: Mapped[int] = mapped_column(
        ForeignKey("employers.id"),
        index=True,
    )

    candidate_id: Mapped[int | None] = mapped_column(
        ForeignKey("candidates.id"),
        nullable=True,
    )

    skill_match_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    satisfaction_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    feedback: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    recommended_skill_changes: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )


# ============================================================
# DATA SOURCE
# ============================================================

class DataSource(Base):
    __tablename__ = "data_sources"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
    )

    source_type: Mapped[str] = mapped_column(
        String(100),
    )

    status: Mapped[str] = mapped_column(
        String(50),
        default="Active",
    )

    record_count: Mapped[int] = mapped_column(
        Integer,
        default=0,
    )

    reliability_score: Mapped[float] = mapped_column(
        Float,
        default=0.0,
    )

    last_updated: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True,
    )

    validation_status: Mapped[str] = mapped_column(
        String(100),
        default="Pending",
    )


# ============================================================
# USER
# ============================================================

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(200),
    )

    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        index=True,
    )

    hashed_password: Mapped[str] = mapped_column(
        String(255),
    )

    role: Mapped[str] = mapped_column(
        String(100),
        index=True,
    )

    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    country: Mapped[str] = mapped_column(String(100), default="India")
    email_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    phone_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    organization_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    account_status: Mapped[str] = mapped_column(String(50), default="PENDING_VERIFICATION")
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    failed_login_attempts: Mapped[int] = mapped_column(Integer, default=0)
    locked_until: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        default=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
    )


# ============================================================
# AUDIT LOG (Requirement 3 & 16)
# ============================================================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100), index=True)
    ip_address: Mapped[str | None] = mapped_column(String(100), nullable=True)
    user_agent: Mapped[str | None] = mapped_column(String(255), nullable=True)
    details: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ============================================================
# STUDY SESSIONS & ACTIVE LEARNING TIME (Requirement 19 & 20)
# ============================================================

class StudySession(Base):
    __tablename__ = "study_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    module_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    lesson_id: Mapped[int | None] = mapped_column(Integer, nullable=True)
    activity_type: Mapped[str] = mapped_column(String(50), default="LESSON")  # LESSON, QUIZ, PROJECT, ASSESSMENT
    started_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    duration_seconds: Mapped[int] = mapped_column(Integer, default=0)
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ============================================================
# ORGANIZATION PROFILE (Requirement 9, 10, 11)
# ============================================================

class OrganizationProfile(Base):
    __tablename__ = "organization_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    legal_name: Mapped[str] = mapped_column(String(255))
    org_type: Mapped[str] = mapped_column(String(100))  # employer, training_institute, trainer
    official_email: Mapped[str] = mapped_column(String(255))
    phone: Mapped[str] = mapped_column(String(50))
    country: Mapped[str] = mapped_column(String(100), default="India")
    state: Mapped[str | None] = mapped_column(String(100), nullable=True)
    city: Mapped[str | None] = mapped_column(String(100), nullable=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    website: Mapped[str | None] = mapped_column(String(255), nullable=True)
    registration_number: Mapped[str | None] = mapped_column(String(100), nullable=True)
    sector: Mapped[str | None] = mapped_column(String(100), nullable=True)
    company_size: Mapped[str | None] = mapped_column(String(50), nullable=True)
    authorized_representative: Mapped[str | None] = mapped_column(String(200), nullable=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="PENDING")
    reviewer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================
# STUDENT PROFILE
# ============================================================

class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, index=True)
    full_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    dob: Mapped[str | None] = mapped_column(String(50), nullable=True)
    gender: Mapped[str | None] = mapped_column(String(50), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    
    # Education
    college: Mapped[str | None] = mapped_column(String(200), nullable=True)
    year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    course: Mapped[str | None] = mapped_column(String(200), nullable=True)
    branch: Mapped[str | None] = mapped_column(String(200), nullable=True)
    semester: Mapped[int | None] = mapped_column(Integer, nullable=True)
    graduation_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    
    # Career
    target_role: Mapped[str | None] = mapped_column(String(200), nullable=True)
    preferred_industry: Mapped[str | None] = mapped_column(String(100), nullable=True)
    preferred_location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    work_preference: Mapped[str | None] = mapped_column(String(50), default="Hybrid")
    
    # Skills
    skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    programming_languages: Mapped[str | None] = mapped_column(Text, nullable=True)
    tools_technologies: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Experience
    experience_level: Mapped[str | None] = mapped_column(String(50), default="Fresher")
    internship_experience: Mapped[str | None] = mapped_column(Text, nullable=True)
    projects: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Optional Links & Bio
    linkedin_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    github_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    portfolio_url: Mapped[str | None] = mapped_column(String(255), nullable=True)
    bio: Mapped[str | None] = mapped_column(Text, nullable=True)
    location: Mapped[str | None] = mapped_column(String(100), nullable=True)
    resume_headline: Mapped[str | None] = mapped_column(String(300), nullable=True)
    
    # Real-time calculated scores (not static defaults)
    skill_score: Mapped[float] = mapped_column(Float, default=0.0)
    industry_readiness: Mapped[float] = mapped_column(Float, default=0.0)
    
    # Flags & Planning
    profile_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    onboarding_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    interests: Mapped[str | None] = mapped_column(Text, nullable=True)
    target_completion_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================
# ASSESSMENT QUESTION
# ============================================================

class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    skill_name: Mapped[str] = mapped_column(String(100), index=True)
    question: Mapped[str] = mapped_column(Text)
    option_a: Mapped[str] = mapped_column(String(300))
    option_b: Mapped[str] = mapped_column(String(300))
    option_c: Mapped[str] = mapped_column(String(300))
    option_d: Mapped[str] = mapped_column(String(300))
    correct_option: Mapped[str] = mapped_column(String(5))
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    difficulty: Mapped[str] = mapped_column(String(50), default="Medium")
    category: Mapped[str | None] = mapped_column(String(100), default="Technical")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ============================================================
# ASSESSMENT ATTEMPT & ANSWERS
# ============================================================

class AssessmentAttempt(Base):
    __tablename__ = "assessment_attempts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    total_score: Mapped[int] = mapped_column(Integer, default=0)
    max_score: Mapped[int] = mapped_column(Integer, default=100)
    percentage: Mapped[float] = mapped_column(Float, default=0.0)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    skill_scores_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class AssessmentAnswer(Base):
    __tablename__ = "assessment_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    attempt_id: Mapped[int] = mapped_column(ForeignKey("assessment_attempts.id"), index=True)
    question_id: Mapped[int] = mapped_column(ForeignKey("assessment_questions.id"))
    selected_option: Mapped[str] = mapped_column(String(5))
    is_correct: Mapped[bool] = mapped_column(Boolean, default=False)


# ============================================================
# STUDENT SKILL GAP
# ============================================================

class StudentSkillGap(Base):
    __tablename__ = "student_skill_gaps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    skill_name: Mapped[str] = mapped_column(String(100), index=True)
    current_score: Mapped[float] = mapped_column(Float, default=50.0)
    required_score: Mapped[float] = mapped_column(Float, default=85.0)
    gap_score: Mapped[float] = mapped_column(Float, default=35.0)
    priority: Mapped[str] = mapped_column(String(50), default="High")
    recommended_course: Mapped[str | None] = mapped_column(String(200), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ============================================================
# COURSE MODULE & ENROLLMENT & PROGRESS
# ============================================================

class CourseModule(Base):
    __tablename__ = "course_modules"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    course_id: Mapped[int] = mapped_column(ForeignKey("courses.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    order_num: Mapped[int] = mapped_column(Integer, default=1)
    duration_hours: Mapped[int] = mapped_column(Integer, default=10)
    is_core: Mapped[bool] = mapped_column(Boolean, default=True)


class CourseEnrollment(Base):
    __tablename__ = "course_enrollments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"), nullable=True, index=True)
    external_course_title: Mapped[str | None] = mapped_column(String(255), nullable=True)
    provider: Mapped[str | None] = mapped_column(String(100), default="SARATHI")
    status: Mapped[str] = mapped_column(String(50), default="IN_PROGRESS") # NOT_STARTED, IN_PROGRESS, COMPLETED
    attendance_percentage: Mapped[float] = mapped_column(Float, default=100.0)
    progress_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    grade: Mapped[str | None] = mapped_column(String(20), default="In Progress")
    enrolled_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class CourseProgress(Base):
    __tablename__ = "course_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    enrollment_id: Mapped[int] = mapped_column(ForeignKey("course_enrollments.id"), index=True)
    module_id: Mapped[int] = mapped_column(ForeignKey("course_modules.id"))
    is_completed: Mapped[bool] = mapped_column(Boolean, default=False)
    score: Mapped[float] = mapped_column(Float, default=0.0)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ============================================================
# CERTIFICATES & VERIFICATION
# ============================================================

class Certificate(Base):
    __tablename__ = "certificates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    certificate_number: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    course_id: Mapped[int | None] = mapped_column(ForeignKey("courses.id"), nullable=True, index=True)
    institute_name: Mapped[str] = mapped_column(String(200), default="National Skill Training Institute")
    trainer_name: Mapped[str | None] = mapped_column(String(200), default="Senior Master Trainer")
    student_name: Mapped[str] = mapped_column(String(200))
    course_name: Mapped[str] = mapped_column(String(200))
    issue_date: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    grade: Mapped[str] = mapped_column(String(20), default="A+")
    skills: Mapped[str] = mapped_column(Text, default="Python, FastAPI, SQL, Docker")
    verification_code: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    status: Mapped[str] = mapped_column(String(50), default="Verified")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class VerificationRecord(Base):
    __tablename__ = "verification_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    certificate_code: Mapped[str] = mapped_column(String(100), index=True)
    is_valid: Mapped[bool] = mapped_column(Boolean, default=True)
    verifier_info: Mapped[str | None] = mapped_column(String(255), default="Public Verification Portal")
    verified_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class EntityVerification(Base):
    __tablename__ = "entity_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    entity_type: Mapped[str] = mapped_column(String(50), index=True)  # student, employer, training_institute, trainer
    entity_name: Mapped[str] = mapped_column(String(200))
    document_type: Mapped[str | None] = mapped_column(String(100), nullable=True)
    document_id: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="PENDING", index=True)  # PENDING, UNDER_REVIEW, VERIFIED, REJECTED, SUSPENDED
    reviewer_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    submitted_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    reviewed_by: Mapped[str | None] = mapped_column(String(100), nullable=True)



# ============================================================
# JOBS & CANDIDATE MATCHING & APPLICATIONS
# ============================================================

class JobPosting(Base):
    __tablename__ = "job_postings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employer_user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    title: Mapped[str] = mapped_column(String(200), index=True)
    company_name: Mapped[str] = mapped_column(String(200), index=True)
    location: Mapped[str] = mapped_column(String(100), default="Pune, Maharashtra")
    job_type: Mapped[str] = mapped_column(String(50), default="Full Time")
    experience: Mapped[str] = mapped_column(String(50), default="0-2 Years")
    vacancies: Mapped[int] = mapped_column(Integer, default=5)
    salary_range: Mapped[str | None] = mapped_column(String(100), default="₹4.5 - 7.5 LPA")
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    required_skills: Mapped[str | None] = mapped_column(Text, default="Python, SQL, REST API")
    status: Mapped[str] = mapped_column(String(50), default="Active")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class JobApplication(Base):
    __tablename__ = "job_applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job_postings.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(50), default="Applied")
    cover_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    applied_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class CandidateJobMatch(Base):
    __tablename__ = "candidate_job_matches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    job_id: Mapped[int] = mapped_column(ForeignKey("job_postings.id"), index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    match_percentage: Mapped[float] = mapped_column(Float, default=0.0)
    matching_skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    missing_skills: Mapped[str | None] = mapped_column(Text, nullable=True)
    calculated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ============================================================
# CAREER ROADMAP & DATASET IMPORT
# ============================================================

class CareerRoadmap(Base):
    __tablename__ = "career_roadmaps"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    target_role: Mapped[str] = mapped_column(String(200))
    current_level: Mapped[str] = mapped_column(String(100), default="Developing")
    steps_json: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class DatasetImport(Base):
    __tablename__ = "dataset_imports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    filename: Mapped[str] = mapped_column(String(255))
    row_count: Mapped[int] = mapped_column(Integer, default=0)
    source_name: Mapped[str] = mapped_column(String(200), default="Labour Market Survey")
    status: Mapped[str] = mapped_column(String(50), default="Processed")
    summary_json: Mapped[str | None] = mapped_column(Text, nullable=True)
    imported_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ============================================================
# AUTHENTICATION & SECURITY: OTP & REFRESH TOKENS
# ============================================================

class OtpVerification(Base):
    __tablename__ = "otp_verifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    recipient: Mapped[str] = mapped_column(String(255), index=True)  # email or phone number
    purpose: Mapped[str] = mapped_column(String(50), index=True)    # email_verification, phone_verification, password_reset
    otp_hash: Mapped[str] = mapped_column(String(255))               # SHA-256 hash of 6-digit OTP
    attempts: Mapped[int] = mapped_column(Integer, default=0)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3)
    expires_at: Mapped[datetime] = mapped_column(DateTime, index=True)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ============================================================
# STUDENT UPLOADED CERTIFICATES
# ============================================================

class StudentUploadedCertificate(Base):
    __tablename__ = "student_uploaded_certificates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    title: Mapped[str] = mapped_column(String(200))
    issuing_organization: Mapped[str] = mapped_column(String(200))
    issue_date: Mapped[str | None] = mapped_column(String(50), nullable=True)
    credential_id: Mapped[str | None] = mapped_column(String(150), nullable=True)
    credential_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    file_hash_sha256: Mapped[str] = mapped_column(String(64), index=True)
    verification_status: Mapped[str] = mapped_column(String(50), default="PENDING", index=True)  # PENDING, VERIFIED, REJECTED, UNVERIFIED
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    verified_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


# ============================================================
# PAYMENT TRANSACTIONS (RAZORPAY ABSTRACTION)
# ============================================================

class PaymentTransaction(Base):
    __tablename__ = "payment_transactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    order_id: Mapped[str] = mapped_column(String(150), unique=True, index=True)
    payment_id: Mapped[str | None] = mapped_column(String(150), nullable=True)
    amount: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(10), default="INR")
    purpose: Mapped[str] = mapped_column(String(150), default="Course Enrollment")
    status: Mapped[str] = mapped_column(String(50), default="created")  # created, paid, failed, simulated
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)