import random
import re

from textblob import TextBlob

# Extended with Hindi/Hinglish keywords
EMOTION_KEYWORDS = {
    "very_sad": [
        "hopeless", "worthless", "crying", "empty", "alone",
        "bahut dukhi", "bahut udaas", "rona chahta", "rone ka mann", "akela",
    ],
    "sad": [
        "sad", "tired", "down", "unhappy", "low",
        "udaas", "dukhi", "mood thik nahi", "mujhe bura lag raha", "dil bheega",
    ],
    "anxious": [
        "anxious", "panic", "nervous", "overthinking", "stress",
        "ghabra", "dar lag raha", "tension hai", "chinta", "pareshan",
    ],
    "angry": [
        "angry", "mad", "furious", "irritated", "annoyed",
        "gussa", "naraaz", "bahut gussa", "irritate",
    ],
    "happy": [
        "happy", "good", "great", "excited", "joy",
        "khush", "accha lag raha", "mast", "khushi",
    ],
    "very_happy": [
        "amazing", "fantastic", "best day", "awesome",
        "bahut khush", "zabardast", "ekdum mast",
    ],
}

RISK_KEYWORDS = [
    "suicide",
    "kill myself",
    "end my life",
    "self harm",
    "die",
    "no reason to live",
]


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", "", text)
    return text


def analyze_sentiment(text: str) -> tuple[float, float]:
    analysis = TextBlob(text)
    return analysis.sentiment.polarity, analysis.sentiment.subjectivity


def detect_emotion(text: str) -> str:
    text = clean_text(text)
    for emotion, keywords in EMOTION_KEYWORDS.items():
        for word in keywords:
            if word in text:
                return emotion
    return "neutral"


def detect_risk(text: str) -> bool:
    text = clean_text(text)
    return any(word in text for word in RISK_KEYWORDS)


def calculate_intensity(polarity: float) -> str:
    if polarity <= -0.6:
        return "high"
    if polarity <= -0.2:
        return "medium"
    if polarity < 0.2:
        return "low"
    if polarity < 0.6:
        return "medium"
    return "high"


def suggest_breathing(emotion: str) -> str | None:
    if emotion in ["anxious", "very_sad", "angry"]:
        return "Try this: Inhale for 4 seconds, hold for 4, exhale for 6."
    return None


def generate_response(emotion: str, intensity: str) -> str:
    response_bank = {
        "very_sad": [
            "I'm really sorry you're feeling this way. You matter more than you know.",
            "That sounds very heavy. I'm here with you.",
        ],
        "sad": [
            "That sounds tough. Want to share more?",
            "I'm listening. You're not alone.",
        ],
        "anxious": [
            "Let's slow down together. You are safe right now.",
            "Anxiety can feel overwhelming. Take one small step.",
        ],
        "angry": [
            "It sounds frustrating. What happened?",
            "Anger usually protects something important inside us.",
        ],
        "happy": [
            "That's wonderful to hear.",
            "I love that energy. Tell me more.",
        ],
        "very_happy": [
            "You're glowing today.",
            "That's amazing. Celebrate that moment.",
        ],
        "neutral": [
            "Tell me more about that.",
            "How has your day been overall?",
        ],
    }

    base_reply = random.choice(response_bank.get(emotion, response_bank["neutral"]))
    if intensity == "high":
        base_reply += " I can sense this feeling is strong."
    return base_reply


def generate_ai_reply(user_message: str) -> dict:
    polarity, subjectivity = analyze_sentiment(user_message)
    keyword_emotion = detect_emotion(user_message)

    if keyword_emotion == "neutral":
        if polarity < -0.3:
            keyword_emotion = "sad"
        elif polarity > 0.3:
            keyword_emotion = "happy"

    intensity = calculate_intensity(polarity)
    risk_flag = detect_risk(user_message)

    if risk_flag:
        return {
            "reply": "I'm concerned about what you're saying. Please contact a trusted person or a professional immediately.",
            "mood": "critical",
            "intensity": "high",
            "sentiment_score": round(polarity, 4),
            "subjectivity": round(subjectivity, 4),
            "breathing_tip": None,
            "risk_detected": True,
            # FIX: Removed timestamp — FastAPI/SQLAlchemy sets this via model default.
            # Returning a datetime object here caused Pydantic serialization errors.
        }

    return {
        "reply": generate_response(keyword_emotion, intensity),
        "mood": keyword_emotion,
        "intensity": intensity,
        "sentiment_score": round(polarity, 4),
        "subjectivity": round(subjectivity, 4),
        "breathing_tip": suggest_breathing(keyword_emotion),
        "risk_detected": False,
        # FIX: Removed timestamp for same reason above
    }