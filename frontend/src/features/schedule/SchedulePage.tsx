import { useEffect, useState } from "react";
import { apiGet } from "../../shared/api/client";
import { PlaceholderPanel } from "../../shared/components/PlaceholderPanel";

type Schedule = {
  id: number;
  title: string;
  type: string;
  approval_status: string;
};

export function SchedulePage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  useEffect(() => {
    apiGet<Schedule[]>("/api/schedules").then(setSchedules).catch(() => setSchedules([]));
  }, []);

  return (
    <PlaceholderPanel
      title="팀 일정 관리"
      items={[
        `샘플 일정 ${schedules.length}건 조회`,
        "월간/주간/일간 캘린더 영역",
        "일정 등록/수정/삭제 폼",
        "승인 상태 필터",
      ]}
    />
  );
}
