"""Promote a user to admin (or demote) by email.

Usage:
    python -m app.db.make_admin someone@example.com [--demote]
"""

import argparse
import sys

from sqlalchemy import select

from app.db.models import User
from app.db.session import SessionLocal


def set_role(email: str, role: str) -> None:
    with SessionLocal() as db:
        user = db.scalar(select(User).where(User.email == email.lower()))
        if not user:
            sys.exit(f"error: no user with email '{email}'")
        user.role = role
        db.commit()
        print(f"ok: {email} is now '{role}' (user {user.id})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("email")
    parser.add_argument("--demote", action="store_true", help="Set role to 'user' instead of 'admin'")
    args = parser.parse_args()
    set_role(args.email, "user" if args.demote else "admin")


if __name__ == "__main__":
    main()