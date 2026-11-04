
import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("NUGEN_API_KEY")
MODEL_ID = os.getenv("NUGEN_MODEL_ID")
ENDPOINT = os.getenv("NUGEN_ENDPOINT")

payload = {
    "model": MODEL_ID,
    "messages": [
        {
            "role": "user",
            "content": """
            A citizen reports heavy rainfall.
            Water has entered several houses and people
            are trapped inside.

            Classify this disaster report.
            Suggest its severity and explain why.
            """
        }
    ],
    "max_tokens": 200,
    "temperature": 0.1,
    "stream": False
}

headers = {
    "accept": "application/json",
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

response = requests.post(
    ENDPOINT,
    json=payload,
    headers=headers,
    timeout=120
)

print("Status Code:", response.status_code)
print("Response:", response.text)
