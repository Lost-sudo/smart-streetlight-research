import { baseQuery } from "./baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface RepairTask {
  id: number;
  alert_id: number;
  technician_id: number | null;
  assigned_by_user_id: number | null;
  assigned_by_type: string | null;
  status: string;
  source_type: "FAULT" | "PREDICTIVE";
  priority: "critical" | "high" | "medium" | "low";
  description: string | null;
  created_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  scheduled_at: string | null;
  version: number;
}

export interface Technician {
  id: number;
  username: string;
  availability: string | null;
}

export interface ScheduleTaskPayload {
  alert_id: number;
  description?: string;
  priority?: "critical" | "high" | "medium" | "low";
  scheduled_at?: string;
}

export const repairTaskApi = createApi({
  reducerPath: "repairTaskApi",
  baseQuery: baseQuery,
  tagTypes: ["RepairTask", "Technician"],
  endpoints: (builder) => ({
    getUnassignedTasks: builder.query<RepairTask[], void>({
      query: () => "/repair-tasks/unassigned",
      providesTags: ["RepairTask"],
    }),
    getActiveTasks: builder.query<RepairTask[], void>({
      query: () => "/repair-tasks/active",
      providesTags: ["RepairTask"],
    }),
    getAllRepairTasks: builder.query<RepairTask[], void>({
      query: () => "/repair-tasks/",
      providesTags: ["RepairTask"],
    }),
    getTasksBySourceType: builder.query<RepairTask[], string>({
      query: (sourceType) => `/repair-tasks/by-type/${sourceType}`,
      providesTags: ["RepairTask"],
    }),
    getMyTasks: builder.query<RepairTask[], void>({
      query: () => "/repair-tasks/my-tasks",
      providesTags: ["RepairTask"],
    }),
    getAvailableTechnicians: builder.query<Technician[], void>({
      query: () => "/repair-tasks/technicians/available",
      providesTags: ["Technician"],
    }),
    getResolvedTodayCount: builder.query<number, void>({
      query: () => "/repair-tasks/stats/resolved-today",
      providesTags: ["RepairTask"],
    }),
    assignTask: builder.mutation<RepairTask, { taskId: number; technicianId: number }>({
      query: ({ taskId, technicianId }) => ({
        url: `/repair-tasks/${taskId}/assign`,
        method: "POST",
        body: { technician_id: technicianId },
      }),
      invalidatesTags: ["RepairTask", "Technician"],
    }),
    claimTask: builder.mutation<RepairTask, number>({
      query: (taskId) => ({
        url: `/repair-tasks/${taskId}/claim`,
        method: "POST",
      }),
      invalidatesTags: ["RepairTask", "Technician"],
    }),
    updateTaskStatus: builder.mutation<RepairTask, { taskId: number; status: string; description?: string }>({
      query: ({ taskId, status, description }) => ({
        url: `/repair-tasks/${taskId}/status`,
        method: "PATCH",
        body: { status, description },
      }),
      invalidatesTags: ["RepairTask", "Technician"],
    }),
    scheduleTask: builder.mutation<RepairTask, ScheduleTaskPayload>({
      query: (payload) => ({
        url: "/repair-tasks/schedule",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: ["RepairTask"],
    }),
  }),
});

export const {
  useGetUnassignedTasksQuery,
  useGetActiveTasksQuery,
  useGetAllRepairTasksQuery,
  useGetTasksBySourceTypeQuery,
  useGetMyTasksQuery,
  useGetAvailableTechniciansQuery,
  useGetResolvedTodayCountQuery,
  useAssignTaskMutation,
  useClaimTaskMutation,
  useUpdateTaskStatusMutation,
  useScheduleTaskMutation,
} = repairTaskApi;
