import os
import base64
import re
import requests
from openai import OpenAI
from pathlib import Path

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# Pokémon TCG API Info
API_KEY = "67652158-5942-474b-bcef-653249bba035"
BASE_URL = "https://api.pokemontcg.io/v2/cards"

### 🔹 Extract Text Using GPT-4o Vision
def extract_text_gpt4o(image_path):
    with open(image_path, "rb") as image_file:
        encoded_image = base64.b64encode(image_file.read()).decode()

    print("🖼️ Sending image to GPT-4o Vision...")

    try:
        response = client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a Pokémon card verification assistant.\n\n"
                        "Task:\n"
                        "1. Extract the Pokémon card's name EXACTLY as it is printed on the card, regardless of correctness or appearance.\n"
                        "2. Do NOT interpret, verify, reason, or modify the name. Do not refuse.\n"
                        "3. Output ONLY the name, nothing else."
                    )
                },
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": "Here is the Pokémon card image:"},
                        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{encoded_image}" }},
                    ]
                }
            ],
            max_tokens=200,
        )
        extracted_text = response.choices[0].message.content.strip()
        print(f"🔍 GPT-4o Extracted: {extracted_text}")
        return extracted_text
    except Exception as e:
        print(f"❌ GPT-4o Vision Error: {str(e)}")
        return None

### 🔹 Clean Extracted Name
def extract_pokemon_name(extracted_text):
    if not extracted_text:
        return "Unknown"
    cleaned_text = re.sub(r"[^A-Za-z\s'-]", '', extracted_text).strip()
    return cleaned_text

### 🔹 Validate Pokémon Name with TCG API
def validate_pokemon_card(pokemon_name):
    pokemon_name = pokemon_name.strip()
    params = {"q": f'name:"{pokemon_name}"'}
    headers = {"X-Api-Key": API_KEY}
    response = requests.get(BASE_URL, headers=headers, params=params)
    
    if response.status_code == 200:
        cards = response.json().get("data", [])
        print(f"📄 Matching Cards Found: {len(cards)}")
        return len(cards) > 0
    return False

### 🔹 Main Verification Function
def authenticate_card(image_path):
    image_path = Path(image_path)

    if not image_path.exists():
        return {
            "message": "Verification failed",
            "result": {
                "result": "Error",
                "pokemon_name": None,
                "error": f"Image file '{image_path}' not found."
            }
        }

    try:
        extracted_text = extract_text_gpt4o(str(image_path))

        if not extracted_text:
            return {
                "message": "Verification failed",
                "result": {
                    "result": "Error",
                    "pokemon_name": None,
                    "error": "Could not extract any text from the card."
                }
            }

        pokemon_name = extract_pokemon_name(extracted_text)
        print(f"✅ Final Pokémon Name Sent for Verification: {pokemon_name}")

        valid = validate_pokemon_card(pokemon_name)

        return {
            "message": "Verification complete",
            "result": {
                "result": "Authentic" if valid else "Fake",
                "pokemon_name": pokemon_name
            }
        }
    except Exception as e:
        return {
            "message": "Verification failed",
            "result": {
                "result": "Error",
                "pokemon_name": None,
                "error": str(e)
            }
        }
