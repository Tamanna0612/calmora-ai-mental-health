import random
import re
from datetime import datetime

from textblob import TextBlob

# =====================================================
# KEYWORD MAP — English + Hindi + Hinglish
# =====================================================
EMOTION_KEYWORDS = {
    "very_sad": [
        "hopeless", "worthless", "crying", "empty", "alone",
        "nobody cares", "no one cares", "broken", "devastated",
        # Hindi/Hinglish
        "rona aa raha", "bahut dukh", "toot gaya", "toot gayi",
        "jeena nahi", "sab khatam",
    ],
    "sad": [
        "sad", "tired", "down", "unhappy", "low", "hurt",
        "not feeling well", "not feeling good", "not okay", "not well",
        "feeling bad", "feel bad", "feeling low", "feel low",
        "not good", "i am not okay", "im not okay",
        # Hindi/Hinglish
        "udaas", "dukhi", "dard", "bura lag", "bura feel",
        "mood thik nahi", "acha nahi lag", "accha nahi lag",
        "thik nahi", "mann nahi", "dil nahi lag",
        "akela", "akeli", "koi nahi",
    ],
    "anxious": [
        "anxious", "panic", "nervous", "overthinking", "stress",
        "stressed", "overwhelm", "pressure", "worried", "worry",
        "cant breathe", "heart racing", "scared", "fear",
        # Hindi/Hinglish
        "pareshaan", "pareshan", "ghabra", "darr", "dar lag",
        "bahut tension", "dimag kharab", "sochta rehta", "sochti rehti",
    ],
    "angry": [
        "angry", "mad", "furious", "irritated", "annoyed",
        "frustrated", "frustration", "rage", "hate",
        # Hindi/Hinglish
        "gussa", "jhanjhat", "pagal kar diya", "nafrat",
        "bahut gussa", "irritating",
    ],
    "tired": [
        "tired", "exhausted", "fatigued", "no energy", "drained",
        "sleepy", "can't sleep", "cant sleep",
        # Hindi/Hinglish
        "thak gaya", "thak gayi", "thaka hua", "thaki hui",
        "neend nahi", "so nahi paa", "aram chahiye",
    ],
    "happy": [
        "happy", "good", "great", "excited", "joy", "glad",
        "feeling good", "feel good", "okay", "fine",
        # Hindi/Hinglish
        "khush", "mast", "acha lag", "accha lag", "sahi hai",
        "maja aa raha",
    ],
    "very_happy": [
        "amazing", "fantastic", "best day", "awesome", "wonderful",
        "brilliant", "incredible", "on top of the world",
        # Hindi/Hinglish
        "bahut khush", "ekdum mast", "zabardast",
    ],
}

RISK_KEYWORDS = [
    "suicide", "kill myself", "end my life", "self harm",
    "no reason to live", "want to die", "i want to die",
    "khatam kar lu", "mar jana chahta", "mar jana chahti",
    "jeena nahi chahta", "jeena nahi chahti",
]


# =====================================================
# HELPERS
# =====================================================

def clean_text(text: str) -> str:
    return text.lower().strip()


def analyze_sentiment(text: str):
    try:
        analysis = TextBlob(text)
        return analysis.sentiment.polarity, analysis.sentiment.subjectivity
    except Exception:
        return 0.0, 0.0


def detect_emotion(text: str) -> str:
    t = clean_text(text)
    for emotion, keywords in EMOTION_KEYWORDS.items():
        for word in keywords:
            if word in t:
                return emotion
    return "neutral"


def detect_risk(text: str) -> bool:
    t = clean_text(text)
    return any(word in t for word in RISK_KEYWORDS)


def calculate_intensity(polarity: float) -> str:
    if polarity <= -0.6:  return "high"
    if polarity <= -0.2:  return "medium"
    if polarity <   0.2:  return "low"
    if polarity <   0.6:  return "medium"
    return "high"


def suggest_breathing(emotion: str):
    if emotion in ["anxious", "very_sad", "angry"]:
        return "Try this: Inhale for 4 seconds, hold for 4, exhale for 6."
    if emotion in ["tired"]:
        return "Try box breathing: In 4s → Hold 4s → Out 4s. Repeat 3 times."
    return None


