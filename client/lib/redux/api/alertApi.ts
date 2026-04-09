import { baseQuery } from "./baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface Alert {
  id: number;
  streetlight_id: number;
  type: string;
  severity: string;
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export const alertApi = createApi({
  reducerPath: "alertApi",
  baseQuery: baseQuery,
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
  }),
});

export const {
  useGetAlertsQuery,
  useGetAlertByIdQuery,
} = alertApi;
