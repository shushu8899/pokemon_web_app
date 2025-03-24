import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import patch
from app.services.pokemon_rag_service import PokemonRagService
import asyncio
import requests


@pytest.fixture
def mock_openai_api_key():
    """Fixture to mock the OPENAI_API_KEY."""
    with patch.dict("os.environ", {"OPENAI_API_KEY": "fake-openai-api-key"}):
        print("Mocked OPENAI_API_KEY:", os.getenv("OPENAI_API_KEY"))  # Debugging line
        yield


@pytest.fixture
def pokemon_service():
    """Fixture to initialize PokemonRagService."""
    # Ensure the PokemonRagService uses the mocked environment variable
    service = PokemonRagService()
    return service


def test_fetch_pokemon_details_success(pokemon_service, mock_openai_api_key):
    """Test to check if the Pokémon details are fetched correctly."""
    response = asyncio.run(pokemon_service.fetch_pokemon_details("Pikachu"))

    # Add your assertions based on the expected output
    assert "name" in response
    assert response["name"] == "Pikachu"
    assert response["set"] == "Wizards Black Star Promos"  # Adjust as needed
    assert response["rarity"] == "Promo"  # Adjust as needed
    assert "description" in response

def test_fetch_pokemon_details_not_found(pokemon_service, mock_openai_api_key):
    """Test to check if no Pokémon details are found for a non-existent Pokémon."""
    # Use asyncio.run to await the asynchronous function
    response = asyncio.run(pokemon_service.fetch_pokemon_details("NonExistentPokemon"))

    # Assert the expected error response when Pokémon is not found
    assert "error" in response
    assert response["error"] == "No Pokémon card found for 'NonExistentPokemon'."

def test_fetch_pokemon_details_api_failure(pokemon_service, mock_openai_api_key):
    """Test to check the behavior when the Pokémon TCG API request fails."""
    # Mock requests.get to raise a RequestException to simulate API failure
    with patch("requests.get") as mock_get:
        mock_get.side_effect = requests.exceptions.RequestException("API request failed")
        
        # Use asyncio.run to await the asynchronous function
        response = asyncio.run(pokemon_service.fetch_pokemon_details("Pikachu"))

        # Assert the error message when the API fails
        assert "error" in response
        assert response["error"] == "Failed to fetch data from Pokémon API: API request failed"

def test_fetch_multiple_pokemon_details(pokemon_service, mock_openai_api_key):
    pokemon_names = ["Pikachu", "Bulbasaur", "Charmander"]

    for pokemon_name in pokemon_names:
        # Use asyncio.run to await the asynchronous function
        response = asyncio.run(pokemon_service.fetch_pokemon_details(pokemon_name))

        # Assertions for each Pokémon
        assert "name" in response
        assert response["name"] == pokemon_name
        assert "set" in response
        assert "rarity" in response
        assert "image_url" in response
        assert "description" in response