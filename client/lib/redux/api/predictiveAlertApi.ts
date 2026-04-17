import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "@/lib/redux/api/baseQuery";

export interface PredictiveAlert {
  id: number;
  streetlight_id: number;
  urgency: "low" | "medium" | "high";
  message: string;
  is_resolved: boolean;
  created_at: string;
}

export const predictiveAlertApi = createApi({
  reducerPath: "predictiveAlertApi",
  baseQuery: baseQuery,
  tagTypes: ["PredictiveAlert"],
  endpoints: (builder) => ({
    getPredictiveAlerts: builder.query<PredictiveAlert[], void>({
      query: () => "/predictive-alert/",
      providesTags: ["PredictiveAlert"],
    }),
    getPredictiveAlertById: builder.query<PredictiveAlert, number>({
      query: (id) => `/predictive-alert/${id}`,
      providesTags: (result, error, id) => [{ type: "PredictiveAlert", id }],
    }),
    resolvePredictiveAlert: builder.mutation<PredictiveAlert, number>({
      query: (id) => ({
        url: `/predictive-alert/${id}/resolve`,
        method: "PATCH",
      }),
      invalidatesTags: ["PredictiveAlert"],
    }),
  }),
});

export const {
  useGetPredictiveAlertsQuery,
  useGetPredictiveAlertByIdQuery,
  useResolvePredictiveAlertMutation,
} = predictiveAlertApi;
