from fastapi import Depends
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException, status

from app.core.database import get_db
from app.services.auth import AuthService

from fastapi import Query

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", auto_error=False)

def get_current_user(
    token_header: str = Depends(oauth2_scheme),
    token_query: str = Query(None, alias="token"),
    db: Session = Depends(get_db)
):
    token = token_query if token_query else token_header
    
    if not token:
         raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    auth_service = AuthService(db)

    user = auth_service.get_current_user(token)

    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    return user
