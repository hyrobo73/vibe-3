from fastapi import APIRouter
from pydantic import BaseModel

from app.db.connection import get_connection

router = APIRouter(prefix="/schedules", tags=["schedules"])


class ScheduleCreate(BaseModel):
    type: str
    title: str
    starts_at: str
    ends_at: str
    location: str | None = None
    visibility: str = "team"
    approval_status: str = "pending"


@router.get("")
def list_schedules() -> list[dict[str, object]]:
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, user_id, type, title, starts_at, ends_at, location, visibility, approval_status, created_at
            FROM schedules
            ORDER BY starts_at ASC
            """
        ).fetchall()
    return [dict(row) for row in rows]


@router.post("", status_code=201)
def create_schedule(payload: ScheduleCreate) -> dict[str, object]:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO schedules (type, title, starts_at, ends_at, location, visibility, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.type,
                payload.title,
                payload.starts_at,
                payload.ends_at,
                payload.location,
                payload.visibility,
                payload.approval_status,
            ),
        )
        row = connection.execute(
            """
            SELECT id, user_id, type, title, starts_at, ends_at, location, visibility, approval_status, created_at
            FROM schedules
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
    return dict(row)
