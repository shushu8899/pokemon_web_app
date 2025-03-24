from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies.db import get_db
from app.services.search_service import SearchService
from app.dependencies.services import get_search_service

router = APIRouter()
# search_service = SearchService(get_db)

# @router.get("/search/all")
# def search_all_tables(query: str, search_service: SearchService = Depends(get_search_service)):
#     """
#     Endpoint to search across all configured tables based on the search query.
#     """
#     results = search_service.search_all_tables(query)
#     total_results = len(results)
    
#     if not results:
#         raise HTTPException(status_code=404, detail="No results found")
    
#     # Group results by table for better organization
#     grouped_results = {}
#     for result in results:
#         table_name = result.get("_table", "unknown")
#         if table_name not in grouped_results:
#             grouped_results[table_name] = []
#         grouped_results[table_name].append(result)

#     return {
#         "total": total_results,
#         "tables_matched": len(grouped_results),
#         "results": grouped_results
#     }
@router.get("/search/all")
def search_all_tables(
    query: str, 
    search_service: SearchService = Depends(get_search_service)
):
    """
    Endpoint to search across all configured tables based on the search query.
    """
    # Pass pagination parameters to search service
    search_results = search_service.search_all_tables(query)
    
    # The search_results structure now contains:
    # {
    #   "total": total_count,
    #   "results": paginated_results,
    #   "categories": { "profiles": count, "card_auctions": count },
    #   "limit": limit,
    #   "offset": offset
    # }
    
    if not search_results["total"]:
        raise HTTPException(status_code=404, detail="No results found")
    
    # Group results by result_type for better organization
    grouped_results = {}
    for result in search_results["results"]:
        result_type = result.get("result_type", "unknown")
        if result_type not in grouped_results:
            grouped_results[result_type] = []
        grouped_results[result_type].append(result)

    # Return pagination info along with grouped results
    return {
        "total": search_results["total"],
        "categories": search_results["categories"],
        "results": grouped_results
    }

@router.get("/search/cards")
def search_cards(Card_search: str, search_service: SearchService = Depends(get_search_service)):
    """
    Endpoint to search for cards based on the search query.
    """
    getcards = search_service.search_cards(Card_search)
    total_cards = search_service.get_card_counts(Card_search)
    if not getcards:
        raise HTTPException(status_code=404, detail="Cards not found")
    return {"cards": getcards, "Total cards found": total_cards}

@router.get("/search/profiles")
def search_profiles(Profile_search: str, search_service: SearchService = Depends(get_search_service)):
    """
    Endpoint to search for profiles based on the search query.
    """
    profile = search_service.search_profiles(Profile_search)
    total_profiles = search_service.get_profile_counts(Profile_search)
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return {"profiles": profile, "Total profiles found": total_profiles}

@router.get("/search/auctions")
def search_auctions(Auction_search: str, search_service: SearchService = Depends(get_search_service)):
    """
    Endpoint to search for auctions based on the search query.
    """
    auctions = search_service.search_auctions(Auction_search)
    total_auctions = search_service.get_auction_counts(Auction_search)
    if not auctions:
        raise HTTPException(status_code=404, detail="No auctions not found")
    return {"auctions": auctions, "Total auctions found": total_auctions}