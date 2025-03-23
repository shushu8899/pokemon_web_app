import cv2
import numpy as np
import requests
from pathlib import Path
import os

API_KEY = "67652158-5942-474b-bcef-653249bba035"
BASE_URL = "https://api.pokemontcg.io/v2/cards"

### 🔹 Download Official Card Image using Pokémon TCG API Card ID
def get_official_card_image(card_tcg_id):
    params = {"q": f'id:"{card_tcg_id}"'}
    headers = {"X-Api-Key": API_KEY}
    response = requests.get(BASE_URL, headers=headers, params=params)
    
    if response.status_code == 200:
        cards = response.json().get("data", [])
        if len(cards) > 0:
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
    print(f"🖼️ Uploaded image: {uploaded_image_path}")
    print(f"🖼️ Official image: {official_image_path}")

    img1 = cv2.imread(str(uploaded_image_path), cv2.IMREAD_GRAYSCALE)
    img2 = cv2.imread(str(official_image_path), cv2.IMREAD_GRAYSCALE)

    print(f"📸 Image 1 loaded: {'Yes' if img1 is not None else 'No'}")
    print(f"📸 Image 2 loaded: {'Yes' if img2 is not None else 'No'}")

    if img1 is None or img2 is None:
        print("❌ One or both images failed to load.")
        return False, 0

    orb = cv2.ORB_create()

    kp1, des1 = orb.detectAndCompute(img1, None)
    kp2, des2 = orb.detectAndCompute(img2, None)

    print(f"🔑 Descriptors in Image 1: {'Found' if des1 is not None else 'Not Found'}")
    print(f"🔑 Descriptors in Image 2: {'Found' if des2 is not None else 'Not Found'}")

    if des1 is None or des2 is None:
        print("⚠️ Descriptors missing for one or both images.")
        return False, 0

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des1, des2)
    matches = sorted(matches, key=lambda x: x.distance)
    good_matches = [m for m in matches if m.distance < 60]

    print(f"📏 Threshold for Good Matches: 60")
    print(f"🔍 Total Matches: {len(matches)} | Good Matches: {len(good_matches)}")

    avg_distance = sum(m.distance for m in good_matches) / len(good_matches) if good_matches else 0
    print(f"📊 Average Descriptor Distance (Good Matches): {avg_distance:.2f}")

    match_percentage = (len(good_matches) / len(matches)) * 100 if matches else 0
    print(f"🎯 Match Accuracy: {match_percentage:.2f}%")

    REQUIRED_PERCENT = 95.0
    is_authentic = (match_percentage >= REQUIRED_PERCENT)

    if is_authentic:
        print("🟢 Card is REAL")
    else:
        print("🔴 Card is FAKE")

    return is_authentic, match_percentage

### 🔹 Main Verification Function (Uses Card ID)
def authenticate_card(image_path, card_tcg_id):
    image_path = Path(image_path)

    if not image_path.exists():
        return {
            "message": "Verification failed",
            "result": {
                "result": "Error",
                "card_tcg_id": None,
                "error": f"Image file '{image_path}' not found."
            }
        }

    try:
        print(f"📄 Verifying Pokémon Card ID: {card_tcg_id}")

        official_url = get_official_card_image(card_tcg_id)

        if not official_url:
            return {
                "message": "Verification failed",
                "result": {
                    "result": "Fake",
                    "card_tcg_id": card_tcg_id,
                    "error": "Official card image not found in Pokémon TCG API."
                }
            }

        # Download Official Image
        official_img_path = Path(__file__).parent.parent / "static" / "images" / f"official_{card_tcg_id}.jpg"
        download_success = download_image_from_url(official_url, official_img_path)

        if not download_success:
            return {
                "message": "Verification failed",
                "result": {
                    "result": "Error",
                    "card_tcg_id": card_tcg_id,
                    "error": "Failed to download official card image."
                }
            }

        # Match images
        is_authentic, match_percentage = match_images(image_path, official_img_path)

        if official_img_path.exists():
            official_img_path.unlink()

        return {
            "message": "Verification complete",
            "result": {
                "result": "Authentic" if is_authentic else "Fake",
                "card_tcg_id": card_tcg_id,
                "match_percentage": f"{match_percentage:.2f}%"
            }
        }

    except Exception as e:
        return {
            "message": "Verification failed",
            "result": {
                "result": "Error",
                "card_tcg_id": None,
                "error": str(e)
            }
        }
