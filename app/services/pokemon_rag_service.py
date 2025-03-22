from dotenv import load_dotenv
import os
import requests
from langchain_openai import ChatOpenAI
from app.services.chroma_service import ChromaService

# ✅ Load environment variables
load_dotenv()

class PokemonRagService:
    def __init__(self):
        self.pokemon_api_url = "https://api.pokemontcg.io/v2/cards"
        self.pokemon_api_key = os.getenv("POKEMON_TCG_API_KEY")

        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("❌ OPENAI_API_KEY is missing! Set it in the environment.")

        self.llm = ChatOpenAI(model_name="gpt-4o", temperature=0)
        self.chroma_service = ChromaService()

    async def fetch_pokemon_details(self, pokemon_id: str, user_query: str = "Tell me about this Pokémon card"):
        headers = {"X-Api-Key": self.pokemon_api_key} if self.pokemon_api_key else {}

        # 🔥 Fetch by ID directly!
        url = f"{self.pokemon_api_url}/{pokemon_id}"
        print(f"📡 API Request URL: {url}")

        try:
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            data = response.json()

            if "data" not in data or not data["data"]:
                return {"error": f"No Pokémon card found for ID '{pokemon_id}'."}

            card_data = data["data"]

            # Filter out 'Unknown' or null values
            pokemon_info = {k: v for k, v in {
                "id": card_data.get("id"),
                "name": card_data.get("name"),
                "supertype": card_data.get("supertype"),
                "subtypes": card_data.get("subtypes"),
                "level": card_data.get("level"),
                "hp": card_data.get("hp"),
                "types": card_data.get("types"),
                "evolvesFrom": card_data.get("evolvesFrom"),
                "set": card_data.get("set", {}).get("name"),
                "rarity": card_data.get("rarity"),
                "tcgplayer": card_data.get("tcgplayer"),
                "attacks": card_data.get("attacks"),
                "weaknesses": card_data.get("weaknesses"),
                "resistances": card_data.get("resistances"),
                "flavorText": card_data.get("flavorText"),
                "image_url": card_data.get("images", {}).get("large", "No Image Available"),
            }.items() if v and v != "Unknown"}

            # Get additional RAG context by ID
            static_context = self.retrieve_pokemon_context(pokemon_id)
            # Generate description
            pokemon_info["description"] = await self.generate_pokemon_description(pokemon_info, static_context, user_query)

            return pokemon_info

        except requests.exceptions.RequestException as e:
            return {"error": f"Failed to fetch data from Pokémon API: {str(e)}"}

    def retrieve_pokemon_context(self, pokemon_id: str):
        results = self.chroma_service.search_pokemon(pokemon_id=pokemon_id)
        if results:
            combined_text = "\n".join([r["document"] for r in results])
            return combined_text
        return ""

    async def generate_pokemon_description(self, pokemon_info, static_context, user_query):
        try:
            # 📌 Construct bullet points section
            card_details = ""
            if "id" in pokemon_info:
                card_details += f"- ID: {pokemon_info['id']}\n"
            if "name" in pokemon_info:
                card_details += f"- Name: {pokemon_info['name']}\n"
            if "supertype" in pokemon_info:
                card_details += f"- Supertype: {pokemon_info['supertype']}\n"
            if "subtypes" in pokemon_info:
                card_details += f"- Subtypes: {', '.join(pokemon_info['subtypes'])}\n"
            if "hp" in pokemon_info:
                card_details += f"- HP: {pokemon_info['hp']}\n"
            if "types" in pokemon_info:
                card_details += f"- Types: {', '.join(pokemon_info['types'])}\n"
            if "evolvesFrom" in pokemon_info:
                card_details += f"- Evolves From: {pokemon_info['evolvesFrom']}\n"
            if "set" in pokemon_info:
                card_details += f"- Set: {pokemon_info['set']}\n"
            if "rarity" in pokemon_info:
                card_details += f"- Rarity: {pokemon_info['rarity']}\n"
            if "attacks" in pokemon_info:
                attacks = "\n".join([
                    f"  • {attack['name']} (Cost: {', '.join(attack['cost'])}, Damage: {attack['damage']})"
                    for attack in pokemon_info['attacks']
                ])
                card_details += f"- Attacks:\n{attacks}\n"
            if "tcgplayer" in pokemon_info and "prices" in pokemon_info["tcgplayer"]:
                prices_info = pokemon_info["tcgplayer"]["prices"]
                price_details = ""
                for variant, price_data in prices_info.items():
                    variant_line = f"  • {variant.capitalize()}: "
                    sub_prices = []
                    for key, value in price_data.items():
                        if value is not None:
                            sub_prices.append(f"{key.capitalize()}: ${value}")
                    if sub_prices:
                        variant_line += ", ".join(sub_prices)
                        price_details += variant_line + "\n"
                if price_details:
                    card_details += f"- Prices:\n{price_details}"

            # 📝 Build the prompt
            prompt = f"""
You are a professional Pokémon card expert. You are tasked to format and explain Pokémon card details.

Here are the card details:
{card_details}

Additional Context (Lore & Tournament Info):
{static_context}

**Task:**
1. First, summarize the Pokémon card information into clean, well-structured paragraphs highlighting its key strengths, attacks, set, rarity, price range, and how it fits into gameplay.
2. Next, describe any lore or interesting facts (use the provided context).
3. Lastly, include any notable tournament appearances and player placements if mentioned in the context.
4. Omit any null or unknown values. Do not mention 'Unknown' or 'None'.
5. Do not repeat the bullet points; integrate details naturally in the paragraph.
6. End the description cleanly.

User question:
"{user_query}"

Answer:
"""

            # 🔥 Call LLM
            response = self.llm.invoke(prompt)
            return response.content.strip()

        except Exception as e:
            return f"⚠️ OpenAI API Error: {str(e)}"
