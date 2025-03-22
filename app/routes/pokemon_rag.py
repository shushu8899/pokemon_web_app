# ✅ pokemon_rag.py

from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from typing import Optional
from app.services.pokemon_rag_service import PokemonRagService
from app.dependencies.auth import req_user_or_admin
from app.services.profile_service import get_current_user

router = APIRouter()
pokemon_service = PokemonRagService()

class PokemonQuery(BaseModel):
    pokemon_name: str
    user_query: Optional[str] = "Tell me about this Pokémon"

@router.post("/fetch", status_code=status.HTTP_200_OK, dependencies=[Depends(req_user_or_admin)])
async def fetch_pokemon(
    request: PokemonQuery,
    auth_info: dict = Depends(get_current_user)
):
    """
    ✅ Fetch Pokémon details from Pokémon TCG API and ChromaDB context.
    ✅ Combines both sources for a RAG-enhanced answer.
    """
    try:
        card_info = await pokemon_service.fetch_pokemon_details(request.pokemon_name, request.user_query)
        if "error" in card_info:
            raise HTTPException(status_code=404, detail=card_info["error"])
        return card_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
