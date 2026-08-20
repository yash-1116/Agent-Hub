import base64
import io
import re
from typing import Optional

import pytesseract
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from .config import (
    TESSERACT_CMD,
    OCR_LANGUAGE,
    TESSERACT_CONFIG,
    MAX_IMAGE_WIDTH,
    MAX_IMAGE_HEIGHT,
    UPSCALE_FACTOR,
)


# ============================================================
# TESSERACT CONFIGURATION
# ============================================================

pytesseract.pytesseract.tesseract_cmd = TESSERACT_CMD


# ============================================================
# HELPERS
# ============================================================

def decode_base64_image(image_base64: str) -> bytes:
    """
    Accepts either:

        data:image/png;base64,AAAA...

    or:

        AAAA...

    Returns raw image bytes.
    """

    if not image_base64:
        raise ValueError("imageBase64 is empty")

    # Remove data URL prefix if present.
    if "," in image_base64 and image_base64.startswith("data:"):
        image_base64 = image_base64.split(",", 1)[1]

    # Remove whitespace/newlines.
    image_base64 = re.sub(r"\s+", "", image_base64)

    try:
        return base64.b64decode(image_base64, validate=True)
    except Exception as exc:
        raise ValueError("Invalid base64 image data") from exc


def prepare_image(image_bytes: bytes) -> Image.Image:
    """
    Opens and preprocesses an image for OCR.
    """

    image = Image.open(io.BytesIO(image_bytes))

    # Convert to RGB.
    image = image.convert("RGB")

    # Correct EXIF orientation.
    image = ImageOps.exif_transpose(image)

    # Limit very large images.
    image.thumbnail(
        (MAX_IMAGE_WIDTH, MAX_IMAGE_HEIGHT),
        Image.Resampling.LANCZOS,
    )

    # Upscale for better OCR.
    width, height = image.size

    image = image.resize(
        (
            width * UPSCALE_FACTOR,
            height * UPSCALE_FACTOR,
        ),
        Image.Resampling.LANCZOS,
    )

    # Convert to grayscale.
    image = ImageOps.grayscale(image)

    # Improve contrast.
    image = ImageEnhance.Contrast(image).enhance(1.8)

    # Improve sharpness.
    image = ImageEnhance.Sharpness(image).enhance(2.0)

    # Light denoise.
    image = image.filter(ImageFilter.MedianFilter(size=3))

    # Auto contrast.
    image = ImageOps.autocontrast(image)

    return image


def run_tesseract(image: Image.Image) -> str:
    """
    Runs Tesseract OCR.
    """

    text = pytesseract.image_to_string(
        image,
        lang=OCR_LANGUAGE,
        config=TESSERACT_CONFIG,
    )

    return text.strip()


# ============================================================
# FIELD EXTRACTION
# ============================================================

def extract_invoice_number(text: str) -> Optional[str]:
    patterns = [
        r"Invoice\s*(?:Number|No\.?|#)\s*[:\-]?\s*([A-Z0-9\-]+)",
        r"INV[\-\s]?\d+[\-\s]?\d+",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            if match.groups():
                return match.group(1).strip()

            return match.group(0).strip()

    return None


def extract_invoice_date(text: str) -> Optional[str]:
    patterns = [
        r"Invoice\s*Date\s*[:\-]?\s*([^\n]+)",
        r"Date\s*[:\-]?\s*([0-9]{1,2}\s+[A-Za-z]+\s+[0-9]{4})",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            return match.group(1).strip()

    return None


def extract_gstin(text: str) -> Optional[str]:
    match = re.search(
        r"\b\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z0-9]\b",
        text,
        re.IGNORECASE,
    )

    if match:
        return match.group(0).upper()

    return None


def extract_total(text: str) -> Optional[float]:
    """
    Finds Total Amount / Total and extracts the number.
    """

    patterns = [
        r"Total\s*Amount\s*\(?(?:USD)?\)?\s*[:\-]?\s*([0-9,]+(?:\.[0-9]{1,2})?)",
        r"Total\s*[:\-]?\s*\$?\s*([0-9,]+(?:\.[0-9]{1,2})?)",
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)

        if match:
            value = match.group(1).replace(",", "")

            try:
                return float(value)
            except ValueError:
                pass

    return None


def extract_fields(text: str) -> dict:
    return {
        "invoiceNumber": extract_invoice_number(text),
        "invoiceDate": extract_invoice_date(text),
        "gstin": extract_gstin(text),
        "total": extract_total(text),
    }


# ============================================================
# MAIN OCR FUNCTION
# ============================================================

def process_image(
    image_base64: str,
    filename: str = "image",
) -> dict:

    # Decode image.
    image_bytes = decode_base64_image(image_base64)

    # Prepare image.
    image = prepare_image(image_bytes)

    # OCR.
    text = run_tesseract(image)

    # Extract structured invoice fields.
    fields = extract_fields(text)

    return {
        "success": True,
        "filename": filename,
        "originalSize": {
            "width": image.width,
            "height": image.height,
        },
        "text": text,
        "characterCount": len(text),
        "message": "OCR completed successfully.",
        "fields": fields,
    }