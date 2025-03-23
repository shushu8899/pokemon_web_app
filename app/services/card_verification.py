import cv2
import numpy as np
import requests
from pathlib import Path
import os
from app.services.s3_service import s3#  Import s3 directly

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
def download_image_from_url(url):
    response = requests.get(url)
    if response.status_code == 200:
        img_array = np.frombuffer(response.content, np.uint8)
        return cv2.imdecode(img_array, cv2.IMREAD_GRAYSCALE)
    return None

### 🔹 ORB Feature Matching
def match_images(uploaded_img, offical_img):
    # Check if images are loaded
    print(f"📸 Image 1 loaded: {'Yes' if uploaded_img is not None else 'No'}")
    print(f"📸 Image 2 loaded: {'Yes' if offical_img is not None else 'No'}")

    if uploaded_img is None or offical_img is None:
        print("❌ One or both images failed to load.")
        return False, 0

    orb = cv2.ORB_create()

    # Detect keypoints and descriptors
    kp1, des1 = orb.detectAndCompute(uploaded_img, None)
    kp2, des2 = orb.detectAndCompute(offical_img, None)

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

### 🔹 Main Verification Function (Same Name)
def authenticate_card(image_path, pokemon_name):
    s3.valid_url(image_path)
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

        # Download Images
        uploaded_img = download_image_from_url(image_path)
        official_img = download_image_from_url(official_url)

        if not official_img:
            return {
                "message": "Verification failed",
                "result": {
                    "result": "Error",
                    "card_tcg_id": card_tcg_id,
                    "error": "Failed to download official card image."
                }
            }

        # Match images
        is_authentic, match_percentage = match_images(uploaded_img, official_img)

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
