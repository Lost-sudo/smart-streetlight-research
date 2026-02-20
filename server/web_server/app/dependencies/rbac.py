from fastapi import Depends, HTTPException, status
from typing import List

from app.dependencies.auth import get_current_user

def require_roles(allowed_roles: List[str]):
    def role_checker(current_user = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not enough permission")

        return current_user

    return role_checker
