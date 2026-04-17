import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface PredictiveMaintenanceLog {
  id: number;
  streetlight_id: number;
  failure_probability: number;
  predicted_failure_date: string;
  urgency_level: "low" | "medium" | "high" | "critical";
  last_updated: string;
}

export const predictiveMaintenanceApi = createApi({
  reducerPath: "predictiveMaintenanceApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["PredictiveMaintenance"],
  endpoints: (builder) => ({
    getPredictiveMaintenanceLogs: builder.query<PredictiveMaintenanceLog[], void>({
      query: () => "/predictive-maintenance/",
      providesTags: ["PredictiveMaintenance"],
    }),
    analyzeAllLogs: builder.mutation<{status: string, message: string}, void>({
      query: () => ({
        url: "/predictive-maintenance/analyze-all",
        method: "POST",
      }),
      invalidatesTags: ["PredictiveMaintenance"],
    }),
  }),
});

export const { useGetPredictiveMaintenanceLogsQuery, useAnalyzeAllLogsMutation } = predictiveMaintenanceApi;
