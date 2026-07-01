import { useEffect, useState } from "react";
import { routes } from "./routes";
import { apiGet } from "../shared/api/client";
import type { HealthStatus, SystemStatus } from "../shared/types/api";

const ActivePage = routes[0].component;

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiGet<HealthStatus>("/api/health"),
      apiGet<SystemStatus>("/api/system/status"),
    ])
      .then(([healthResult, systemResult]) => {
        setHealth(healthResult);
        setSystem(systemResult);
      })
      .catch((fetchError: unknown) => {
        setError(fetchError instanceof Error ? fetchError.message : "API connection failed");
      });
  }, []);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">MVP Scaffold</p>
          <h1>행정업무 자동화 허브</h1>
        </div>
        <nav className="nav-list" aria-label="주요 기능">
          {routes.map((route) => (
            <a href={`#${route.id}`} key={route.id}>
              <strong>{route.label}</strong>
              <span>{route.description}</span>
            </a>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="status-grid" aria-label="연동 상태">
          <StatusCard label="FE-BE" value={health?.status ?? "checking"} detail={health?.service ?? error ?? "API 확인 중"} />
          <StatusCard label="BE-DB" value={system?.database.status ?? "checking"} detail={system?.database.path ?? "SQLite 확인 중"} />
          <StatusCard label="API" value={`${system?.features.length ?? 0} modules`} detail="문서 기준 MVP 모듈" />
        </header>
        <ActivePage />
      </section>
    </main>
  );
}

function StatusCard(props: { label: string; value: string; detail: string }) {
  return (
    <article className="status-card">
      <span>{props.label}</span>
      <strong>{props.value}</strong>
      <p>{props.detail}</p>
    </article>
  );
}
