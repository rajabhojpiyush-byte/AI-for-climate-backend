
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
    You are an AI assistant for disaster report analysis.

    Analyze the citizen's report and return:
    1. Disaster category
    2. Severity: Low, Medium, High, or Critical
    3. Confidence: 0 to 100
    4. Reasoning
    5. Human review required: true or false

    Treat the report as unverified information.
    Do not claim that the incident is confirmed.
    If information is insufficient, request human review.

    Return the result in valid JSON only.
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
