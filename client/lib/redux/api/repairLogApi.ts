import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface RepairLog {
  id: number;
  repair_task_id: number;
  streetlight_id: number;
  technician_id: number;
  diagnosis: string | null;
  action_taken: string | null;
  parts_replaced: string | null;
  repair_duration_minutes: number | null;
  notes: string | null;
  created_at: string;
}

export interface RepairLogCreate {
  repair_task_id: number;
  diagnosis?: string;
  action_taken?: string;
  parts_replaced?: string;
  repair_duration_minutes?: number;
  notes?: string;
}

export const repairLogApi = createApi({
  reducerPath: "repairLogApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["RepairLog"],
  endpoints: (builder) => ({
    getAllRepairLogs: builder.query<RepairLog[], void>({
      query: () => "/repair-logs/",
      providesTags: ["RepairLog"],
    }),
    getRepairLogByTaskId: builder.query<RepairLog | null, number>({
      query: (taskId) => `/repair-logs/by-task/${taskId}`,
      providesTags: ["RepairLog"],
    }),
    getMyRepairLogs: builder.query<RepairLog[], void>({
      query: () => "/repair-logs/my-logs",
      providesTags: ["RepairLog"],
    }),
    getRepairLogsByStreetlight: builder.query<RepairLog[], number>({
      query: (streetlightId) => `/repair-logs/by-streetlight/${streetlightId}`,
      providesTags: ["RepairLog"],
    }),
    createRepairLog: builder.mutation<RepairLog, RepairLogCreate>({
      query: (body) => ({
        url: "/repair-logs/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["RepairLog"],
    }),
  }),
});

export const {
  useGetAllRepairLogsQuery,
  useGetRepairLogByTaskIdQuery,
  useGetMyRepairLogsQuery,
  useGetRepairLogsByStreetlightQuery,
  useCreateRepairLogMutation,
} = repairLogApi;
