import { ComplaintChatbotPage } from "../features/complaint-chatbot/ComplaintChatbotPage";
import { ExcelAutomationPage } from "../features/excel-automation/ExcelAutomationPage";
import { NewsPage } from "../features/news/NewsPage";
import { SchedulePage } from "../features/schedule/SchedulePage";

export const routes = [
  {
    id: "schedule",
    label: "일정",
    description: "팀 일정 CRUD와 승인 상태를 다룹니다.",
    component: SchedulePage,
  },
  {
    id: "excel",
    label: "엑셀 자동화",
    description: "분리, 병합 작업의 업로드와 처리 상태를 다룹니다.",
    component: ExcelAutomationPage,
  },
  {
    id: "complaints",
    label: "민원 챗봇",
    description: "매뉴얼 기반 답변 초안 생성을 다룹니다.",
    component: ComplaintChatbotPage,
  },
  {
    id: "news",
    label: "뉴스",
    description: "공공행정 뉴스 수집 결과를 다룹니다.",
    component: NewsPage,
  },
] as const;
