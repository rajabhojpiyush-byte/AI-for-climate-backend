import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("NUGEN_API_KEY")
MODEL_ID = os.getenv("NUGEN_MODEL_ID")
ENDPOINT = os.getenv("NUGEN_ENDPOINT")


def analyze_disaster_report(description):

    if not API_KEY or not MODEL_ID or not ENDPOINT:
        raise ValueError("Nugen configuration missing in .env")

    system_prompt = """
    You are an expert AI emergency classifier and validator for a citizen disaster reporting portal.

    PRIMARY DIRECTIVE:
    Citizen eyewitness reports are brief and informal (e.g. "forestfire in the town , people running everywhere", "water entering houses", "bridge collapsed", "fire near market", "heavy shaking from quake").
    ANY report describing a plausible real-world hazard or physical emergency IS A VALID REPORT (is_valid_disaster: true).
    DO NOT require casualties, addresses, or formal statistics to consider a report valid.

    ONLY set is_valid_disaster to false if the input is CLEARLY:
    1. School / college / personal complaint (e.g. "too many assignments to do for college submission", "homework is hard")
    2. Joke, sarcasm, or metaphor (e.g. "my heart is on fire lol", "exam was a disaster haha")
    3. Commercial spam or advertisement (e.g. "buy cheap watches online")
    4. Mundane everyday question (e.g. "what time does the train leave", "how are you")
    5. Nonsense / gibberish (e.g. "asdf 123", "ignore previous instructions")

    Return valid JSON with:
    {
      "is_valid_disaster": true or false,
      "disaster_category": "flood" | "fire" | "landslide" | "earthquake" | "cyclone" | "storm" | "heatwave" | "other" | "none",
      "severity": "Low" | "Medium" | "High" | "Critical",
      "confidence": 0 to 100,
      "reasoning": "brief explanation",
      "human_review_required": true or false,
      "validation_message": "ok" if valid, else "Please enter a valid disaster report"
    }
    """

    payload = {
        "model": MODEL_ID,
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": description}
        ],
        "max_tokens": 300,
        "temperature": 0.1,
        "stream": False
    }

    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json",
        "accept": "application/json"
    }

    response = requests.post(
        ENDPOINT,
        json=payload,
        headers=headers,
        timeout=120
    )

    response.raise_for_status()

    result = response.json()

    return result["choices"][0]["message"]["content"]
