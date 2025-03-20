import pytesseract
import requests
import cv2
import numpy as np
import re
from pathlib import Path
import os

API_KEY = "67652158-5942-474b-bcef-653249bba035"
BASE_URL = "https://api.pokemontcg.io/v2/cards"

pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

### 🔹 Find Name Region
def find_name_region(image_path):
    img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)

    FIXED_WIDTH, FIXED_HEIGHT = 600, 825
    img = cv2.resize(img, (FIXED_WIDTH, FIXED_HEIGHT))

    cropped_name_area = img[int(FIXED_HEIGHT * 0.05):int(FIXED_HEIGHT * 0.11),  
                            int(FIXED_WIDTH * 0.22):int(FIXED_WIDTH * 0.65)]  

    # Preprocessing
    cropped_name_area = cv2.GaussianBlur(cropped_name_area, (3,3), 0)
    _, thresh = cv2.threshold(cropped_name_area, 120, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    kernel = np.ones((2, 2), np.uint8)
    processed_name = cv2.dilate(thresh, kernel, iterations=1)

    # Save debug image
    debug_dir = Path(__file__).parent.parent / "static/images"
    debug_dir.mkdir(parents=True, exist_ok=True)
    debug_path = debug_dir / "debug_cropped_name.jpg"
    cv2.imwrite(str(debug_path), processed_name)
    print(f"🖼️ Debug Name Image Saved: {debug_path}")

    return processed_name

### 🔹 Extract Text with Spacing & Cleaning
def extract_text(image_path):
    img = find_name_region(image_path)

    extracted_text = pytesseract.image_to_string(
        img,
        config="--psm 7 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-' "
    )

    # Normalize apostrophe
    extracted_text = extracted_text.replace("’", "'")
    extracted_text = extracted_text.replace("\n", " ").strip()

    # Insert space between lowercase-uppercase letters
    extracted_text = re.sub(r"(?<=[a-z])(?=[A-Z])", " ", extracted_text)

    print(f"🔍 Extracted Pokémon Name: {extracted_text}")  
    return extracted_text

### 🔹 Clean Extracted Name
def extract_pokemon_name(extracted_text):
    # Normalize apostrophes again
    extracted_text = extracted_text.replace("’", "'").strip()

    # Remove numbers and unwanted characters but KEEP letters, apostrophe, hyphen, space
    cleaned_text = re.sub(r"[^A-Za-z\s'-]", '', extracted_text).strip()
    
    words = cleaned_text.split()
    if not words:
        return "Unknown"

    return " ".join(words)

### 🔹 Validate Pokémon Name
def validate_pokemon_card(pokemon_name):
    pokemon_name = pokemon_name.replace("' ", " ").strip()
    params = {"q": f'name:"{pokemon_name}"'}
    headers = {"X-Api-Key": API_KEY}
    response = requests.get(BASE_URL, headers=headers, params=params)
    
    if response.status_code == 200:
        cards = response.json().get("data", [])
        return len(cards) > 0  
    return False

### 🔹 Main Verification
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
        extracted_text = extract_text(image_path)

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
