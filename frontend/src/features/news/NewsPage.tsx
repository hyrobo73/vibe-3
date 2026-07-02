import { FormEvent, useEffect, useState } from "react";
import { apiGet, apiPost } from "../../shared/api/client";
import type { NewsArticle, NewsCollectResult } from "../../shared/types/api";

export function NewsPage() {
  const [targetDate, setTargetDate] = useState(() => toDateInputValue(new Date()));
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void loadArticles(targetDate);
  }, [targetDate]);

  async function loadArticles(date: string) {
    try {
      const params = new URLSearchParams({ start_date: date, end_date: date });
      const result = await apiGet<NewsArticle[]>(`/api/news?${params.toString()}`);
      setArticles(result);
      setError("");
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "뉴스 목록을 불러오지 못했습니다.");
    }
  }

  async function handleCollect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const result = await apiPost<NewsCollectResult>("/api/news/collect", { target_date: targetDate });
      setMessage(`${result.target_date} 수집 완료: 신규 ${result.inserted}건, 갱신 ${result.updated}건, 중복 ${result.skipped}건`);
      await loadArticles(targetDate);
    } catch (collectError) {
      setError(collectError instanceof Error ? collectError.message : "뉴스 수집에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="news-page">
      <div className="page-heading">
        <div>
          <p className="eyebrow dark">Policy Briefing</p>
          <h2>정책뉴스 수집</h2>
        </div>
      </div>

      <form className="panel news-collect-form" onSubmit={handleCollect}>
        <label>
          수집 날짜
          <input type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "수집 중" : "수동 수집"}
        </button>
      </form>

      {(message || error) && <div className={error ? "notice error" : "notice"}>{error || message}</div>}

      <div className="panel news-list-panel">
        <div className="panel-title-row">
          <h3>수집 기사</h3>
          <span>{articles.length}건</span>
        </div>
        <div className="table-scroll">
          <table className="schedule-table">
            <thead>
              <tr>
                <th>발행일</th>
                <th>부처</th>
                <th>제목</th>
                <th>요약</th>
                <th>원문</th>
              </tr>
            </thead>
            <tbody>
              {articles.map((article) => (
                <tr key={article.id}>
                  <td>{article.published_at ?? "-"}</td>
                  <td>{article.source ?? "-"}</td>
                  <td>{article.title}</td>
                  <td>{article.summary ?? "-"}</td>
                  <td>
                    <a className="text-link" href={article.url} target="_blank" rel="noreferrer">
                      열기
                    </a>
                  </td>
                </tr>
              ))}
              {articles.length === 0 && (
                <tr>
                  <td colSpan={5} className="empty-cell">
                    선택한 날짜에 저장된 기사가 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function toDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
