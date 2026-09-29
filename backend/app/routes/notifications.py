from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


# ============================================================
# NOTIFICATION DATA
# ============================================================

NOTIFICATIONS = [
    {
        "id": 1,
        "title": "New Skill Demand Detected",
        "message": "Generative AI demand has increased significantly.",
        "type": "skill_demand",
        "priority": "High",
        "read": False,
    },
    {
        "id": 2,
        "title": "Curriculum Update Recommended",
        "message": "Several emerging skills should be considered for curriculum updates.",
        "type": "curriculum",
        "priority": "Medium",
        "read": False,
    },
    {
        "id": 3,
        "title": "New Training Program",
        "message": "A new AI & Machine Learning training program is available.",
        "type": "training",
        "priority": "Medium",
        "read": True,
    },
    {
        "id": 4,
        "title": "Industry Demand Alert",
        "message": "Cloud Computing skills are showing strong market demand.",
        "type": "market",
        "priority": "High",
        "read": False,
    },
]


# ============================================================
# NOTIFICATION REQUEST
# ============================================================

class NotificationRequest(BaseModel):
    title: str
    message: str
    type: str = "general"
    priority: str = "Medium"


# ============================================================
# GET NOTIFICATIONS
# ============================================================

@router.get("/")
def get_notifications(
    unread_only: bool = False,
    notification_type: Optional[str] = None,
):

    results = NOTIFICATIONS

    if unread_only:
        results = [
            notification
            for notification in results
            if not notification["read"]
        ]

    if notification_type:
        results = [
            notification
            for notification in results
            if notification["type"].lower()
            == notification_type.lower()
        ]

    return {
        "success": True,
        "count": len(results),
        "data": results,
    }


# ============================================================
# UNREAD COUNT
# ============================================================

@router.get("/unread-count")
def unread_count():

    count = sum(
        1
        for notification in NOTIFICATIONS
        if not notification["read"]
    )

    return {
        "success": True,
        "data": {
            "unread_count": count,
        },
    }


# ============================================================
# GET NOTIFICATION BY ID
# ============================================================

@router.get("/{notification_id}")
def get_notification(notification_id: int):

    for notification in NOTIFICATIONS:

        if notification["id"] == notification_id:
            return {
                "success": True,
                "data": notification,
            }

    return {
        "success": False,
        "message": "Notification not found",
    }


# ============================================================
# MARK AS READ
# ============================================================

@router.put("/{notification_id}/read")
def mark_as_read(notification_id: int):

    for notification in NOTIFICATIONS:

        if notification["id"] == notification_id:

            notification["read"] = True

            return {
                "success": True,
                "message": "Notification marked as read",
                "data": notification,
            }

    return {
        "success": False,
        "message": "Notification not found",
    }


# ============================================================
# MARK ALL AS READ
# ============================================================

@router.put("/read-all")
def mark_all_as_read():

    for notification in NOTIFICATIONS:
        notification["read"] = True

    return {
        "success": True,
        "message": "All notifications marked as read",
    }


# ============================================================
# CREATE NOTIFICATION
# ============================================================

@router.post("/")
def create_notification(
    request: NotificationRequest,
):

    new_id = (
        max(
            notification["id"]
            for notification in NOTIFICATIONS
        )
        + 1
    )

    notification = {
        "id": new_id,
        "title": request.title,
        "message": request.message,
        "type": request.type,
        "priority": request.priority,
        "read": False,
    }

    NOTIFICATIONS.append(notification)

    return {
        "success": True,
        "message": "Notification created",
        "data": notification,
    }


# ============================================================
# MODULE STATUS
# ============================================================

@router.get("/status/check")
def notifications_status():

    return {
        "success": True,
        "module": "notifications",
        "status": "working",
    }
    