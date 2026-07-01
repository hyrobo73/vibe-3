import { PlaceholderPanel } from "../../shared/components/PlaceholderPanel";

export function NewsPage() {
  return (
    <PlaceholderPanel
      title="뉴스 기사 수집"
      items={["날짜/키워드 필터", "수집 기사 목록", "요약 및 URL", "수동 수집 실행"]}
    />
  );
}
