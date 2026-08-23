import re
from fastapi import FastAPI


app = FastAPI(
    title="AgentHub PII Detection Agent",
    version="1.0.0",
)

PATTERNS = {
    "bank_name": re.compile(r"(?im)\bbank\s+name[ \t]*[:=\-][ \t]*([A-Za-z][A-Za-z .&'-]*[A-Za-z])(?=\s*(?:\([^\n)]*\)|\d|,|$))"),
    "bank_account_number": re.compile(r"(?im)\b(?:bank\s+account|account)\s+(?:number|no\.?|#)[ \t]*[:=\-]?[ \t]*([0-9][0-9 -]{7,16}[0-9])"),
    "ifsc_code": re.compile(r"\b[A-Z]{4}0[A-Z0-9]{6}\b", re.IGNORECASE),
    "branch": re.compile(r"(?im)\bbranch[ \t]*(?:name)?[ \t]*[:=\-][ \t]*([^\n,]+)"),
    "account_name": re.compile(r"(?im)\b(?:account|a\/c)\s+name[ \t]*[:=\-][ \t]*([A-Za-z][A-Za-z .&'-]*?[A-Za-z])(?=\s+(?:sgst|cgst|igst|ifsc|gstin|pan|branch|bank|payment|account)\b|\s*(?:\([^\n)]*\)|@|\d|,|$))"),
    "gstin": re.compile(r"\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z]\d\b", re.IGNORECASE),
    "pan": re.compile(r"\b[A-Z]{5}\d{4}[A-Z]\b", re.IGNORECASE),
    "email": re.compile(r"\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b"),
    "phone": re.compile(r"(?:\+\d{1,3}[\s.-])(?:\d[\s.-]?){8,}\d|(?<![\d.])(?:\d{3}[-.\s]){2}\d{4}(?![\d.])"),
    "website": re.compile(r"(?<![@\w])(?:https?://)?(?:www\.)?([a-z][a-z0-9-]*(?:\.[a-z0-9-]+)*\.[a-z]{2,63})(?:/[^\s<]*)?\b", re.IGNORECASE),
    "payment_method": re.compile(r"(?im)\b(?:payment|pay)\s+method[ \t]*[:=\-][ \t]*([^\n,]+)"),
    "wallet_address": re.compile(r"(?im)\b(?:wallet|wallet\s+address)[ \t]*[:=\-][ \t]*([A-Z0-9]{20,})"),
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
