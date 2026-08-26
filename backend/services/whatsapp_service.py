import os
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

def send_whatsapp_status_notification(phone: str, complaint_id: str, status_title: str, detail_msg: str) -> Dict[str, Any]:
    """
    Simulates / Dispatches WhatsApp Business API notifications for Indore Municipal DPI complaints.
    Sends automated alerts when status changes (e.g. Registered -> Approved by Super Admin -> Work Sanctioned).
    """
    clean_phone = phone.replace(" ", "").replace("+", "")
    if not clean_phone.startswith("91") and len(clean_phone) == 10:
        clean_phone = f"91{clean_phone}"

    msg_body = (
        f"🏛️ *Indore Municipal Corporation (IMC) — NagarSeva DPI*\n\n"
        f"Namaste! Your Complaint Token *#{complaint_id}* has reached a new milestone:\n\n"
        f"📌 *Status*: {status_title}\n"
        f"ℹ️ *Details*: {detail_msg}\n\n"
        f"🔗 *Track Live Status*: http://localhost:5173\n"
        f"🏆 Swachh Survekshan #1 Indore • Citizen Governance Portal"
    )

    logger.info(f"[WHATSAPP DISPATCH] Sending to {clean_phone}:\n{msg_body}")

    # Generates deep link for instant WhatsApp preview
    wa_web_url = f"https://wa.me/{clean_phone}?text={os.environ.get('WA_ENCODED', '')}"

    return {
        "status": "DELIVERED",
        "phone": clean_phone,
        "complaint_id": complaint_id,
        "message_body": msg_body,
        "timestamp": "2026-08-26T01:45:00Z"
    }
