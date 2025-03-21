#!/bin/bash

# Enable error handling
set -e

# Move to the directory of the script
cd "$(dirname "$0")"

echo "Deleting migrations folder..."
rm -rf migrations

echo "Initializing Alembic migrations..."
python3 -m alembic init migrations

ENV_FILE="migrations/env.py"
TEMP_FILE="temp.txt"

# Set the search term and replacement block
SEARCH_TERM="target_metadata = None"
REPLACEMENT=$(cat <<EOF
from app.db.db import Base
from app.models.auction import Auction
from app.models.card import Card
from app.models.profile import Profile
from app.models.notifications import Notification
target_metadata = Base.metadata
EOF
)

# Replace the specific line in env.py
awk -v search="$SEARCH_TERM" -v replacement="$REPLACEMENT" '
{
    if ($0 == search) {
        print replacement
    } else {
        print $0
    }
}' "$ENV_FILE" > "$TEMP_FILE" && mv "$TEMP_FILE" "$ENV_FILE"

echo "Creating Alembic revision for Auction App..."
python3 -m alembic revision --autogenerate -m "Init Auction App"

echo "Applying migrations..."
python3 -m alembic upgrade head

echo "Starting FastAPI application with uvicorn..."
uvicorn myapp:app --host 0.0.0.0 --port 8000 &  # Run your app in the background