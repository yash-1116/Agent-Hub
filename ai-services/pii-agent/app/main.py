import re
from fastapi import FastAPI


app = FastAPI(
    title="AgentHub PII Detection Agent",
    version="1.0.0",
)

PATTERNS = {
    "name": re.compile(r"(?im)\b(?:name|customer|patient|employee)[ \t]*[:\-][ \t]*([A-Z][a-z]+(?:[ \t]+[A-Z][a-z]+){1,3})"),
    "address": re.compile(r"(?im)\baddress\s*[:\-]\s*([^\n]+)"),
    "aadhaar": re.compile(r"(?<!\d)\d{4}[ -]\d{4}[ -]\d{4}(?![ -]\d)"),
    "pan": re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b", re.IGNORECASE),
    "gstin": re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d\b", re.IGNORECASE),
    "ip_address": re.compile(r"\b(?:\d{1,3}\.){3}\d{1,3}\b"),
    "date_of_birth": re.compile(r"\b(?:0?[1-9]|[12]\d|3[01])[/.-](?:0?[1-9]|1[0-2])[/.-](?:19|20)\d{2}\b"),
    "passport": re.compile(r"\b[A-Z]{1,2}\d{7,8}\b", re.IGNORECASE),
    "vehicle_number": re.compile(r"\b[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}\b", re.IGNORECASE),
    "email": re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b"),
    "phone": re.compile(r"(?:\+\d{1,3}[\s.-])(?:\d[\s.-]?){8,}\d|(?<![\d.])(?:\d{3}[-.\s]){2}\d{4}(?![\d.])"),
    "ssn": re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "credit_card": re.compile(r"(?<!\d)(?:\d[ -]?){13,19}(?!\d)"),
    "bank_account": re.compile(r"\b\d{9,18}\b"),
}


def detect_pii(text: str) -> dict:
    findings = []
    for pii_type, pattern in PATTERNS.items():
        matches = list(pattern.finditer(text))
        if matches:
            findings.append({"type": pii_type, "count": len(matches), "values": [match.group(1) if match.lastindex else match.group(0) for match in matches]})

    return {
        "detected": bool(findings),
        "findings": findings,
        "message": "Sensitive information detected." if findings else "No common sensitive information detected.",
    }


@app.get("/")
def health():
    return {"success": True, "service": "PII Detection Agent", "status": "running"}


@app.get("/health")
def health_check():
    return {"success": True, "service": "PII Detection Agent", "status": "running"}


@app.post("/run")
def run_agent(payload: dict):
    text = payload.get("text") or ""
    result = detect_pii(text)
    return {"success": True, "agent": "PII Detection Agent", "result": result}
