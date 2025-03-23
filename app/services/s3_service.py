import boto3    
import dotenv
from dotenv import load_dotenv
from urllib.parse import urlparse
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, Query
import os
from app.db.db import get_db
import uuid
from app.models.card import Card
from app.models.profile import Profile
from sqlalchemy.orm import Session
from app.dependencies.auth import req_user_or_admin
from app.services.profile_service import get_current_user
from botocore.exceptions import ClientError
import mimetypes
import logging

load_dotenv()
print("aws_access:", os.getenv("AWS__S3_ACCESS_KEY_ID"))
print("aws_secret:", os.getenv("AWS_S3_SECRET_ACCESS_KEY"))

AWS_REGION = "ap-southeast-1"
BUCKET_NAME = "pokemonimagestorage"

class S3UploadService:
    def __init__(self):
        self.access = os.getenv("AWS__S3_ACCESS_KEY_ID")
        self.aws_secret = os.getenv("AWS_S3_SECRET_ACCESS_KEY")

        # Initialize Boto3 Cognito client
        self.client =boto3.client('s3', aws_access_key_id=self.access, aws_secret_access_key=self.aws_secret,region_name=AWS_REGION)


    def generate_presigned_url(self, filename, db: Session, auth_info: dict):
        cognito_user_id = auth_info.get("sub")
        # Retrieve the user_id from the profiles table based on the cognito_user_id
        user_profile = db.query(Profile).filter(Profile.CognitoUserID == cognito_user_id).first()
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        # Store file inside user-specific folder
        unique_filename = f"{uuid.uuid4()}_{filename}"
        object_key = f"images/{unique_filename}"

        # Allowed extensions and MIME types
        allowed_extensions = {"jpg", "jpeg", "png", "gif"}
        allowed_mime_types = {"image/jpeg", "image/png", "image/gif"}

        # Extract extension
        file_extension = filename.split(".")[-1].lower()

        # Validate extension
        if file_extension not in allowed_extensions:
            return "Error: Unsupported file type"

        # Guess MIME type based on filename
        file_type, _ = mimetypes.guess_type(filename)

        # Normalize 'jpg' to 'jpeg'
        if file_type == "image/jpg":
            file_type = "image/jpeg"

        # Validate MIME type
        if file_type not in allowed_mime_types:
            return "Error: Invalid MIME type"

        # Generate pre-signed URL (valid for 1 hour)
        try:
            presigned_url = self.client.generate_presigned_url(
                "put_object",
                Params={
                    "Bucket": BUCKET_NAME,
                    "Key": object_key,
                    "ContentType": file_type,
                    'ACL': 'public-read'  # Makes the file publicly accessible
                },
                ExpiresIn=3600
            )
        except Exception as e:
                print(f"Error generating pre-signed URL: {e}")
                raise HTTPException(status_code=500, detail="Error generating pre-signed URL")


        return {"upload_url": presigned_url, "s3_url": f"https://{BUCKET_NAME}.s3.ap-southeast-1.amazonaws.com/{object_key}"}



    def delete_image(self, existing_card: Card):
        # Delete old image if it exists
        if existing_card.ImageURL:
            parsed_url = urlparse(existing_card.ImageURL)
            object_key = parsed_url.path.lstrip("/")  

            try:
                self.client.delete_object(Bucket=BUCKET_NAME, Key=object_key)
            except Exception as e:
                print(f"Failed to delete old image: {e}")


    def valid_url(self, image_path: str):
        # Check if the image is stored in S3 or locally
        if image_path.startswith("http"):  # ✅ Check if it's an S3 URL
            # Extract object key from S3 URL
            object_key = image_path.replace(f"https://{BUCKET_NAME}.s3.{AWS_REGION}.amazonaws.com/", "")
            try:
                self.client.head_object(Bucket=BUCKET_NAME, Key=object_key)
            except ClientError as e:
                if e.response["Error"]["Code"] == "404":
                    raise HTTPException(status_code=404, detail="Image not found in S3.") 
                else:
                    raise HTTPException(status_code=500, detail="Error checking S3 image.") 
        else:
            raise HTTPException(status_code=404, detail="URL is not valid.") 
        
s3 = S3UploadService()