def suggest_music(emotion: str):
    music_map = {
        "very_sad": "Calm Piano 🎹 or Rain Sounds 🌧️",
        "sad":      "Ocean Waves 🌊 or Nature Sounds 🌿",
        "anxious":  "Nature Sounds 🌿 or White Noise 💨",
        "angry":    "Ocean Waves 🌊",
        "tired":    "Rain Sounds 🌧️ or White Noise 💨",
        "happy":    "Upbeat Meditation 🎵",
        "very_happy":"Upbeat Meditation 🎵",
        "neutral":  "Calm Piano 🎹",
    }
    return music_map.get(emotion, "Calm Piano 🎹")


# =====================================================
# RESPONSE BANK
# =====================================================

RESPONSES = {
    "very_sad": [
        "I'm really sorry you're feeling this way 💙 You matter more than you know. I'm right here with you.",
        "That sounds very heavy. Please know you're not alone in this. I'm listening.",
    ],
    "sad": [
        "I'm sorry you're not feeling well 🤗 It's okay to feel this way. I'm here with you.",
        "That sounds difficult. You don't have to go through this alone. Want to share more?",
        "I hear you. Sometimes things feel hard, and that's completely valid 💙",
    ],
    "anxious": [
        "Let's slow down together 🌿 Take a breath. You are safe right now.",
        "Anxiety can feel overwhelming, but you're handling it by reaching out. That takes courage.",
        "One step at a time. You're doing better than you think 💙",
    ],
    "angry": [
        "It sounds frustrating. What happened? I'm here to listen.",
        "Anger often protects something important inside us. It's valid to feel this way.",
        "Take a breath with me 🌬️ We'll work through this together.",
    ],
    "tired": [
        "It sounds like you really need some rest 😴 Be gentle with yourself today.",
        "Feeling drained is your body's way of asking for care. Listen to it 💙",
        "Rest is not a luxury — it's essential. You deserve a break.",
    ],
    "happy": [
        "That's wonderful to hear! 😊 Keep that positive energy going!",
        "I love hearing that! What made your day good?",
        "That's so great! You deserve to feel this way 🌟",
    ],
    "very_happy": [
        "You're absolutely glowing today! ✨ Celebrate this moment!",
        "That's amazing! You deserve every bit of this happiness 🎉",
    ],
    "neutral": [
        "Tell me more about how you're feeling. I'm here to listen.",
        "How has your day been overall? I'm all ears 💙",
        "I'm here with you. Feel free to share anything on your mind.",
    ],
}


# =====================================================
# MAIN FUNCTION — returns dict
# =====================================================

def generate_ai_reply(user_message: str) -> dict:
    polarity, subjectivity = analyze_sentiment(user_message)
    emotion = detect_emotion(user_message)

    # Fallback to sentiment if no keyword matched
    if emotion == "neutral":
        if polarity < -0.3:
            emotion = "sad"
        elif polarity > 0.3:
            emotion = "happy"

    intensity        = calculate_intensity(polarity)
    risk_flag        = detect_risk(user_message)
    breathing_tip    = suggest_breathing(emotion)
    music_suggestion = suggest_music(emotion)

    # ── Crisis response ───────────────────────────────
    if risk_flag:
        return {
            "reply": (
                "I'm very concerned about what you're sharing 💙\n"
                "Please reach out to someone you trust, or contact:\n"
                "📞 iCall: 9152987821\n"
                "📞 Vandrevala Foundation: 1860-2662-345\n"
                "You are not alone, and help is available right now."
            ),
            "mood":             "critical",
            "intensity":        "high",
            "sentiment_score":  round(polarity, 3),
            "subjectivity":     round(subjectivity, 3),
            "breathing_tip":    None,
            "music_suggestion": None,
            "risk_detected":    True,
            "timestamp":        datetime.utcnow().isoformat(),
        }

    reply = random.choice(RESPONSES.get(emotion, RESPONSES["neutral"]))
    if intensity == "high" and emotion in ["sad", "very_sad", "anxious"]:
        reply += " I can sense this feeling is strong — I'm right here with you 💙"

    return {
        "reply":            reply,
        "mood":             emotion,
        "intensity":        intensity,
        "sentiment_score":  round(polarity, 3),
        "subjectivity":     round(subjectivity, 3),
        "breathing_tip":    breathing_tip,
        "music_suggestion": music_suggestion,
        "risk_detected":    False,
        "timestamp":        datetime.utcnow().isoformat(),
    }