from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from .config import (
    AGENT_NAME,
    HOST,
    PORT,
    MAX_FILE_SIZE_BYTES,
)
from .ocr import process_image


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=AGENT_NAME,
    version="1.0.0",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODEL
# ============================================================

class OCRRequest(BaseModel):
    workflowId: str
    file: str
    task: str = "ocr"

    # Optional text input.
    hasText: bool = False
    text: Optional[str] = None

    # Image sent as base64.
    hasImageBase64: bool = False
    imageBase64: Optional[str] = None


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
async def root():
    return {
        "success": True,
        "agent": AGENT_NAME,
        "status": "running",
        "port": PORT,
    }


@app.get("/health")
async def health():
    return {
        "success": True,
        "agent": AGENT_NAME,
        "status": "healthy",
    }


# ============================================================
# OCR ENDPOINT
# ============================================================

@app.post("/run")
async def run_ocr(request: OCRRequest):

    print(
        "OCR /run request received:",
        {
            "workflowId": request.workflowId,
            "file": request.file,
            "task": request.task,
            "hasText": request.hasText,
            "hasImageBase64": request.hasImageBase64,
        },
    )

    try:

        # ----------------------------------------------------
        # IMAGE OCR
        # ----------------------------------------------------

        if request.hasImageBase64 and request.imageBase64:

            # Rough decoded-size check.
            # Base64 is approximately 4/3 the original size.
            estimated_size = int(
                len(request.imageBase64) * 0.75
            )

            if estimated_size > MAX_FILE_SIZE_BYTES:
                return {
                    "success": False,
                    "agent": AGENT_NAME,
                    "workflowId": request.workflowId,
                    "file": request.file,
                    "task": request.task,
                    "error": "Image exceeds maximum allowed size.",
                }

            result = process_image(
                request.imageBase64,
                request.file,
            )

            return {
                "success": True,
                "agent": AGENT_NAME,
                "workflowId": request.workflowId,
                "file": request.file,
                "task": request.task,
                "output": result,
            }

        # ----------------------------------------------------
        # TEXT INPUT
        # ----------------------------------------------------

        if request.hasText and request.text:

            text = request.text.strip()

            return {
                "success": True,
                "agent": AGENT_NAME,
                "workflowId": request.workflowId,
                "file": request.file,
                "task": request.task,
                "output": {
                    "success": True,
                    "filename": request.file,
                    "text": text,
                    "characterCount": len(text),
                    "message": "Text processed successfully.",
                    "fields": {},
                },
            }

        # ----------------------------------------------------
        # NOTHING PROVIDED
        # ----------------------------------------------------

        return {
            "success": False,
            "agent": AGENT_NAME,
            "workflowId": request.workflowId,
            "file": request.file,
            "task": request.task,
            "error": (
                "No OCR input received. "
                "Send hasImageBase64=true and imageBase64."
            ),
        }

    except Exception as exc:

        print(
            "OCR processing error:",
            repr(exc),
        )

        return {
            "success": False,
            "agent": AGENT_NAME,
            "workflowId": request.workflowId,
            "file": request.file,
            "task": request.task,
            "error": str(exc),
        }


# ============================================================
# LOCAL START
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=HOST,
        port=PORT,
        reload=False,
    )