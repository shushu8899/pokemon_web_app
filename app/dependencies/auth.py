'''
This script defines role-checking dependencies for the FastAPI endpoints.

'''

from fastapi import Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.services.cognito_service import CognitoService, RoleChecker, CognitoAdminRole, CognitoUserRole

security = HTTPBearer()
cognito_service = CognitoService()

req_user_role = RoleChecker(CognitoUserRole)
req_admin_role = RoleChecker(CognitoAdminRole)


# New Dependency to Allow Both Users & Admins
def req_user_or_admin(auth: HTTPAuthorizationCredentials = Security(security)):
    """
    Allow both 'Users' and 'Admins' to access routes.
    """
    if not auth:
        raise HTTPException(status_code=401, detail="Not authenticated")

    claims = cognito_service.validate_token(auth)
    user_roles = claims.get("cognito:groups", [])

    # Check if the user is in "Users" or "Admins" group
    if "Admins" in user_roles or "Users" in user_roles:
        return claims 

    raise HTTPException(status_code=403, detail="Insufficient permissions. Only Users or Admins allowed.")
