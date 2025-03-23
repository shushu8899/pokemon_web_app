from fastapi import APIRouter, status, Depends, HTTPException, UploadFile, File
from app.services.chroma_service import ChromaService
from app.dependencies.auth import req_admin_role  # Admin-only dependency
from docx import Document
import os


router = APIRouter()
chroma_service = ChromaService()

@router.post("/add-context", status_code=status.HTTP_201_CREATED, dependencies=[Depends(req_admin_role)])
async def add_pokemon_context(pokemon_name: str, file: UploadFile = File(...)):
    """
    Admin-only endpoint to add Pokémon context by uploading a Word document (.docx).
    """
    try:
        if not file.filename.endswith(".docx"):
            raise HTTPException(status_code=400, detail="Only .docx files are supported.")

        # Save uploaded file temporarily
        temp_path = f"temp_{file.filename}"
        contents = await file.read()
        with open(temp_path, "wb") as f:
            f.write(contents)

        # Parse Word file content
        doc = Document(temp_path)
        parsed_text = ""
        for para in doc.paragraphs:
            parsed_text += para.text.strip() + "\n\n"

        # Save to ChromaDB
        chroma_service.add_pokemon(pokemon_name, parsed_text)

        # Clean up temp file
        os.remove(temp_path)

        return {"message": f"Pokémon '{pokemon_name}' context added successfully from Word document."}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
