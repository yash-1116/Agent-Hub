import re
from datetime import datetime


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


def parse_amount(value: str) -> float:
    return float(re.sub(r"[^0-9.-]", "", value.replace(",", "")))


def labelled_amounts(text: str, labels: tuple[str, ...]) -> list[float]:
    label_pattern = "|".join(labels)
    return [parse_amount(value) for value in re.findall(
        rf"(?<![A-Za-z])(?:{label_pattern})(?![A-Za-z])\s*(?:\([^)]*\))?\s*[:=\-]?\s*[₹$€£]?\s*(-?[\d,]+(?:\.\d{{1,2}})?)",
        text,
        re.IGNORECASE,
    )]


def parse_date(value: str) -> datetime | None:
    for date_format in ("%d/%m/%Y", "%d-%m-%Y", "%d/%m/%y", "%d-%m-%y", "%d %B %Y", "%d %b %Y"):
        try:
            return datetime.strptime(value.strip(), date_format)
        except ValueError:
            continue
    return None


NUMBER_WORDS = {
    "zero": 0, "one": 1, "two": 2, "three": 3, "four": 4, "five": 5,
    "six": 6, "seven": 7, "eight": 8, "nine": 9, "ten": 10,
    "eleven": 11, "twelve": 12, "thirteen": 13, "fourteen": 14,
    "fifteen": 15, "sixteen": 16, "seventeen": 17, "eighteen": 18,
    "nineteen": 19, "twenty": 20, "thirty": 30, "forty": 40,
    "fifty": 50, "sixty": 60, "seventy": 70, "eighty": 80, "ninety": 90,
}


def number_words_to_value(words: str) -> int | None:
    current = 0
    total = 0
    found = False
    for word in re.split(r"[ -]+", words.lower()):
        if word in NUMBER_WORDS:
            current += NUMBER_WORDS[word]
            found = True
        elif word == "hundred":
            current = max(1, current) * 100
            found = True
        elif word in ("thousand", "lakh", "million", "crore"):
            scale = {"thousand": 1000, "lakh": 100000, "million": 1000000, "crore": 10000000}[word]
            total += current * scale
            current = 0
            found = True
    return total + current if found else None


