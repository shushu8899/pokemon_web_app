import requests

API_KEY = "67652158-5942-474b-bcef-653249bba035"  # Replace with your actual Pokémon TCG API key
BASE_URL = "https://api.pokemontcg.io/v2/cards"

def fetch_dragapult_cards():
    headers = {"X-Api-Key": API_KEY}
    params = {"q": 'name:"Dragapult"'}

    response = requests.get(BASE_URL, headers=headers, params=params)

    if response.status_code == 200:
        cards = response.json().get("data", [])
        if cards:
            for card in cards:
                card_id = card.get("id", "N/A")
                name = card.get("name", "N/A")
                set_name = card.get("set", {}).get("name", "N/A")
                rarity = card.get("rarity", "N/A")
                image_url = card.get("images", {}).get("large", "No Image Available")
                
                print(f"ID: {card_id}")
                print(f"Name: {name}")
                print(f"Set: {set_name}")
                print(f"Rarity: {rarity}")
                print(f"Image URL: {image_url}")
                print("-" * 40)
        else:
            print("No Dragapult cards found.")
    else:
        print(f"Failed to fetch cards. Status Code: {response.status_code}")

if __name__ == "__main__":
    fetch_dragapult_cards()
