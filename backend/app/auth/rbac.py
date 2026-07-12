from collections.abc import Callable

from fastapi import Depends, HTTPException, status

from app.auth.jwt_handler import get_current_user
from app.models.enums import UserRole
from app.models.user import User


def require_role(*roles: UserRole) -> Callable:
    async def dependency(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return current_user

    return dependency