def invoice_criteria(text: str) -> tuple[list[str], list[str], int, int, list[str], list[str]]:
    matches = []
    reasons = []
    high = []
    medium = []
    high_score = 0
    medium_score = 0

    def add(name: str, explanation: str, weight: int, severity: str = "medium") -> None:
        nonlocal high_score, medium_score
        matches.append(name)
        reasons.append(explanation)
        if severity == "high":
            high_score += weight
            high.append(name)
        else:
            medium_score += weight
            medium.append(name)

    line_items = []
    for line in text.splitlines():
        item_match = re.search(
            r"(?:qty|quantity)?\s*[:#-]?\s*(-?\d+(?:\.\d+)?)\s*(?:x|@|\s+)\s*₹?\s*(-?[\d,]+(?:\.\d+)?)\s*(?:=|amount|₹|$)?\s*(-?[\d,]+(?:\.\d+)?)?",
            line,
            re.IGNORECASE,
        )
        if item_match and ("qty" in line.lower() or "quantity" in line.lower() or " x " in line.lower()):
            quantity = float(item_match.group(1))
            unit_price = parse_amount(item_match.group(2))
            amount = parse_amount(item_match.group(3)) if item_match.group(3) else quantity * unit_price
            line_items.append((line.strip().lower(), quantity, unit_price, amount))
            if quantity * unit_price != amount and abs(quantity * unit_price - amount) > 0.01:
                add("line calculation", "Line quantity multiplied by unit price does not equal the line amount.", 30, "high")
            if quantity < 0:
                add("negative quantity", "Invoice contains a negative item quantity.", 30, "high")
            if unit_price < 0:
                add("negative unit price", "Invoice contains a negative unit price.", 30, "high")
            if unit_price <= 1 and quantity >= 10000:
                add("suspicious unit price", "A very low unit price is paired with an unusually large quantity.", 15)

    item_amounts = [item[3] for item in line_items]
    subtotals = labelled_amounts(text, ("subtotal", "sub total"))
    taxes = labelled_amounts(text, ("tax", "gst", "vat"))
    totals = labelled_amounts(text, ("grand total", "total amount", "amount due", "total"))
    discounts = [float(value) for value in re.findall(r"discount\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%", text, re.IGNORECASE)]

    if item_amounts and subtotals and abs(sum(item_amounts) - subtotals[-1]) > 0.01:
        add("subtotal mismatch", "The sum of invoice line items does not equal the stated subtotal.", 30, "high")

    tax_rate_match = re.search(r"(?:tax|gst|vat)\s*(?:rate)?\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%", text, re.IGNORECASE)
    taxable_amounts = labelled_amounts(text, ("taxable amount", "taxable value"))
    if tax_rate_match and taxable_amounts and taxes:
        expected_tax = taxable_amounts[-1] * float(tax_rate_match.group(1)) / 100
        if abs(expected_tax - taxes[-1]) > max(0.01, taxable_amounts[-1] * 0.005):
            add("tax calculation", "The stated tax rate does not produce the displayed tax amount.", 30, "high")

    if subtotals and totals and taxes:
        discount_amounts = labelled_amounts(text, ("discount",))
        expected_total = subtotals[-1] + taxes[-1] - (discount_amounts[-1] if discount_amounts else 0)
        if abs(expected_total - totals[-1]) > 0.01:
            add("grand total mismatch", "Subtotal plus tax minus discount does not equal the stated grand total.", 30, "high")

    invoice_date_match = re.search(r"invoice\s*date\s*[:=\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})", text, re.IGNORECASE)
    due_date_match = re.search(r"due\s*date\s*[:=\-]?\s*(\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{1,2}\s+[A-Za-z]+\s+\d{4})", text, re.IGNORECASE)
    invoice_date = parse_date(invoice_date_match.group(1)) if invoice_date_match else None
    due_date = parse_date(due_date_match.group(1)) if due_date_match else None
    if invoice_date_match and not invoice_date:
        add("invalid date", "Invoice contains an invalid invoice date.", 30, "high")
    if due_date_match and not due_date:
        add("invalid date", "Invoice contains an invalid due date.", 30, "high")
    if invoice_date and due_date and due_date < invoice_date:
        add("date relationship", "The due date occurs before the invoice date.", 20)

    if any(value > 100 for value in discounts):
        add("unusual discount", "Invoice discount exceeds 100 percent.", 30, "high")
    if totals and totals[-1] < 0:
        add("negative total", "Invoice grand total is negative without clear credit-note context.", 30, "high")
    if re.search(r"(?:cgst|sgst)\s*[:=]?\s*\d+(?:\.\d+)?\s*%", text, re.IGNORECASE) and tax_rate_match:
        component_rates = [float(value) for value in re.findall(r"(?:cgst|sgst)\s*[:=]?\s*(\d+(?:\.\d+)?)\s*%", text, re.IGNORECASE)]
        if component_rates and abs(sum(component_rates) - float(tax_rate_match.group(1))) > 0.01:
            add("tax inconsistency", "CGST and SGST rates do not match the stated total tax rate.", 30, "high")

    words_match = re.search(r"(?:amount in words|total in words|rupees in words)\s*[:=\-]?\s*([A-Za-z -]+?)(?:\bonly\b|$|\n)", text, re.IGNORECASE)
    if words_match and totals:
        words_amount = number_words_to_value(words_match.group(1))
        if words_amount is not None and abs(words_amount - totals[-1]) > 0.01:
            add("amount in words mismatch", "The numeric total does not match the amount written in words.", 20)

    required_fields = ("invoice", "date", "vendor", "seller", "bill to", "customer")
    if not re.search(r"invoice\s*(?:number|no\.?|#)\s*[:#-]?\s*\S+", text, re.IGNORECASE) or not invoice_date_match or not re.search(r"(?:vendor|seller|issued by|bill from)\s*[:#-]?\s*\S+", text, re.IGNORECASE):
        add("missing mandatory information", "Invoice is missing an invoice number, date, or vendor detail.", 15)

    gstin_values = re.findall(r"gstin\s*[:#-]?\s*([A-Z0-9]+)", text, re.IGNORECASE)
    for gstin in gstin_values:
        if not re.fullmatch(r"\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d", gstin, re.IGNORECASE):
            add("invalid tax/GST format", "Invoice contains a malformed GSTIN.", 15)
            break

    if totals and len(set(round(value, 2) for value in totals)) > 1:
        add("amount inconsistency", "The invoice shows different total amounts in different sections.", 30, "high")
    currencies = set(re.findall(r"₹|\bINR\b|\$|\bUSD\b|€|\bEUR\b|£|\bGBP\b", text, re.IGNORECASE))
    if len(currencies) > 1:
        add("currency inconsistency", "Invoice uses multiple currencies without a clear conversion.", 15)
    normalized_lines = [re.sub(r"\s+", " ", item[0]) for item in line_items]
    if len(normalized_lines) != len(set(normalized_lines)):
        add("duplicate line item", "The same invoice line item appears more than once.", 15)
    if re.search(r"(?:altered|tampered|overlaid|edited|manipulated)\s+(?:amount|invoice|document)|amount\s+(?:altered|overlaid|edited)", text, re.IGNORECASE):
        add("document tampering", "Invoice text indicates that the document or amount may have been altered.", 35, "high")

    return matches, reasons, high_score, medium_score, high, medium


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
    invoice_matches, invoice_reasons, invoice_high_score, invoice_medium_score, invoice_high, invoice_medium = invoice_criteria(text)
    high_matches.extend(invoice_high)
    high_reasons.extend(reason for name, reason in zip(invoice_matches, invoice_reasons) if name in invoice_high)
    medium_matches.extend(invoice_medium)
    medium_reasons.extend(reason for name, reason in zip(invoice_matches, invoice_reasons) if name in invoice_medium)
    high_score += invoice_high_score
    medium_score += invoice_medium_score

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
