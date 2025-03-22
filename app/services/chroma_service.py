import chromadb
import chromadb.utils.embedding_functions as embedding_functions
from typing import List
import openai
import os
from dotenv import load_dotenv

load_dotenv()

class ChromaService:
    def __init__(self):
        # Initialize ChromaDB Persistent Client
        self.client = chromadb.PersistentClient(path="./chromadb")

        # OpenAI embedding function
        self.embedding_function = embedding_functions.OpenAIEmbeddingFunction(
            api_key=os.getenv("OPENAI_API_KEY"),
            model_name="text-embedding-3-small"
        )

        # Initialize or create the "pokemon" collection
        self.pokemon_collection = self.client.get_or_create_collection(
            name="pokemon",
            embedding_function=self.embedding_function
        )

    def add_pokemon(self, pokemon_name: str, description: str):
        """
        Add Pokémon description embedding to ChromaDB.
        """
        pokemon_id = pokemon_name.lower().replace(" ", "_")  # e.g., dragapult_dusknoir

        self.pokemon_collection.upsert(
            ids=[pokemon_id],
            documents=[description],
            metadatas=[{"pokemon_name": pokemon_name}]
        )
        print(f"✅ Added {pokemon_name} to ChromaDB successfully.")

    def search_pokemon(self, query: str, n_results: int = 3, distance_threshold: float = 0.8):
        """
        Search Pokémon context in ChromaDB based on query.
        """
        results = self.pokemon_collection.query(
            query_texts=[query],
            n_results=n_results
        )
        metadatas = results["metadatas"][0]
        documents = results["documents"][0]
        distances = results["distances"][0]

        filtered_results = [
            {"metadata": metadata, "document": doc, "distance": distance}
            for metadata, doc, distance in zip(metadatas, documents, distances)
            if distance <= distance_threshold
        ]

        return filtered_results

    def delete_pokemon(self, pokemon_name: str):
        """
        Delete Pokémon context from ChromaDB.
        """
        pokemon_id = pokemon_name.lower().replace(" ", "_")
        existing = self.pokemon_collection.get(ids=[pokemon_id])
        if not existing["metadatas"]:
            return False  # Not found
        self.pokemon_collection.delete(ids=[pokemon_id])
        return True
