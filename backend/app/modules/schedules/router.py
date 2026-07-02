from datetime import datetime

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, Field, model_validator

from app.db.connection import get_connection

router = APIRouter(prefix="/schedules", tags=["schedules"])


class ScheduleBase(BaseModel):
    member_id: int
    type: str = Field(min_length=1)
    title: str = Field(min_length=1)
    starts_at: str = Field(min_length=1)
    ends_at: str = Field(min_length=1)
    location: str | None = None
    memo: str | None = None
    visibility: str = "team"
    approval_status: str = "pending"

    @model_validator(mode="after")
    def validate_time_order(self):
        starts_at = parse_datetime(self.starts_at, "starts_at")
        ends_at = parse_datetime(self.ends_at, "ends_at")
        if starts_at >= ends_at:
            raise ValueError("ends_at must be after starts_at")
        return self


class ScheduleCreate(ScheduleBase):
    pass


class ScheduleUpdate(BaseModel):
    member_id: int | None = None
    type: str | None = Field(default=None, min_length=1)
    title: str | None = Field(default=None, min_length=1)
    starts_at: str | None = Field(default=None, min_length=1)
    ends_at: str | None = Field(default=None, min_length=1)
    location: str | None = None
    memo: str | None = None
    visibility: str | None = None
    approval_status: str | None = None


SCHEDULE_SELECT = """
    SELECT
      schedules.id,
      schedules.user_id,
      schedules.member_id,
      team_members.name AS member_name,
      team_members.department AS member_department,
      team_members.active AS member_active,
      schedules.type,
      schedules.title,
      schedules.starts_at,
      schedules.ends_at,
      schedules.location,
      schedules.memo,
      schedules.visibility,
      schedules.approval_status,
      schedules.created_at,
      schedules.updated_at
    FROM schedules
    LEFT JOIN team_members ON team_members.id = schedules.member_id
"""


def parse_datetime(value: str, field_name: str) -> datetime:
    try:
        return datetime.fromisoformat(value)
    except ValueError as exc:
        raise ValueError(f"{field_name} must be ISO datetime") from exc


def row_to_schedule(row) -> dict[str, object]:
    schedule = dict(row)
    if schedule.get("member_active") is not None:
        schedule["member_active"] = bool(schedule["member_active"])
    return schedule


def ensure_active_member(connection, member_id: int) -> None:
    row = connection.execute(
        "SELECT id FROM team_members WHERE id = ? AND active = 1",
        (member_id,),
    ).fetchone()
    if row is None:
        raise HTTPException(status_code=400, detail="Active team member is required")


@router.get("")
def list_schedules(
    start_date: str | None = Query(default=None),
    end_date: str | None = Query(default=None),
    member_id: int | None = Query(default=None),
) -> list[dict[str, object]]:
    filters: list[str] = []
    params: list[object] = []

    if start_date:
        filters.append("date(schedules.starts_at) >= date(?)")
        params.append(start_date)
    if end_date:
        filters.append("date(schedules.starts_at) <= date(?)")
        params.append(end_date)
    if member_id:
        filters.append("schedules.member_id = ?")
        params.append(member_id)

    query = SCHEDULE_SELECT
    if filters:
        query += " WHERE " + " AND ".join(filters)
    query += " ORDER BY schedules.starts_at ASC"

    with get_connection() as connection:
        rows = connection.execute(query, tuple(params)).fetchall()
    return [row_to_schedule(row) for row in rows]


@router.post("", status_code=201)
def create_schedule(payload: ScheduleCreate) -> dict[str, object]:
    with get_connection() as connection:
        ensure_active_member(connection, payload.member_id)
        cursor = connection.execute(
            """
            INSERT INTO schedules (member_id, type, title, starts_at, ends_at, location, memo, visibility, approval_status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                payload.member_id,
                payload.type.strip(),
                payload.title.strip(),
                payload.starts_at,
                payload.ends_at,
                payload.location,
                payload.memo,
                payload.visibility,
                payload.approval_status,
            ),
        )
        row = connection.execute(SCHEDULE_SELECT + " WHERE schedules.id = ?", (cursor.lastrowid,)).fetchone()
    return row_to_schedule(row)


@router.patch("/{schedule_id}")
def update_schedule(schedule_id: int, payload: ScheduleUpdate) -> dict[str, object]:
    data = payload.model_dump(exclude_unset=True)
    updates: list[str] = []
    values: list[object] = []

    with get_connection() as connection:
        existing = connection.execute("SELECT * FROM schedules WHERE id = ?", (schedule_id,)).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Schedule not found")

        starts_at = data.get("starts_at", existing["starts_at"])
        ends_at = data.get("ends_at", existing["ends_at"])
        try:
            if datetime.fromisoformat(starts_at) >= datetime.fromisoformat(ends_at):
                raise HTTPException(status_code=400, detail="ends_at must be after starts_at")
        except ValueError as exc:
            raise HTTPException(status_code=400, detail="Schedule datetime must be ISO format") from exc

        if "member_id" in data and data["member_id"] is not None:
            ensure_active_member(connection, data["member_id"])

        for field in ["member_id", "type", "title", "starts_at", "ends_at", "location", "memo", "visibility", "approval_status"]:
            if field in data:
                value = data[field]
                if isinstance(value, str):
                    value = value.strip()
                updates.append(f"{field} = ?")
                values.append(value)

        if updates:
            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(schedule_id)
            connection.execute(f"UPDATE schedules SET {', '.join(updates)} WHERE id = ?", tuple(values))

        row = connection.execute(SCHEDULE_SELECT + " WHERE schedules.id = ?", (schedule_id,)).fetchone()
    return row_to_schedule(row)


@router.delete("/{schedule_id}")
def delete_schedule(schedule_id: int) -> dict[str, object]:
    with get_connection() as connection:
        existing = connection.execute("SELECT id FROM schedules WHERE id = ?", (schedule_id,)).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Schedule not found")
        connection.execute("DELETE FROM schedules WHERE id = ?", (schedule_id,))
    return {"status": "deleted", "id": schedule_id}