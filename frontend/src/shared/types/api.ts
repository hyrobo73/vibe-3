export type HealthStatus = {
  status: string;
  service: string;
};

export type SystemStatus = {
  api: {
    status: string;
  };
  database: {
    status: string;
    path: string;
  };
  features: string[];
};

export type TeamMember = {
  id: number;
  name: string;
  department: string;
  position: string | null;
  email: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Schedule = {
  id: number;
  user_id: number;
  member_id: number | null;
  member_name: string | null;
  member_department: string | null;
  member_active: boolean | null;
  type: string;
  title: string;
  starts_at: string;
  ends_at: string;
  location: string | null;
  memo: string | null;
  visibility: string;
  approval_status: string;
  created_at: string;
  updated_at: string;
};
export type NewsArticle = {
  id: number;
  title: string;
  source: string | null;
  published_at: string | null;
  url: string;
  summary: string | null;
  keywords: string | null;
  collected_at: string;
};

export type NewsCollectResult = {
  target_date: string;
  inserted: number;
  updated: number;
  skipped: number;
  total: number;
};
export type ExcelColumnsResponse = {
  filename: string;
  columns: string[];
};

export type ExcelJob = {
  id: number;
  job_type: "split" | "merge";
  status: "processing" | "done" | "failed";
  error_message: string | null;
  created_at: string;
  download_url: string | null;
};
