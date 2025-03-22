import requests
import os

API_KEY = "67652158-5942-474b-bcef-653249bba035"  # Replace with your actual API key
BASE_URL = "https://api.pokemontcg.io/v2/cards"

def download_card_image(card_id):
    headers = {"X-Api-Key": API_KEY}
    url = f"{BASE_URL}/{card_id}"  # Fetch card by ID
    
    response = requests.get(url, headers=headers)
    
    if response.status_code == 200:
        card = response.json().get("data", {})
        image_url = card.get("images", {}).get("large", None)
        name = card.get("name", "Unknown").replace(" ", "_")
        
        if image_url:
            print(f"Downloading {name} from {image_url} ...")
            
            # Download image
            img_data = requests.get(image_url).content
            save_path = os.path.join("static", "uploads", f"{card_id}_{name}.jpg")
            with open(save_path, "wb") as f:
                f.write(img_data)
            
            print(f"✅ Image saved to: {save_path}")
        else:
            print("❌ No image found for this card.")
    else:
        print(f"❌ Failed to fetch card data. Status: {response.status_code}")

if __name__ == "__main__":
    # Example card ID, replace with any valid ID
    card_id = "sv8pt5-73"
    download_card_image(card_id)
