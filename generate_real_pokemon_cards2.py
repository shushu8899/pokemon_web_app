import requests
import csv
import os

API_KEY = "67652158-5942-474b-bcef-653249bba035"
BASE_URL = "https://api.pokemontcg.io/v2/cards"
UPLOAD_FOLDER = "static/uploads"
CSV_FILENAME = "pokemon_cards_sample.csv"

# Create uploads folder if not exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def fetch_and_save_cards(sample_size=10):
    headers = {"X-Api-Key": API_KEY}
    params = {
        "pageSize": sample_size
    }

    response = requests.get(BASE_URL, headers=headers, params=params)

    if response.status_code == 200:
        data = response.json().get("data", [])
        print(f"\n📄 Retrieved {len(data)} cards. Saving images and CSV...\n")

        with open(CSV_FILENAME, mode='w', newline='', encoding='utf-8') as csv_file:
            fieldnames = ["ID", "Name", "Set", "Rarity", "Saved Image Path"]
            writer = csv.DictWriter(csv_file, fieldnames=fieldnames)
            writer.writeheader()

            for card in data:
                card_id = card.get("id", "N/A")
                name = card.get("name", "N/A")
                set_name = card.get("set", {}).get("name", "N/A")
                rarity = card.get("rarity", "N/A")
                image_url = card.get("images", {}).get("large", "")

                # Save image to static/uploads
                if image_url:
                    image_response = requests.get(image_url)
                    image_filename = f"{card_id}_{name.replace(' ', '_')}.jpg"
                    image_path = os.path.join(UPLOAD_FOLDER, image_filename)
                    with open(image_path, 'wb') as img_file:
                        img_file.write(image_response.content)
                else:
                    image_path = "No image"

                # Write card data to CSV
                writer.writerow({
                    "ID": card_id,
                    "Name": name,
                    "Set": set_name,
                    "Rarity": rarity,
                    "Saved Image Path": image_path
                })

                print(f"✅ Saved: {name} | Image: {image_path}")

        print(f"\n📄 CSV saved as {CSV_FILENAME}")

    else:
        print(f"❌ Failed to fetch cards. Status Code: {response.status_code}")

if __name__ == "__main__":
    fetch_and_save_cards()
