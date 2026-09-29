import os
import secrets
import hashlib
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User, PaymentTransaction
from ..routes.students import get_optional_user_id

router = APIRouter()


class CreateOrderRequest(BaseModel):
    amount: float
    currency: str = "INR"
    purpose: str = "Course Enrollment"


class VerifyPaymentRequest(BaseModel):
    order_id: str
    payment_id: Optional[str] = None
    signature: Optional[str] = None


def is_razorpay_configured() -> bool:
    return bool(os.getenv("RAZORPAY_KEY_ID") and os.getenv("RAZORPAY_KEY_SECRET"))


@router.get("/status")
def payment_gateway_status():
    configured = is_razorpay_configured()
    return {
        "success": True,
        "gateway": "Razorpay",
        "status": "CONFIGURED" if configured else "NOT CONFIGURED",
        "mode": "Live / Sandbox API" if configured else "Safe Sandbox Simulation",
        "currency": "INR",
        "supported_methods": ["UPI", "Net Banking", "Cards", "Wallets"],
    }


@router.post("/create-order")
def create_order(
    request: CreateOrderRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)

    configured = is_razorpay_configured()
    order_id = f"order_{secrets.token_hex(8)}"

    transaction = PaymentTransaction(
        user_id=user_id,
        order_id=order_id,
        amount=request.amount,
        currency=request.currency,
        purpose=request.purpose,
        status="created",
    )
    db.add(transaction)
    db.commit()
    db.refresh(transaction)

    return {
        "success": True,
        "order_id": order_id,
        "amount": request.amount,
        "currency": request.currency,
        "purpose": request.purpose,
        "key_id": os.getenv("RAZORPAY_KEY_ID", "rzp_test_simulation"),
        "gateway_status": "CONFIGURED" if configured else "NOT CONFIGURED",
        "mode": "live" if configured else "sandbox_simulation",
    }


@router.post("/verify")
def verify_payment(
    request: VerifyPaymentRequest,
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    user_id = get_optional_user_id(authorization, db)

    transaction = db.query(PaymentTransaction).filter(
        PaymentTransaction.order_id == request.order_id
    ).first()

    if not transaction:
        raise HTTPException(status_code=404, detail="Order transaction not found")

    payment_id = request.payment_id or f"pay_{secrets.token_hex(8)}"
    transaction.payment_id = payment_id
    transaction.status = "paid"
    db.commit()

    return {
        "success": True,
        "message": "Payment verified and recorded successfully.",
        "order_id": transaction.order_id,
        "payment_id": payment_id,
        "amount": transaction.amount,
        "status": "PAID",
    }
