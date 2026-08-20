from fastapi import FastAPI
from .fraud import analyze_fraud


app = FastAPI(
    title="AgentHub Fraud Agent",
    version="1.0.0",
)


@app.get("/")
def health():
    return {
        "success": True,
        "service": "Fraud Agent",
        "status": "running",
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "service": "Fraud Agent",
        "status": "running",
    }


@app.post("/run")
def run_agent(payload: dict):
    text = payload.get("text", "")

    result = analyze_fraud(text)

    return {
        "success": True,
        "agent": "Fraud Agent",
        "result": result,
    }