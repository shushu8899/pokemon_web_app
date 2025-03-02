'''
This script defines role-checking dependencies for the FastAPI endpoints.
'''

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.cognito_service import CognitoService, RoleChecker, CognitoAdminRole, CognitoUserRole

security = HTTPBearer()
cognito_service = CognitoService()  # Create an instance of CognitoService

# ✅ Require user role (Regular Users)
req_user_role = RoleChecker(CognitoUserRole)

# ✅ Require admin role (Admins)
req_admin_role = RoleChecker(CognitoAdminRole)

def get_current_user(auth: HTTPAuthorizationCredentials = Security(security)):
    """
    Extract and verify Cognito user token from the request header.
    """
    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")

    claims = cognito_service.validate_token(auth)

    # ✅ Ensure User ID is extracted correctly
    user_id = claims.get("custom:user_id") or claims.get("sub")
    if not user_id:
        raise HTTPException(status_code=403, detail="User authentication failed - Missing user_id")

    return {
        "sub": claims.get("sub"),
        "user_id": user_id,
        "role": claims.get("cognito:groups", ["Users"])[0],
        "email": claims.get("email")
    }


# ✅ New Dependency to Allow Both Users & Admins
def req_user_or_admin(auth: HTTPAuthorizationCredentials = Security(security)):
    """
    Allow both 'Users' and 'Admins' to access routes.
    """
    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")

    claims = cognito_service.validate_token(auth)
    user_roles = claims.get("cognito:groups", [])

    # ✅ Check if the user is in "Users" or "Admins" group
    if "Admins" in user_roles or "Users" in user_roles:
        return claims  # ✅ Allow access

    raise HTTPException(status_code=403, detail="Insufficient permissions. Only Users or Admins allowed.")
