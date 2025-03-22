# ✅ pokemon_rag_service.py

from dotenv import load_dotenv
import os
import requests
import time
import asyncio
from langchain_openai import ChatOpenAI
from app.services.chroma_service import ChromaService
from app.exceptions import APIStatusError

# ✅ Load environment variables
load_dotenv()

class PokemonRagService:
    def __init__(self):
        self.pokemon_api_url = "https://api.pokemontcg.io/v2/cards"
        self.pokemon_api_key = os.getenv("POKEMON_TCG_API_KEY")
        self.max_retries = 3
        self.base_delay = 1  # Base delay in seconds

        if not os.getenv("OPENAI_API_KEY"):
            raise ValueError("❌ OPENAI_API_KEY is missing! Set it in the environment.")

        self.llm = ChatOpenAI(model_name="gpt-4", temperature=0)
        self.chroma_service = ChromaService()

    async def fetch_pokemon_details(self, pokemon_name: str, user_query: str = "Tell me about this Pokémon"):
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

            static_context = await self.retrieve_pokemon_context_with_retry(pokemon_name)
            pokemon_info["description"] = await self.generate_pokemon_description(pokemon_info, static_context, user_query)

            return pokemon_info

        except requests.exceptions.RequestException as e:
            return {"error": f"Failed to fetch data from Pokémon API: {str(e)}"}

    async def retrieve_pokemon_context_with_retry(self, pokemon_name: str):
        for attempt in range(self.max_retries):
            try:
                results = self.chroma_service.search_pokemon(query=pokemon_name, distance_threshold=1.0)
                if results:
                    combined_text = "\n\n".join([r["document"] for r in results])
                    return combined_text
                return "No additional context found."
            except Exception as e:
                if "429" in str(e):
                    if attempt < self.max_retries - 1:
                        delay = self.base_delay * (2 ** attempt)  # Exponential backoff
                        print(f"Rate limit hit, retrying in {delay} seconds...")
                        await asyncio.sleep(delay)
                        continue
                    return "Rate limit reached. Please try again in a few moments."
                return "Error retrieving Pokemon context. Please try again later."
        return "Service temporarily unavailable due to rate limits. Please try again later."

    async def generate_pokemon_description(self, pokemon_info, static_context, user_query):
        for attempt in range(self.max_retries):
            try:
                prompt = f"""
                Card Details from Pokémon TCG API:
                Name: {pokemon_info['name']}
                Supertype: {pokemon_info['supertype']}
                Subtypes: {pokemon_info['subtypes']}
                HP: {pokemon_info['hp']}
                Set: {pokemon_info['set']}
                Attacks: {pokemon_info['attacks']}

                Additional Context:
                {static_context}

                User Question: {user_query}

                Provide a well-structured answer combining the card details and additional context. Format nicely.
                """

                response = self.llm.invoke(prompt)
                return response.content.replace("\n", "\n\n")

            except Exception as e:
                if "429" in str(e):
                    if attempt < self.max_retries - 1:
                        delay = self.base_delay * (2 ** attempt)  # Exponential backoff
                        print(f"Rate limit hit, retrying in {delay} seconds...")
                        await asyncio.sleep(delay)
                        continue
                    return "Rate limit reached. Please try again in a few moments."
                return f"Error generating description: {str(e)}"
        return "Service temporarily unavailable due to rate limits. Please try again later."

    def query_pokemon(self, query: str) -> str:
        try:
            # Search for relevant Pokemon information with retry
            for attempt in range(self.max_retries):
                try:
                    results = self.chroma_service.search_pokemon(query=query, distance_threshold=1.0)
                    
                    if not results:
                        raise APIStatusError(
                            status_code=404,
                            message="No Pokemon information found",
                            response=None,
                            body=None
                        )
                    
                    # Format the response
                    response = f"Here's what I found about {query}:\n\n"
                    for result in results:
                        response += f"{result['document']}\n\n"
                    
                    return response
                    
                except Exception as e:
                    if "429" in str(e) and attempt < self.max_retries - 1:
                        delay = self.base_delay * (2 ** attempt)
                        print(f"Rate limit hit, retrying in {delay} seconds...")
                        time.sleep(delay)
                        continue
                    raise e
                    
        except Exception as e:
            raise APIStatusError(
                status_code=429 if "429" in str(e) else 500,
                message=str(e),
                response=None,
                body=None
            )
