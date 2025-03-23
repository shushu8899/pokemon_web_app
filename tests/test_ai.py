import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
import requests
from unittest.mock import Mock, MagicMock, patch
from app.exceptions import ServiceException
from app.services.search_service import SearchService
from app.models.profile import Profile
from app.models.card import Card
from app.models.auction import Auction
from app.models.notifications import Notification

from app.services.pokemon_rag_service import PokemonRagService

@pytest.fixture
def mock_db():
    return Mock()

@pytest.fixture
def mock_env():
    """Mock environment variables."""
    os.environ['POKEMON_TCG_API_KEY'] = 'test_pokemon_key'
    os.environ['OPENAI_API_KEY'] = 'test_openai_key'
    yield
    del os.environ['POKEMON_TCG_API_KEY']
    del os.environ['OPENAI_API_KEY']


@pytest.mark.asyncio
async def test_initialization_success(mock_env):
    """Test successful initialization of PokemonRagService."""
    service = PokemonRagService()
    assert service.pokemon_api_url == 'https://api.pokemontcg.io/v2/cards'
    assert service.pokemon_api_key == 'test_pokemon_key'
    assert service.llm is not None


@pytest.mark.asyncio
async def test_initialization_missing_openai_key():
    """Test initialization failure when OPENAI_API_KEY is missing."""
    os.environ.pop('OPENAI_API_KEY', None)
    
    with pytest.raises(ValueError) as exc_info:
        PokemonRagService()
    
    assert 'OPENAI_API_KEY is missing!' in str(exc_info.value)


@pytest.mark.asyncio
@patch('pokemon_rag_service.requests.get')
async def test_fetch_pokemon_details_success(mock_get, mock_env):
    """Test fetching Pokémon details successfully."""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "data": [{
            "name": "Pikachu",
            "set": {"name": "Base Set"},
            "rarity": "Rare",
            "images": {"large": "http://example.com/pikachu.png"}
        }]
    }
    mock_response.status_code = 200
    mock_get.return_value = mock_response

    service = PokemonRagService()

    with patch.object(service.llm, 'invoke', return_value=MagicMock(content="Test Description")):
        result = await service.fetch_pokemon_details('Pikachu')

    assert result['name'] == 'Pikachu'
    assert result['set'] == 'Base Set'
    assert result['rarity'] == 'Rare'
    assert result['image_url'] == 'http://example.com/pikachu.png'
    assert result['description'] == 'Test Description'


@pytest.mark.asyncio
@patch('pokemon_rag_service.requests.get')
async def test_fetch_pokemon_details_no_data(mock_get, mock_env):
    """Test case when no Pokémon data is returned."""
    mock_response = MagicMock()
    mock_response.json.return_value = {"data": []}
    mock_response.status_code = 200
    mock_get.return_value = mock_response

    service = PokemonRagService()

    result = await service.fetch_pokemon_details('NonExistentPokemon')
    assert "error" in result
    assert "No Pokémon card found" in result["error"]


@pytest.mark.asyncio
@patch('pokemon_rag_service.requests.get')
async def test_fetch_pokemon_details_api_error(mock_get, mock_env):
    """Test handling of API error during fetching Pokémon details."""
    mock_get.side_effect = requests.RequestException("API request failed")

    service = PokemonRagService()
    result = await service.fetch_pokemon_details('Pikachu')

    assert "error" in result
    assert "Failed to fetch data from Pokémon API" in result["error"]


@pytest.mark.asyncio
async def test_generate_pokemon_description(mock_env):
    """Test description generation with OpenAI API."""
    service = PokemonRagService()

    with patch.object(service.llm, 'invoke', return_value=MagicMock(content="Generated Description")):
        result = await service.generate_pokemon_description({"name": "Pikachu", "set": "Base Set"})

    assert result == "Generated Description"