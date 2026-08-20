import os


# ============================================================
# OCR AGENT CONFIGURATION
# ============================================================

AGENT_NAME = "OCR Agent"

HOST = "0.0.0.0"
PORT = 8001

# Maximum accepted file size: 10 MB
MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024

# Windows Tesseract installation
TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# OCR language
OCR_LANGUAGE = "eng"

# Tesseract OCR configuration
# PSM 6 works well for invoices and structured documents.
TESSERACT_CONFIG = "--oem 3 --psm 6"

# Maximum image dimensions processed by Pillow
MAX_IMAGE_WIDTH = 3000
MAX_IMAGE_HEIGHT = 4000

# Image preprocessing
UPSCALE_FACTOR = 2

# Allowed image types
ALLOWED_IMAGE_TYPES = {
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
}