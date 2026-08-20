from fastapi import FastAPI
from pydantic import BaseModel

from .summarizer import summarize_text

app = FastAPI(title="AgentHub Summary Agent")


class AgentInput(BaseModel):
    text: str


@app.get("/")
def health():
    return {
        "success": True,
        "service": "Summary Agent",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "success": True,
        "service": "Summary Agent",
        "status": "healthy"
    }


@app.post("/run")
def run_agent(data: AgentInput):
    text = data.text.strip()

    if not text:
        return {
            "success": False,
            "message": "No text provided"
        }

    result = summarize_text(text)

    return {
        "success": True,
        "agent": "Summary Agent",
        **result,
    }
