import re

class MultilingualNLPProcessor:
    def __init__(self):
        # Mappings of patterns to intents
        # Supports Hinglish, Hindi, English
        self.intent_patterns = {
            "ENEMY_CHECK": [
                r"enemy", r"dushman", r"khatra", r"danger", r"threat", 
                r"nearby", r"aas paas", r"kidhar hai", r"dushman hai kya",
                r"enemy check", r"khatra hai kya"
            ],
            "ROUTE_PLAN": [
                r"route", r"rasta", r"path", r"direction", r"map",
                r"navigation", r"safe route", r"best route", r"way to base",
                r"safe rasta", r"dhundho", r"batao", r"navigation check"
            ],
            "AMMO_CHECK": [
                r"ammo", r"bullet", r"goli", r"magazine", r"weapon",
                r"ammo status", r"goli kitni bachi", r"ammo kitna hai",
                r"magazine status"
            ],
            "STATUS_CHECK": [
                r"status", r"report", r"health", r"vital", r"overall",
                r"sab theek", r"theek hai", r"halat", r"status check"
            ]
        }

    def clean_text(self, text: str) -> str:
        """Cleans input text for parsing."""
        if not text:
            return ""
        # Lowercase and strip punctuation
        text = text.lower().strip()
        text = re.sub(r"[^\w\s\?]", "", text)
        return text

    def parse_intent(self, user_query: str):
        """
        Parses user query and returns a dictionary with details about the intent.
        """
        cleaned = self.clean_text(user_query)
        if not cleaned:
            return {"intent": "UNKNOWN", "confidence": 0.0, "query": user_query}

        matched_intents = {}
        for intent, patterns in self.intent_patterns.items():
            matches = 0
            for pattern in patterns:
                # Compile regex to match keywords or phrases
                if re.search(r"\b" + pattern + r"\b", cleaned) or pattern in cleaned:
                    matches += 1
            if matches > 0:
                # Calculate simple matching score based on occurrences
                matched_intents[intent] = matches / len(patterns)

        if not matched_intents:
            # Fallback check for any keyword anywhere in the text
            for intent, patterns in self.intent_patterns.items():
                for pattern in patterns:
                    if pattern in cleaned:
                        matched_intents[intent] = 0.1
                        break

        if matched_intents:
            # Sort by score/confidence
            best_intent = max(matched_intents, key=matched_intents.get)
            confidence = min(0.95, 0.4 + matched_intents[best_intent])
            return {
                "intent": best_intent,
                "confidence": round(confidence, 2),
                "query": user_query,
                "cleaned": cleaned
            }

        return {
            "intent": "UNKNOWN",
            "confidence": 0.0,
            "query": user_query,
            "cleaned": cleaned
        }

    def generate_response(self, intent: str, context: dict) -> str:
        """
        Generates tactical response in voice/text format based on parsed intent and state context.
        Supports dual-language tone depending on request language.
        """
        is_hinglish = any(word in context.get("query", "").lower() for word in ["kidhar", "rasta", "khatra", "goli", "bachi", "hai", "bata", "ko"])
        
        if intent == "ENEMY_CHECK":
            prob = context.get("enemy_probability", 0)
            if prob > 0.7:
                return "Caution! High enemy probability detected nearby. Avoid open terrain." if not is_hinglish else "Dhyan dein! Aas-paas dushman ki sambhavna bohot zyada hai. Open terrain se bachein."
            elif prob > 0.3:
                return "Moderate threat detected in the sector. Proceed with weapons hot." if not is_hinglish else "Sector mein halka khatra hai. Savdhan rahein aur weapon tayyar rakhein."
            else:
                return "Area appears secure. No immediate enemy presence registered." if not is_hinglish else "Aas-paas koi khatra nahi hai. Area safe hai."

        elif intent == "ROUTE_PLAN":
            risk = context.get("risk_score", 0)
            if risk > 0.7:
                return f"Current route is highly compromised (Risk: {int(risk*100)}%). Dynamic rerouting is active. Follow the alternate safe path." if not is_hinglish else f"Abhi ka rasta bohot khatarnak hai (Risk: {int(risk*100)}%). Alternate safe path calculate kar diya hai. Naye raste par chalein."
            else:
                return "Route is clear. Proceeding on the primary tactical route." if not is_hinglish else "Rasta saaf hai. Primary tactical route par badhte rahein."

        elif intent == "AMMO_CHECK":
            ammo = context.get("ammo", 100)
            if ammo < 30:
                return f"Warning! Ammo is critically low at {ammo} percent. Requesting resupply." if not is_hinglish else f"Warning! Ammo bohot kam hai, sirf {ammo} percent. Resupply request karein."
            else:
                return f"Ammo levels stable at {ammo} percent." if not is_hinglish else f"Ammo level status: {ammo} percent bacha hai."

        elif intent == "STATUS_CHECK":
            vitals = f"Heart Rate: {context.get('heart_rate', 80)} bpm, Fatigue: {context.get('fatigue', 20)}%, Ammo: {context.get('ammo', 100)}%."
            risk_percent = int(context.get('risk_score', 0) * 100)
            
            if not is_hinglish:
                status_msg = f"System Status: ONLINE. Soldier Vitals: STABLE. Risk index is {risk_percent} percent. "
                if risk_percent > 70:
                    status_msg += "Immediate alert status is active."
                else:
                    status_msg += "Condition normal."
                return status_msg
            else:
                status_msg = f"System normal hai. Vitals stable hain. Risk score {risk_percent} percent hai. "
                if risk_percent > 70:
                    status_msg += "Sabhdan! Red alert active hai."
                else:
                    status_msg += "Koi dikkat nahi hai."
                return status_msg

        return "Command received. Processing status details." if not is_hinglish else "Command samajh aa gaya. Status updates process ho rahe hain."

# Quick test if run directly
if __name__ == "__main__":
    nlp = MultilingualNLPProcessor()
    test_queries = [
        "Is there any enemy nearby?",
        "dushman kidhar hai?",
        "safe route to base batao",
        "ammo kitna hai goli?",
        "status check"
    ]
    for q in test_queries:
        parsed = nlp.parse_intent(q)
        print(f"Query: {q} => Intent: {parsed['intent']} (Conf: {parsed['confidence']})")
        context = {"enemy_probability": 0.8, "risk_score": 0.75, "ammo": 25, "query": q}
        print(f"Reply: {nlp.generate_response(parsed['intent'], context)}\n")
