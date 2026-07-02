from datetime import date

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.db.connection import get_connection
from app.modules.news.service import collect_policy_news_for_date

router = APIRouter(prefix="/news", tags=["news"])


class NewsCollectRequest(BaseModel):
    target_date: date


def row_to_article(row) -> dict[str, object]:
    return dict(row)


@router.get("")
def list_news(
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
) -> list[dict[str, object]]:
    filters: list[str] = []
    params: list[object] = []

    if start_date:
        filters.append("date(published_at) >= date(?)")
        params.append(start_date.isoformat())
    if end_date:
        filters.append("date(published_at) <= date(?)")
        params.append(end_date.isoformat())

    query = """
        SELECT id, title, source, published_at, url, summary, keywords, collected_at
        FROM news_articles
    """
    if filters:
        query += " WHERE " + " AND ".join(filters)
    query += " ORDER BY date(published_at) DESC, id DESC"

    with get_connection() as connection:
        rows = connection.execute(query, tuple(params)).fetchall()
    return [row_to_article(row) for row in rows]


@router.post("/collect")
def collect_news(payload: NewsCollectRequest) -> dict[str, object]:
    try:
        result = collect_policy_news_for_date(payload.target_date)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Policy news collection failed: {exc}") from exc
    return result.__dict__
