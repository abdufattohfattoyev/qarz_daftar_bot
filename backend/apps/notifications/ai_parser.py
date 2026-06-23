"""
Ovozli/matnli buyruqdan qarz ma'lumotini ajratish — Claude (Haiku 4.5) bilan.

Foydalanish:
    from apps.notifications.ai_parser import parse_debt_text
    data = parse_debt_text("Diyorga 200 ming berdim")
    # → {"contact": "Diyor", "amount": 200000, "currency": "UZS", "type": "gave"}
    # Ajratib bo'lmasa → None
"""
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

# Claude'ga JSON kafolatlash uchun tool — tool_choice majburlanadi
_PARSE_TOOL = {
    "name": "qarz_yaratish",
    "description": "Foydalanuvchining o'zbekcha buyrug'idan qarz ma'lumotini ajratadi.",
    "input_schema": {
        "type": "object",
        "properties": {
            "contact": {
                "type": "string",
                "description": "Kimga berildi yoki kimdan olindi — shaxs ismi",
            },
            "amount": {
                "type": "integer",
                "description": (
                    "Summa, to'liq butun son. Misol: '200 ming'=200000, "
                    "'ikki yarim million'=2500000, '50'=50"
                ),
            },
            "currency": {
                "type": "string",
                "enum": ["UZS", "USD"],
                "description": "Dollar yoki $ aytilsa USD; aks holda UZS (so'm)",
            },
            "type": {
                "type": "string",
                "enum": ["gave", "got"],
                "description": (
                    "'berdim' (men berdim, menga qarzdor) = gave; "
                    "'oldim' (men oldim, men qarzdorman) = got"
                ),
            },
        },
        "required": ["contact", "amount", "currency", "type"],
    },
}

_SYSTEM = (
    "Sen qarz daftari ilovasi uchun yordamchisan. Foydalanuvchining o'zbekcha "
    "gapidan qarz ma'lumotini ajratasan va faqat 'qarz_yaratish' tool'ini chaqirasan."
)


def parse_debt_text(text: str):
    """Matndan {contact, amount, currency, type} ajratadi. Xatoda None qaytaradi."""
    if not text or not text.strip():
        return None
    if not settings.ANTHROPIC_API_KEY:
        logger.warning("ANTHROPIC_API_KEY sozlanmagan — ovozli parsing o'chiq")
        return None

    try:
        import anthropic
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        resp = client.messages.create(
            model="claude-haiku-4-5",
            max_tokens=300,
            system=_SYSTEM,
            tools=[_PARSE_TOOL],
            tool_choice={"type": "tool", "name": "qarz_yaratish"},
            messages=[{
                "role": "user",
                "content": f"Quyidagi gapdan qarz ma'lumotini ajrat:\n\"{text.strip()}\"",
            }],
        )
        for block in resp.content:
            if block.type == "tool_use":
                data = block.input
                # Minimal validatsiya
                if data.get("amount", 0) > 0 and data.get("contact"):
                    data["currency"] = data.get("currency", "UZS")
                    data["type"] = data.get("type", "gave")
                    return data
        return None
    except Exception as e:
        logger.error("parse_debt_text xatosi: %s", e)
        return None
