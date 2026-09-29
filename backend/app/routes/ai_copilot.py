from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User
from ..services.ai_service import (
    get_ai_provider_status,
    generate_daily_learning_plan,
    process_copilot_query,
)
from ..routes.students import get_optional_user_id

router = APIRouter()


class CopilotQueryRequest(BaseModel):
    query: str


@router.get("/status")
def ai_status():
    return {
        "success": True,
        "platform": "SARATHI",
        "copilot": "SARATHI Career & Learning Copilot",
        "info": get_ai_provider_status(),
    }


@router.get("/daily-plan")
def get_daily_plan(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)
    plan = generate_daily_learning_plan(db, user_id)
    return {
        "success": True,
        "data": plan,
    }


@router.post("/copilot")
def query_copilot(
    request: CopilotQueryRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    user_id = get_optional_user_id(authorization, db)
    response = process_copilot_query(db, user_id, request.query)
    return response


@router.get("/quick-actions")
def get_quick_actions():
    return {
        "success": True,
        "actions": [
            {
                "id": "today",
                "label": "What should I learn today?",
                "query": "What should I learn today?",
                "icon": "zap",
            },
            {
                "id": "why",
                "label": "Why is this skill recommended for me?",
                "query": "Why is this skill recommended for me?",
                "icon": "help-circle",
            },
            {
                "id": "career",
                "label": "Which career role suits my profile best?",
                "query": "Which career role suits my skills and profile best?",
                "icon": "briefcase",
            },
            {
                "id": "plan",
                "label": "How can I bridge my highest skill gap?",
                "query": "How can I bridge my highest skill gap in 30 days?",
                "icon": "trending-up",
            },
        ],
    }
