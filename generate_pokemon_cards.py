import requests
import os

# ✅ Step 1: Set up API Key (replace with your actual API key)
API_KEY = "67652158-5942-474b-bcef-653249bba035"  # Replace with your API key
BASE_URL = "https://api.pokemontcg.io/v2/cards"

headers = {
    "X-Api-Key": API_KEY
}

# ✅ Step 2: Define Pokémon List for Similar Card Designs
POKEMON_LIST = [
    "Blastoise", "Venusaur", "Alakazam", "Gengar", "Mewtwo",
    "Zapdos", "Articuno", "Moltres", "Dragonite", "Tyranitar"
]
RARITY = "Rare Holo"

# ✅ Step 3: Set Upload Directory (`static/uploads/`)
UPLOAD_DIR = "static/uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Ensure the directory exists

# ✅ Step 4: Download Pokémon Cards
for pokemon in POKEMON_LIST:
    query = f'name:"{pokemon}" AND rarity:"{RARITY}"'
    params = {"q": query}

    response = requests.get(BASE_URL, headers=headers, params=params)

    if response.status_code == 200:
        data = response.json()
        cards = data["data"][:1]  # Get only the first matching card per Pokémon

        if not cards:
            print(f"⚠️ No card found for {pokemon}.")
            continue

        for i, card in enumerate(cards):
            image_url = card["images"]["large"]
            image_data = requests.get(image_url).content

            # ✅ Save the image in `static/uploads/`
            image_filename = f"{card['name'].replace(' ', '_')}_{i+1}.jpg"
            image_path = os.path.join(UPLOAD_DIR, image_filename)

            with open(image_path, "wb") as f:
                f.write(image_data)

            print(f"✅ Downloaded {card['name']} ({card.get('rarity', 'Unknown')}) - Saved to {image_path}")

print("\n🎉 All Pokémon card images saved in 'static/uploads/'")
