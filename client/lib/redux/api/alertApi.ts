import { baseQueryWithReauth } from "./baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface Alert {
  id: number;
  streetlight_id: number;
  alert_type: "FAULT" | "PREDICTIVE";
  type: string;
  severity: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export const alertApi = createApi({
  reducerPath: "alertApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["Alert"],
  endpoints: (builder) => ({
    getAlerts: builder.query<Alert[], void>({
      query: () => "/alert/",
      providesTags: ["Alert"],
    }),
    getAlertById: builder.query<Alert, number>({
      query: (id) => `/alert/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Alert", id }],
    }),
    getFaultAlerts: builder.query<Alert[], void>({
      query: () => "/alert/?alert_type=FAULT",
      providesTags: ["Alert"],
    }),
    getPredictiveAlerts: builder.query<Alert[], void>({
      query: () => "/alert/?alert_type=PREDICTIVE",
      providesTags: ["Alert"],
    }),
    createAlert: builder.mutation<Alert, Partial<Alert>>({
      query: (alert) => ({
        url: "/alert/",
        method: "POST",
        body: alert,
      }),
      invalidatesTags: ["Alert"],
    }),
    resolveAlert: builder.mutation<Alert, { alertId: number; is_resolved: boolean }>({
      query: ({ alertId, is_resolved }) => ({
        url: `/alert/${alertId}`,
        method: "PATCH",
        body: { is_resolved },
      }),
      invalidatesTags: ["Alert"],
    }),
  }),
});

export const {
  useGetAlertsQuery,
  useGetAlertByIdQuery,
  useGetFaultAlertsQuery,
  useGetPredictiveAlertsQuery,
  useCreateAlertMutation,
  useResolveAlertMutation,
} = alertApi;
