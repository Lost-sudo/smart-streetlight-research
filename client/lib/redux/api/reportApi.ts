import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface EnergyData {
  month: string;
  consumption: number;
}

export interface FaultFrequency {
  name: string;
  value: number;
}

export interface SystemMetrics {
  energy_consumption: string;
  energy_savings: string;
  uptime_percentage: string;
  uptime_status: string;
  mttr: string;
  mttr_target: string;
  reporting_period: string;
  reporting_filter: string;
}

export interface MaintenancePerformance {
  response_time_compliance: number;
  pm_completion: number;
  status: string;
}

export interface ReportResponse {
  energy_data: EnergyData[];
  fault_frequency_data: FaultFrequency[];
  metrics: SystemMetrics;
  maintenance_performance: MaintenancePerformance;
}

export const reportApi = createApi({
  reducerPath: "reportApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Report"],
  endpoints: (builder) => ({
    getSystemMetrics: builder.query<ReportResponse, { month?: number; year?: number } | void>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params) {
          if (params.month) queryParams.append("month", params.month.toString());
          if (params.year) queryParams.append("year", params.year.toString());
        }
        const queryString = queryParams.toString();
        return `/reports/system-metrics${queryString ? `?${queryString}` : ""}`;
      },
      providesTags: ["Report"],
    }),
  }),
});

export const { useGetSystemMetricsQuery } = reportApi;
