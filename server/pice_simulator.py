"""
Pice Payment Gateway Simulator
Simulates B2B payment settlement for agricultural transactions.
In production, this would integrate with the actual Pice API.
"""

import uuid
import time
from datetime import datetime, timezone


# Configuration
TRANSACTION_FEE_PERCENT = 1.5
MIN_TRUST_SCORE = 70.0
SETTLEMENT_CURRENCY = "INR"


def generate_transaction_id() -> str:
    """Generate a unique Pice-style transaction ID."""
    return f"PICE-AG-{uuid.uuid4().hex[:12].upper()}"


def calculate_fees(amount: float) -> dict:
    """Calculate transaction fees and net settlement amount."""
    fee = round(amount * (TRANSACTION_FEE_PERCENT / 100), 2)
    net = round(amount - fee, 2)
    return {
        "gross_amount": amount,
        "fee_percent": TRANSACTION_FEE_PERCENT,
        "fee_amount": fee,
        "net_settlement": net,
        "currency": SETTLEMENT_CURRENCY,
    }


def validate_eligibility(trust_score: float) -> dict:
    """Check if a transaction meets the trust score threshold."""
    eligible = trust_score >= MIN_TRUST_SCORE
    return {
        "eligible": eligible,
        "trust_score": round(trust_score, 2),
        "threshold": MIN_TRUST_SCORE,
        "reason": (
            "Trust score meets compliance threshold"
            if eligible
            else f"Trust score {trust_score:.1f} below minimum threshold {MIN_TRUST_SCORE}"
        ),
    }


def process_payout(
    trust_score: float,
    invoice_amount: float,
    seller_id: str,
    invoice_date: str = None,
) -> dict:
    """
    Simulate a full Pice payout transaction.

    Args:
        trust_score: Composite trust score (0-100)
        invoice_amount: Invoice total amount
        seller_id: Seller/supplier identifier
        invoice_date: Date from the invoice

    Returns:
        Complete transaction record with settlement details
    """
    # Step 1: Validate eligibility
    eligibility = validate_eligibility(trust_score)

    if not eligibility["eligible"]:
        return {
            "status": "REJECTED",
            "transaction_id": None,
            "eligibility": eligibility,
            "settlement": None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    # Step 2: Calculate fees
    fees = calculate_fees(invoice_amount)

    # Step 3: Generate transaction record
    transaction_id = generate_transaction_id()

    # Step 4: Simulate processing delay (in production, this would be async)
    settlement_record = {
        "status": "SETTLED",
        "transaction_id": transaction_id,
        "eligibility": eligibility,
        "seller": {
            "id": seller_id,
            "invoice_date": invoice_date or datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        },
        "settlement": {
            **fees,
            "method": "PICE_B2B_INSTANT",
            "settlement_time_ms": 1847,  # Simulated latency
            "reference": f"REF-{uuid.uuid4().hex[:8].upper()}",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "ledger_entry": {
            "debit_account": "AGROTRUST_ESCROW",
            "credit_account": f"SELLER_{seller_id}",
            "amount": fees["net_settlement"],
            "currency": SETTLEMENT_CURRENCY,
            "narration": f"Crop supply settlement - Trust Score: {trust_score:.1f}",
        },
    }

    return settlement_record
