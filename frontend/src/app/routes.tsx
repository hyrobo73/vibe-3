import { ComplaintChatbotPage } from "../features/complaint-chatbot/ComplaintChatbotPage";
import { ExcelAutomationPage } from "../features/excel-automation/ExcelAutomationPage";
import { NewsPage } from "../features/news/NewsPage";
import { SchedulePage } from "../features/schedule/SchedulePage";

export const routes = [
  {
    id: "schedule",
    label: "일정 관리",
    description: "팀원 등록과 주간/월간 일정을 관리합니다.",
    component: SchedulePage,
  },
  {
    id: "excel",
    label: "엑셀 자동화",
    description: "분리, 병합 작업을 업로드하고 처리 결과를 다운로드합니다.",
    component: ExcelAutomationPage,
  },
  {
    id: "complaints",
    label: "민원 챗봇",
    description: "매뉴얼 기반 답변 초안 생성을 준비합니다.",
    component: ComplaintChatbotPage,
  },
  {
    id: "news",
    label: "정책 뉴스",
    description: "정책 뉴스 수집 결과를 확인합니다.",
    component: NewsPage,
  },
] as const;