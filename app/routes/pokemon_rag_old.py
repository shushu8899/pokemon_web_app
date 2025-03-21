from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
from app.services.pokemon_rag_service import PokemonRagService
from app.dependencies.auth import req_user_or_admin
from app.services.profile_service import ProfileService, get_current_user

router = APIRouter()
pokemon_service = PokemonRagService()

class PokemonQuery(BaseModel):
    pokemon_name: str

@router.post("/fetch", status_code=status.HTTP_200_OK, dependencies=[Depends(req_user_or_admin)])  # ✅ Require Auth
async def fetch_pokemon(
    request: PokemonQuery,
    auth_info: dict = Depends(get_current_user)  # ✅ Require authentication
):
    """
    ✅ Fetch Pokémon details from the Pokémon TCG API.
    ✅ Both **Users & Admins** can access this endpoint.
    """
    try:
        card_info = await pokemon_service.fetch_pokemon_details(request.pokemon_name)
        if "error" in card_info:
            raise HTTPException(status_code=404, detail=card_info["error"])
        return card_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
