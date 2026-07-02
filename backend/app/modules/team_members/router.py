from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel, EmailStr, Field

from app.db.connection import get_connection

router = APIRouter(prefix="/team-members", tags=["team-members"])


class TeamMemberCreate(BaseModel):
    name: str = Field(min_length=1)
    department: str = Field(min_length=1)
    position: str | None = None
    email: EmailStr | None = None


class TeamMemberUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1)
    department: str | None = Field(default=None, min_length=1)
    position: str | None = None
    email: EmailStr | None = None
    active: bool | None = None


def row_to_member(row) -> dict[str, object]:
    member = dict(row)
    member["active"] = bool(member["active"])
    return member


@router.get("")
def list_team_members(include_inactive: bool = Query(default=False)) -> list[dict[str, object]]:
    query = """
        SELECT id, name, department, position, email, active, created_at, updated_at
        FROM team_members
    """
    params: tuple[object, ...] = ()
    if not include_inactive:
        query += " WHERE active = ?"
        params = (1,)
    query += " ORDER BY active DESC, name ASC"

    with get_connection() as connection:
        rows = connection.execute(query, params).fetchall()
    return [row_to_member(row) for row in rows]


@router.post("", status_code=201)
def create_team_member(payload: TeamMemberCreate) -> dict[str, object]:
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO team_members (name, department, position, email)
            VALUES (?, ?, ?, ?)
            """,
            (payload.name.strip(), payload.department.strip(), payload.position, payload.email),
        )
        row = connection.execute(
            """
            SELECT id, name, department, position, email, active, created_at, updated_at
            FROM team_members
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()
    return row_to_member(row)


@router.patch("/{member_id}")
def update_team_member(member_id: int, payload: TeamMemberUpdate) -> dict[str, object]:
    updates: list[str] = []
    values: list[object] = []
    data = payload.model_dump(exclude_unset=True)

    for field in ["name", "department", "position", "email"]:
        if field in data:
            value = data[field]
            if isinstance(value, str):
                value = value.strip()
            updates.append(f"{field} = ?")
            values.append(value)

    if "active" in data:
        updates.append("active = ?")
        values.append(1 if data["active"] else 0)

    if updates:
        updates.append("updated_at = CURRENT_TIMESTAMP")
        values.append(member_id)
        with get_connection() as connection:
            existing = connection.execute("SELECT id FROM team_members WHERE id = ?", (member_id,)).fetchone()
            if existing is None:
                raise HTTPException(status_code=404, detail="Team member not found")
            connection.execute(f"UPDATE team_members SET {', '.join(updates)} WHERE id = ?", tuple(values))
            row = connection.execute(
                """
                SELECT id, name, department, position, email, active, created_at, updated_at
                FROM team_members
                WHERE id = ?
                """,
                (member_id,),
            ).fetchone()
    else:
        with get_connection() as connection:
            row = connection.execute(
                """
                SELECT id, name, department, position, email, active, created_at, updated_at
                FROM team_members
                WHERE id = ?
                """,
                (member_id,),
            ).fetchone()
            if row is None:
                raise HTTPException(status_code=404, detail="Team member not found")

    return row_to_member(row)


@router.delete("/{member_id}")
def delete_team_member(member_id: int) -> dict[str, object]:
    with get_connection() as connection:
        existing = connection.execute("SELECT id FROM team_members WHERE id = ?", (member_id,)).fetchone()
        if existing is None:
            raise HTTPException(status_code=404, detail="Team member not found")
        connection.execute(
            """
            UPDATE team_members
            SET active = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
            """,
            (member_id,),
        )
    return {"status": "deleted", "id": member_id}