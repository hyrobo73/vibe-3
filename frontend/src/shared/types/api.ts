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
