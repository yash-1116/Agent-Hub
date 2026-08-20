import re


HIGH_RISK_RULES = {
    "fake invoice": (45, "Explicitly describes the invoice as fake."),
    "fraudulent invoice": (45, "Explicitly describes the invoice as fraudulent."),
    "invalid gstin": (35, "Invoice contains an invalid GSTIN."),
    "calculation mismatch": (35, "Invoice totals do not match the calculation."),
    "invoice number is duplicate": (35, "Invoice number is marked as a duplicate."),
    "duplicate invoice": (30, "Invoice appears to be a duplicate."),
    "seed phrase": (35, "Requests a wallet seed or recovery phrase."),
    "recovery phrase": (35, "Requests a wallet seed or recovery phrase."),
    "private key": (40, "Requests a private key or secret credential."),
    "secret key": (40, "Requests a private key or secret credential."),
    "verify your wallet": (30, "Requests wallet verification through an untrusted message."),
    "connect your wallet": (25, "Requests connecting a wallet to complete the payment."),
    "free 100 usdc": (35, "Promises an unusually attractive free crypto reward."),
    "free usdc": (30, "Promises an unusually attractive free crypto reward."),
    "urgent payment": (25, "Uses urgent payment language."),
    "send crypto immediately": (35, "Pressures the recipient to send crypto immediately."),
}

MEDIUM_RISK_RULES = {
    "amount mismatch": (25, "Invoice amount does not match the expected amount."),
    "tax mismatch": (25, "Invoice tax details do not match the expected values."),
    "payment details changed": (25, "Invoice requests payment using changed details."),
    "beneficiary changed": (25, "Invoice requests payment to a changed beneficiary."),
    "invalid date": (20, "Invoice contains an invalid date."),
    "negative quantity": (30, "Invoice contains a negative item quantity."),
    "negative amount": (30, "Invoice contains a negative line amount."),
    "same as billing": (20, "Shipping and billing details are flagged as identical."),
    "overpriced item": (20, "Invoice contains an unusually overpriced item."),
    "stamp mismatch": (20, "Company stamp or location does not match the invoice details."),
    "wrong date": (20, "Invoice contains an incorrect or inconsistent date."),
    "wrong gstin": (30, "Invoice GSTIN is marked as incorrect."),
    "past due": (10, "Invoice is past its stated due date."),
    "overdue": (10, "Invoice is marked overdue."),
    "click this link": (15, "Directs the recipient to click an external link."),
    "click the link": (15, "Directs the recipient to click an external link."),
    "limited time": (10, "Uses limited-time pressure."),
    "act now": (10, "Uses urgency to discourage verification."),
    "urgent": (10, "Uses urgent language."),
    "guaranteed profit": (20, "Promises guaranteed profit or returns."),
    "guaranteed return": (20, "Promises guaranteed profit or returns."),
    "giveaway": (15, "References a giveaway or reward."),
}


def find_matches(normalized_text: str, rules: dict) -> tuple[list[str], list[str], int]:
    matches = []
    explanations = []
    score = 0

    for phrase, (weight, explanation) in rules.items():
        if phrase in normalized_text:
            matches.append(phrase)
            explanations.append(explanation)
            score += weight

    return matches, explanations, score


def analyze_fraud(text: str) -> dict:
    """Score invoice or payment text using explainable fraud indicators."""

    text = str(text or "").strip()
    normalized_text = " ".join(text.lower().split())

    high_matches, high_reasons, high_score = find_matches(
        normalized_text,
        HIGH_RISK_RULES,
    )
    medium_matches, medium_reasons, medium_score = find_matches(
        normalized_text,
        MEDIUM_RISK_RULES,
    )

    if re.search(r"(?:invoice|total|amount|payment)\s*[:#-]?\s*\$?0(?:\.0+)?\b", normalized_text):
        medium_matches.append("zero invoice amount")
        medium_reasons.append("Invoice contains a zero payment amount.")
        medium_score += 15

    if re.search(r"(?:bank|account|upi|wallet).{0,40}(?:changed|change|new|updated)", normalized_text):
        medium_matches.append("changed payment details")
        medium_reasons.append("Invoice requests payment to changed or new account details.")
        medium_score += 25

    if re.search(r"(?:negative\s+(?:quantity|amount)|quantity\s*[-:]?\s*-\d|amount\s*[-:]?\s*-\d)", normalized_text):
        if "negative quantity" not in medium_matches:
            medium_matches.append("negative quantity or amount")
            medium_reasons.append("Invoice contains a negative quantity or amount.")
            medium_score += 30

    risk_score = min(100, 10 + high_score + medium_score)

    if risk_score >= 80:
        risk_level = "CRITICAL"
        message = "Strong evidence of a potentially fraudulent or scam document."
        recommendation = "Stop processing and do not approve payment until the document and sender have been independently verified."
    elif risk_score >= 60:
        risk_level = "HIGH"
        message = "Multiple significant fraud indicators detected."
        recommendation = "Do not proceed with payment until the suspicious indicators have been verified."
    elif risk_score >= 30:
        risk_level = "MEDIUM"
        message = "Some suspicious characteristics were detected."
        recommendation = "Verify the sender, invoice details, and payment destination before paying."
    else:
        risk_level = "LOW"
        message = "No significant fraud indicators detected."
        recommendation = "Continue with normal verification procedures."

    return {
        "riskScore": risk_score,
        "riskLevel": risk_level,
        "risk": risk_level.lower(),
        "message": message,
        "indicators": high_matches + medium_matches,
        "riskFactors": high_matches + medium_matches,
        "indicatorDetails": high_reasons + medium_reasons,
        "explanation": message if not high_reasons and not medium_reasons else " ".join(high_reasons + medium_reasons),
        "recommendation": recommendation,
        "recommendedAction": recommendation,
        "input": text,
        "highRiskIndicators": high_matches,
        "mediumRiskIndicators": medium_matches,
    }
