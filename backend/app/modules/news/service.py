from __future__ import annotations

import re
import urllib.parse
import urllib.request
from dataclasses import dataclass
from datetime import date

from bs4 import BeautifulSoup

from app.db.connection import get_connection

BASE_URL = "https://www.korea.kr"
LIST_URL = f"{BASE_URL}/news/policyNewsList.do"
KEYWORDS = "?筌먦끉???怨룸츩"
MAX_PAGES = 50
DIRECT_OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


@dataclass
class NewsArticle:
    title: str
    source: str | None
    published_at: str | None
    url: str
    summary: str | None
    keywords: str = KEYWORDS


@dataclass
class CollectResult:
    target_date: str
    inserted: int
    updated: int
    skipped: int
    total: int


def collect_policy_news_for_date(target_date: date) -> CollectResult:
    target_date_text = target_date.isoformat()
    articles: list[NewsArticle] = []

    for page_index in range(1, MAX_PAGES + 1):
        html = fetch_policy_news_list(target_date_text, page_index)
        page_articles = parse_policy_news_list(html)
        articles.extend(page_articles)

        if not has_next_page(html, page_index) or not page_articles:
            break

    inserted, updated, skipped = save_articles(articles)
    return CollectResult(
        target_date=target_date_text,
        inserted=inserted,
        updated=updated,
        skipped=skipped,
        total=len(articles),
    )


def fetch_policy_news_list(target_date: str, page_index: int) -> str:
    payload = urllib.parse.urlencode(
        {
            "pageIndex": str(page_index),
            "startDate": target_date,
            "endDate": target_date,
            "srchWord": "",
            "repCodeType": "",
            "repCode": "",
            "cateId": "",
            "formPeriod": "direct",
        }
    ).encode("utf-8")
    request = urllib.request.Request(
        LIST_URL,
        data=payload,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": "Mozilla/5.0 (compatible; day3-rpa-news-collector/0.1)",
        },
        method="POST",
    )
    with DIRECT_OPENER.open(request, timeout=20) as response:
        return response.read().decode("utf-8", errors="replace")


def parse_policy_news_list(html: str) -> list[NewsArticle]:
    soup = BeautifulSoup(html, "html.parser")
    articles: list[NewsArticle] = []
    seen_urls: set[str] = set()

    for item in soup.select(".list_type li"):
        link = item.select_one('a[href*="policyNewsView.do"]')
        if link is None:
            continue

        href = link.get("href", "")
        url = normalize_article_url(href)
        if not url or url in seen_urls:
            continue

        title = clean_text(link.select_one("strong"))
        if not title:
            continue

        summary = clean_text(link.select_one(".lead")) or None
        published_at, source = parse_source_fields(item)
        articles.append(
            NewsArticle(
                title=title,
                source=source,
                published_at=published_at,
                url=url,
                summary=summary,
            )
        )
        seen_urls.add(url)

    return articles


def parse_source_fields(item) -> tuple[str | None, str | None]:
    spans = [clean_text(span) for span in item.select(".source span")]
    values = [value for value in spans if value]
    published_at = None
    source = None

    for value in values:
        normalized_date = normalize_date(value)
        if normalized_date:
            published_at = normalized_date
        elif source is None:
            source = value

    return published_at, source


def normalize_article_url(href: str) -> str | None:
    if not href:
        return None
    absolute_url = urllib.parse.urljoin(BASE_URL, href)
    parsed = urllib.parse.urlparse(absolute_url)
    query = urllib.parse.parse_qs(parsed.query)
    news_id = query.get("newsId", [None])[0]
    if not news_id:
        return None
    return f"{BASE_URL}/news/policyNewsView.do?newsId={news_id}"


def normalize_date(value: str) -> str | None:
    match = re.search(r"(\d{4})[.-](\d{2})[.-](\d{2})", value)
    if match is None:
        return None
    return "-".join(match.groups())


def clean_text(node) -> str:
    if node is None:
        return ""
    return " ".join(node.get_text(" ", strip=True).split())


def has_next_page(html: str, page_index: int) -> bool:
    soup = BeautifulSoup(html, "html.parser")
    next_page = page_index + 1
    return soup.find("a", onclick=re.compile(rf"pageLink\({next_page}\)")) is not None


def save_articles(articles: list[NewsArticle]) -> tuple[int, int, int]:
    inserted = 0
    updated = 0
    skipped = 0

    with get_connection() as connection:
        for article in articles:
            existing = connection.execute(
                """
                SELECT title, source, published_at, summary, keywords
                FROM news_articles
                WHERE url = ?
                """,
                (article.url,),
            ).fetchone()

            if existing is None:
                connection.execute(
                    """
                    INSERT INTO news_articles (title, source, published_at, url, summary, keywords)
                    VALUES (?, ?, ?, ?, ?, ?)
                    """,
                    (
                        article.title,
                        article.source,
                        article.published_at,
                        article.url,
                        article.summary,
                        article.keywords,
                    ),
                )
                inserted += 1
                continue

            changed = any(
                existing[field] != getattr(article, field)
                for field in ["title", "source", "published_at", "summary", "keywords"]
            )
            if not changed:
                skipped += 1
                continue

            connection.execute(
                """
                UPDATE news_articles
                SET title = ?, source = ?, published_at = ?, summary = ?, keywords = ?, collected_at = CURRENT_TIMESTAMP
                WHERE url = ?
                """,
                (
                    article.title,
                    article.source,
                    article.published_at,
                    article.summary,
                    article.keywords,
                    article.url,
                ),
            )
            updated += 1

    return inserted, updated, skipped
