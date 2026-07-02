import { useEffect, useMemo, useState } from "react";
import { routes } from "./routes";
import { apiGet } from "../shared/api/client";
import type { HealthStatus, SystemStatus } from "../shared/types/api";

type RouteId = (typeof routes)[number]["id"];

function getRouteIdFromHash(): RouteId {
  const hash = window.location.hash.replace("#", "");
  return routes.some((route) => route.id === hash) ? (hash as RouteId) : routes[0].id;
}

export function App() {
  const [activeRouteId, setActiveRouteId] = useState<RouteId>(() => getRouteIdFromHash());
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const activeRoute = useMemo(
    () => routes.find((route) => route.id === activeRouteId) ?? routes[0],
    [activeRouteId],
  );
  const ActivePage = activeRoute.component;

  useEffect(() => {
    function handleHashChange() {
      setActiveRouteId(getRouteIdFromHash());
    }

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

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
        setError(fetchError instanceof Error ? fetchError.message : "API 연결 실패");
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
            <a
              aria-current={activeRouteId === route.id ? "page" : undefined}
              className={activeRouteId === route.id ? "active" : undefined}
              href={`#${route.id}`}
              key={route.id}
            >
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
          <StatusCard label="API" value={`${system?.features.length ?? 0} modules`} detail="MVP 기능 모듈" />
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