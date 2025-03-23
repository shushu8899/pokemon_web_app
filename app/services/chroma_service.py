import chromadb
import chromadb.utils.embedding_functions as embedding_functions
from typing import List
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

    def add_pokemon(self, pokemon_id: str, pokemon_name: str, description: str):
        """
        Add Pokémon description embedding to ChromaDB with unique TCG ID.
        """
        self.pokemon_collection.upsert(
            ids=[pokemon_id],
            documents=[description],
            metadatas=[{"pokemon_name": pokemon_name, "pokemon_id": pokemon_id}]
        )
        print(f"✅ Added {pokemon_name} (ID: {pokemon_id}) to ChromaDB successfully.")

    def search_pokemon(self, pokemon_id: str, n_results: int = 1):
        """
        Search Pokémon context in ChromaDB based on TCG ID.
        """
        results = self.pokemon_collection.get(ids=[pokemon_id])

        if not results["metadatas"]:
            return []

        return [
            {"metadata": metadata, "document": doc}
            for metadata, doc in zip(results["metadatas"], results["documents"])
        ]

    def delete_pokemon(self, pokemon_id: str):
        """
        Delete Pokémon context from ChromaDB using TCG ID.
        """
        existing = self.pokemon_collection.get(ids=[pokemon_id])
        if not existing["metadatas"]:
            return False  # Not found
        self.pokemon_collection.delete(ids=[pokemon_id])
        print(f"🗑️ Deleted Pokémon card ID: {pokemon_id} from ChromaDB.")
        return True

    def update_pokemon(self, pokemon_id: str, pokemon_name: str, description: str):
        """
        Update Pokémon description embedding in ChromaDB. Works like upsert.
        """
        self.pokemon_collection.upsert(
            ids=[pokemon_id],
            documents=[description],
            metadatas=[{"pokemon_name": pokemon_name, "pokemon_id": pokemon_id}]
        )
        print(f"🔄 Updated Pokémon {pokemon_name} (ID: {pokemon_id}) in ChromaDB successfully.")
