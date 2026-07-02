import sqlite3
from collections.abc import Iterator
from contextlib import contextmanager

from app.core.config import settings


def init_db() -> None:
    settings.data_dir.mkdir(parents=True, exist_ok=True)
    with get_connection() as connection:
        connection.executescript(
            """
            CREATE TABLE IF NOT EXISTS team_members (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              name TEXT NOT NULL,
              department TEXT NOT NULL,
              position TEXT,
              email TEXT,
              active INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS schedules (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL DEFAULT 1,
              member_id INTEGER,
              type TEXT NOT NULL,
              title TEXT NOT NULL,
              starts_at TEXT NOT NULL,
              ends_at TEXT NOT NULL,
              location TEXT,
              memo TEXT,
              visibility TEXT NOT NULL DEFAULT 'team',
              approval_status TEXT NOT NULL DEFAULT 'pending',
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (member_id) REFERENCES team_members(id)
            );

            CREATE TABLE IF NOT EXISTS excel_jobs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL DEFAULT 1,
              job_type TEXT NOT NULL,
              status TEXT NOT NULL,
              input_path TEXT,
              output_path TEXT,
              error_message TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS complaint_manuals (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              file_path TEXT NOT NULL,
              uploaded_by INTEGER NOT NULL DEFAULT 1,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS complaint_chats (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER NOT NULL DEFAULT 1,
              question TEXT NOT NULL,
              answer TEXT NOT NULL,
              reference_docs TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS news_articles (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              title TEXT NOT NULL,
              source TEXT,
              published_at TEXT,
              url TEXT NOT NULL,
              summary TEXT,
              keywords TEXT,
              collected_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              user_id INTEGER,
              action TEXT NOT NULL,
              resource_type TEXT NOT NULL,
              resource_id TEXT,
              created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );

            CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_url
            ON news_articles(url);
            """
        )
        ensure_column(connection, "schedules", "member_id", "INTEGER")
        ensure_column(connection, "schedules", "memo", "TEXT")
        ensure_column(connection, "schedules", "updated_at", "TEXT")
        connection.execute("UPDATE schedules SET updated_at = COALESCE(updated_at, created_at, CURRENT_TIMESTAMP)")
        seed_team_members(connection)
        seed_schedules(connection)


@contextmanager
def get_connection() -> Iterator[sqlite3.Connection]:
    connection = sqlite3.connect(settings.database_path)
    connection.row_factory = sqlite3.Row
    try:
        yield connection
        connection.commit()
    finally:
        connection.close()


def ensure_column(connection: sqlite3.Connection, table_name: str, column_name: str, column_type: str) -> None:
    columns = connection.execute(f"PRAGMA table_info({table_name})").fetchall()
    if any(column["name"] == column_name for column in columns):
        return
    connection.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_type}")


def ping_db() -> str:
    with get_connection() as connection:
        connection.execute("SELECT 1").fetchone()
    return "ok"


def seed_team_members(connection: sqlite3.Connection) -> None:
    row = connection.execute("SELECT COUNT(*) AS count FROM team_members").fetchone()
    if row["count"] > 0:
        return

    connection.execute(
        """
        INSERT INTO team_members (name, department, position, email)
        VALUES (?, ?, ?, ?)
        """,
        ("Hong Gil-dong", "Operations", "Manager", "hong@example.go.kr"),
    )


def seed_schedules(connection: sqlite3.Connection) -> None:
    row = connection.execute("SELECT COUNT(*) AS count FROM schedules").fetchone()
    if row["count"] > 0:
        connection.execute(
            """
            UPDATE schedules
            SET member_id = COALESCE(member_id, (SELECT id FROM team_members ORDER BY id LIMIT 1))
            WHERE member_id IS NULL
            """
        )
        return

    member = connection.execute("SELECT id FROM team_members ORDER BY id LIMIT 1").fetchone()
    member_id = member["id"] if member else None
    connection.execute(
        """
        INSERT INTO schedules (member_id, type, title, starts_at, ends_at, location, memo, visibility, approval_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            member_id,
            "work",
            "MVP scaffold review",
            "2026-07-01T09:00:00",
            "2026-07-01T10:00:00",
            "Operations room",
            "Initial sample schedule",
            "team",
            "approved",
        ),
    )
