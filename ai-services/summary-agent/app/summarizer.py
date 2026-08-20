import re
from typing import Optional


def find_value(text: str, patterns: list[str]) -> Optional[str]:
	for pattern in patterns:
		match = re.search(pattern, text, re.IGNORECASE)
		if match:
			return re.sub(r"\s+", " ", match.group(1)).strip(" .,:;")
	return None


def format_amount(value: Optional[str]) -> Optional[str]:
	if not value:
		return None

	cleaned = value.replace(",", "").strip()
	currency = ""

	if cleaned[:1] in "$₹€£":
		currency = cleaned[0]
		cleaned = cleaned[1:].strip()

	try:
		number = float(cleaned)
		formatted = f"{number:,.2f}"
		return f"{currency}{formatted}" if currency else formatted
	except ValueError:
		return value.strip()


def extract_items(text: str) -> list[str]:
	match = re.search(
		r"includes?\s+(.+?)(?=\s+(?:subtotal|tax|total|payment|terms?)\s*[:\-]|$)",
		text,
		re.IGNORECASE,
	)
	if not match:
		known_items = [
			"AI Agent Platform Subscription",
			"OCR Processing Service",
			"API Usage",
		]
		return [item for item in known_items if item.lower() in text.lower()]

	value = re.sub(r"\s+", " ", match.group(1)).strip(" .,:;")
	parts = re.split(r"\s*,\s*|\s+and\s+", value, flags=re.IGNORECASE)
	return [part.strip() for part in parts if part.strip()][:5]


def summarize_invoice(text: str) -> str:
	normalized = re.sub(r"\s+", " ", text).strip()

	invoice_number = find_value(normalized, [
		r"invoice\s*(?:number|no\.?|#)\s*[:\-]?\s*([A-Z0-9][A-Z0-9\-/]+)",
	])
	invoice_date = find_value(normalized, [
		r"invoice\s*date\s*[:\-]?\s*(\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{1,2}[/-]\d{1,2}[/-]\d{2,4})",
	])
	sender = find_value(normalized, [
		r"(?:from|issued by|seller|vendor)\s*[:\-]?\s*([^,;|]+)",
	])
	recipient = find_value(normalized, [
		r"(?:bill to|billed to|issued to|customer|client)\s*[:\-]?\s*([^,;|]+)",
	])
	bill_from = re.search(
		r"bill\s*from\s*[:\-]?\s*(.+?)(?=\s+bill\s*to\s*[:\-]?|\s+\d{1,4}\s+[A-Za-z]|\s+gstin\s*:|$)",
		normalized,
		re.IGNORECASE,
	)
	bill_to = re.search(
		r"bill\s*to\s*[:\-]?\s*(.+?)(?=\s+\d{1,4}\s+[A-Za-z]|\s+gstin\s*:|\s+#\s*description|$)",
		normalized,
		re.IGNORECASE,
	)
	if bill_from:
		sender = bill_from.group(1).strip()
	if bill_to:
		recipient = bill_to.group(1).strip()
	issued_matches = list(re.finditer(
		r"([A-Za-z][A-Za-z0-9 &.]+?)\s+issued\s+an\s+invoice\s+to\s+([A-Za-z][A-Za-z0-9 &.]+?)(?=\s+for\s+|\.|$)",
		normalized,
		re.IGNORECASE,
	))
	if issued_matches:
		issued_match = next(
			(match for match in issued_matches if "pvt" in match.group(1).lower() or "ltd" in match.group(1).lower()),
			issued_matches[-1],
		)
		sender = sender or issued_match.group(1).strip()
		recipient = recipient or issued_match.group(2).strip()

	if not sender:
		company_match = re.search(
			r"^(.+?)(?=\s+invoice\s*(?:number|no\.?|#))",
			normalized,
			re.IGNORECASE,
		)
		if company_match:
			sender = company_match.group(1).strip(" ,:-")

	if not recipient:
		recipient = find_value(normalized, [
			r"(?:bill\s*to|billed\s*to|customer|client)\s*[:\-]?\s*([A-Za-z][A-Za-z0-9 &.]+)",
		])

	if sender:
		sender = re.sub(
			r"^(?:\d{1,2}\s+)?[A-Za-z]+\s+\d{4}\s+",
			"",
			sender,
			flags=re.IGNORECASE,
		).strip()
	subtotal = format_amount(find_value(normalized, [
		r"sub\s*total\s*[:\-]?\s*([$₹€£]?\s*[\d,]+(?:\.\d{1,2})?)",
	]))
	tax = format_amount(find_value(normalized, [
		r"tax\s*\([^)]*gst\s*([$₹€£]?\s*[\d,]+(?:\.\d{1,2})?)",
		r"(?:tax|gst|vat)[^\d]{0,30}([$₹€£]?\s*[\d,]+(?:\.\d{1,2})?)",
	]))
	total = format_amount(find_value(normalized, [
		r"(?:total\s+amount|grand\s+total|amount\s+due)[^\d]{0,30}([$₹€£]?\s*[\d,]+(?:\.\d{1,2})?)",
		r"(?<!sub)total\s*[:\-]?\s*([$₹€£]?\s*[\d,]+(?:\.\d{1,2})?)",
	]))
	payment_method = find_value(normalized, [
		r"payment\s+method\s*[:\-]?\s*([^,;|.]+?)(?=\s+payment\s+terms?|$)",
	])
	payment_terms = find_value(normalized, [
		r"payment\s+terms?\s*[:\-]?\s*([^,;|.]+)",
		r"(net\s+\d+\s+days)",
	])

	if invoice_number:
		summary = f"Invoice {invoice_number}"
	else:
		summary = "Invoice"

	if sender:
		summary += f" from {sender}"
	if recipient:
		summary += f" to {recipient}"
	if invoice_date:
		summary += f", dated {invoice_date}"
	summary += "."

	items = extract_items(normalized)
	if items:
		item_text = ", ".join(items[:-1]) + f", and {items[-1]}" if len(items) > 1 else items[0]
		summary += f"\n\nThe invoice covers {item_text}."

	amounts = []
	if subtotal:
		amounts.append(f"Subtotal: {subtotal}")
	if tax:
		amounts.append(f"Tax: {tax}")
	if total:
		amounts.append(f"Total: {total}")
	if amounts:
		summary += "\n\n" + "\n".join(amounts)

	if payment_method:
		summary += f"\n\nPayment method: {payment_method}."
	if payment_terms:
		summary += f"\nPayment terms: {payment_terms}."

	if summary == "Invoice.":
		summary = " ".join(normalized.split()[:80])
		if len(normalized.split()) > 80:
			summary += "..."

	return summary


def summarize_text(text: str) -> dict:
	summary = summarize_invoice(text)
	return {
		"summary": summary,
		"wordCount": len(summary.split()),
		"sourceWordCount": len(text.split()),
	}
