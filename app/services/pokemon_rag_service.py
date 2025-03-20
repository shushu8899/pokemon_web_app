from dotenv import load_dotenv
import os
import requests
from langchain_openai import ChatOpenAI  # ✅ Match professor's approach

# ✅ Load environment variables
load_dotenv()

class PokemonRagService:
    def __init__(self):
        self.pokemon_api_url = "https://api.pokemontcg.io/v2/cards"
        self.pokemon_api_key = os.getenv("POKEMON_TCG_API_KEY")
        
        # ✅ OpenAI API Key is automatically handled by LangChain
        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("❌ OPENAI_API_KEY is missing! Set it in the environment.")

        self.llm = ChatOpenAI(model_name="gpt-4o", temperature=0)  # ✅ Matches prof's method

    async def fetch_pokemon_details(self, pokemon_name: str):
        """
        ✅ Fetch Pokémon details from Pokémon TCG API and use OpenAI API for insights.
        """
        headers = {"X-Api-Key": self.pokemon_api_key} if self.pokemon_api_key else {}

        url = f"{self.pokemon_api_url}?q=name:\"{pokemon_name}\"&pageSize=1"
        print(f"📡 API Request URL: {url}")

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            if "data" not in data or not data["data"]:
                return {"error": f"No Pokémon card found for '{pokemon_name}'."}

            card_data = data["data"][0]
            print(f"✅ API Response: {card_data}")

            # Extract basic details
            pokemon_info = {
                "name": card_data.get("name", "Unknown"),
                "supertype": card_data.get("supertype", "Unknown"),
                "subtypes": card_data.get("subtypes", "Unknown"),
                "level": card_data.get("level", "Unknown"),
                "hp": card_data.get("hp", "Unknown"),
                "types": card_data.get("types", "Unknown"),  
                "evolvesFrom": card_data.get("evolvesFrom", "Unknown"),  
                "set": card_data.get("set", {}).get("name", "Unknown"),
                "rarity": card_data.get("rarity", "Unknown"),
                "tcgplayer": card_data.get("tcgplayer", "Unknown"),
                "attacks": card_data.get("attacks", "Unknown"),  
                "weaknesses": card_data.get("weaknesses", "Unknown"),  
                "resistances": card_data.get("resistances", "Unknown"),
                "flavorText": card_data.get("flavorText", "Unknown"),                                                                     
                "image_url": card_data.get("images", {}).get("large", "No Image Available"),
            }

            # ✅ Use OpenAI to generate a description
            pokemon_info["description"] = await self.generate_pokemon_description(pokemon_info)

            return pokemon_info

        except requests.exceptions.RequestException as e:
            return {"error": f"Failed to fetch data from Pokémon API: {str(e)}"}

    async def generate_pokemon_description(self, pokemon_info):
        """
        ✅ Uses OpenAI API to generate a Pokémon card description with clean formatting.
        """
        try:
            prompt = f"""
            Provide a well-structured and readable description of the Pokémon card '{pokemon_info['name']}' from the '{pokemon_info['set']}' set.
            Ensure the description is formatted with new lines and sections starting with "**Section Title:**".
            Use bullet points where necessary.
            """
        
            response = self.llm.invoke(prompt)
        
            # ✅ Ensure proper line breaks and spacing in response
            return response.content.replace("\n", "\n\n")

        except Exception as e:
            return f"⚠️ OpenAI API Error: {str(e)}"

