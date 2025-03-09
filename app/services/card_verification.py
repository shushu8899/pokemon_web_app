import pytesseract
import requests
import cv2
import numpy as np
import re
from pathlib import Path
from fastapi.responses import JSONResponse
import os

# ✅ Define API Key for Pokémon TCG API
API_KEY = "67652158-5942-474b-bcef-653249bba035"
BASE_URL = "https://api.pokemontcg.io/v2/cards"

# ✅ Set Tesseract path for Windows
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

### **🔹 Function: Find Name Region in Image**
def find_name_region(image_path):
    img = cv2.imread(str(image_path), cv2.IMREAD_GRAYSCALE)

    # ✅ Resize to fixed size (600x825px)
    FIXED_WIDTH, FIXED_HEIGHT = 600, 825
    img = cv2.resize(img, (FIXED_WIDTH, FIXED_HEIGHT))

    # ✅ Adjust Cropping to be More Focused
    cropped_name_area = img[int(FIXED_HEIGHT * 0.05):int(FIXED_HEIGHT * 0.11),  
                            int(FIXED_WIDTH * 0.22):int(FIXED_WIDTH * 0.75)]  

    # ✅ Apply Adaptive Thresholding
    cropped_name_area = cv2.GaussianBlur(cropped_name_area, (3,3), 0)
    _, thresh = cv2.threshold(cropped_name_area, 120, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    # ✅ Dilate to Connect Broken Characters
    kernel = np.ones((2, 2), np.uint8)
    processed_name = cv2.dilate(thresh, kernel, iterations=1)

    # ✅ Save Debug Image
    debug_dir = Path(__file__).parent.parent / "static/images"
    debug_dir.mkdir(parents=True, exist_ok=True)  # Ensure directory exists
    debug_path = debug_dir / "debug_cropped_name.jpg"
    cv2.imwrite(str(debug_path), processed_name)
    print(f"🖼️ Debug Name Image Saved: {debug_path}")

    return processed_name

### **🔹 Function: Extract Text from Pokémon Card (OCR)**
def extract_text(image_path: str) -> str:
    """
    Extract text from an image using OCR
    """
    try:
        # Read the image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image at path: {image_path}")

        # Convert to RGB (OpenCV uses BGR by default)
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        # Extract text using Tesseract
        extracted_text = pytesseract.image_to_string(
            img,
            config="--psm 7 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-' "
        )

        return extracted_text.strip()
    except pytesseract.TesseractNotFoundError:
        raise Exception(
            "Tesseract is not installed or not found in PATH. "
            "Please install Tesseract from: https://github.com/UB-Mannheim/tesseract/wiki"
        )
    except Exception as e:
        raise Exception(f"Error extracting text from image: {str(e)}")

### **🔹 Function: Extract Pokémon Name More Accurately**
def extract_pokemon_name(extracted_text):
    extracted_text = extracted_text.replace("' ", " ").strip()  # Normalize apostrophe and remove spaces

    # ✅ Remove unwanted characters but KEEP `'`
    cleaned_text = re.sub(r"[^A-Za-z\s'-]", '', extracted_text).strip()
    
    words = cleaned_text.split()
    if not words:
        return "Unknown"

    return " ".join(words)  

### **🔹 Function: Validate Pokémon Name via API**
def validate_pokemon_card(pokemon_name):
    pokemon_name = pokemon_name.replace("' ", " ").strip()  # Normalize apostrophe and trim spaces

    params = {"q": f'name:"{pokemon_name}"'}
    headers = {"X-Api-Key": API_KEY}
    response = requests.get(BASE_URL, headers=headers, params=params)
    
    if response.status_code == 200:
        cards = response.json().get("data", [])
        return len(cards) > 0  
    return False

### **🔹 Main Function: Authenticate Pokémon Cards (OCR + API Validation)**
def authenticate_card(image_path):
    image_path = Path(image_path)  # Ensure path is a Pathlib object

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

        # Validate the Pokémon name using Pokémon TCG API
        valid = validate_pokemon_card(pokemon_name)

        # Return result based on API check
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
