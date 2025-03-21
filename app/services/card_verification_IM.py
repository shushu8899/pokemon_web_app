import cv2
import numpy as np
import requests
from pathlib import Path
import os

API_KEY = "67652158-5942-474b-bcef-653249bba035"
BASE_URL = "https://api.pokemontcg.io/v2/cards"

### 🔹 Download Official Card Image from Pokémon TCG API
def get_official_card_image(pokemon_name):
    pokemon_name = pokemon_name.strip()
    params = {"q": f'name:"{pokemon_name}"'}
    headers = {"X-Api-Key": API_KEY}
    response = requests.get(BASE_URL, headers=headers, params=params)
    
    if response.status_code == 200:
        cards = response.json().get("data", [])
        if len(cards) > 0:
            # Get large image URL
            image_url = cards[0]['images']['large']
            return image_url
    return None

### 🔹 Download Image from URL
def download_image_from_url(url, save_path):
    response = requests.get(url)
    if response.status_code == 200:
        with open(save_path, 'wb') as f:
            f.write(response.content)
        return True
    return False

### 🔹 ORB Feature Matching
def match_images(uploaded_image_path, official_image_path):
    img1 = cv2.imread(str(uploaded_image_path), cv2.IMREAD_GRAYSCALE)
    img2 = cv2.imread(str(official_image_path), cv2.IMREAD_GRAYSCALE)

    if img1 is None or img2 is None:
        return False, 0

    orb = cv2.ORB_create()

    kp1, des1 = orb.detectAndCompute(img1, None)
    kp2, des2 = orb.detectAndCompute(img2, None)

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

    if des1 is None or des2 is None:
        return False, 0

    matches = bf.match(des1, des2)
    matches = sorted(matches, key=lambda x: x.distance)
    good_matches = [m for m in matches if m.distance < 60]

    print(f"🔍 Total Matches: {len(matches)} | Good Matches: {len(good_matches)}")

    # Print match percentage
    match_percentage = (len(good_matches) / len(matches)) * 100 if matches else 0
    print(f"🎯 Match Accuracy: {match_percentage:.2f}%")

    # Threshold (Tune as needed)
    is_authentic = len(good_matches) > 20
    return is_authentic, match_percentage


### 🔹 Main Verification Function (Same Name)
def authenticate_card(image_path, pokemon_name):
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
        print(f"📄 Verifying Pokémon: {pokemon_name}")

        official_url = get_official_card_image(pokemon_name)

        if not official_url:
            return {
                "message": "Verification failed",
                "result": {
                    "result": "Fake",
                    "pokemon_name": pokemon_name,
                    "error": "Official card image not found in Pokémon TCG API."
                }
            }

        # Download Official Image
        official_img_path = Path(__file__).parent.parent / "static" / "images" / f"official_{pokemon_name}.jpg"
        download_success = download_image_from_url(official_url, official_img_path)

        if not download_success:
            return {
                "message": "Verification failed",
                "result": {
                    "result": "Error",
                    "pokemon_name": pokemon_name,
                    "error": "Failed to download official card image."
                }
            }

        # Match images
        is_authentic, match_percentage = match_images(image_path, official_img_path)

        # Optional: Delete official image after matching
        if official_img_path.exists():
            official_img_path.unlink()

        return {
            "message": "Verification complete",
            "result": {
                "result": "Authentic" if is_authentic else "Fake",
                "pokemon_name": pokemon_name,
                "match_percentage": f"{match_percentage:.2f}%"
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

