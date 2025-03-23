import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import pytest
from unittest.mock import Mock
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