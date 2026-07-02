import asyncio
from datetime import datetime, timedelta, timezone

from app.modules.news.service import collect_policy_news_for_date

KST = timezone(timedelta(hours=9), name="KST")


async def run_daily_news_collector() -> None:
    while True:
        now = datetime.now(KST)
        next_run = now.replace(hour=9, minute=0, second=0, microsecond=0)
        if next_run <= now:
            next_run += timedelta(days=1)

        await asyncio.sleep((next_run - now).total_seconds())
        target_date = datetime.now(KST).date() - timedelta(days=1)
        try:
            await asyncio.to_thread(collect_policy_news_for_date, target_date)
        except Exception:
            # Keep the scheduler alive; API-triggered collection surfaces errors to callers.
            continue
