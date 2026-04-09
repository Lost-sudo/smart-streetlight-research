import { baseQuery } from "./baseQuery";
import { createApi } from "@reduxjs/toolkit/query/react";

export interface RepairTask {
  id: number;
  alert_id: number;
  technician_id: number | null;
  assigned_by_user_id: number | null;
  assigned_by_type: string | null;
  status: string;
  description: string | null;
  created_at: string;
  assigned_at: string | null;
  completed_at: string | null;
  version: number;
}

export interface Technician {
  id: number;
  username: string;
  availability: string | null;
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
    getAvailableTechnicians: builder.query<Technician[], void>({
      query: () => "/repair-tasks/technicians/available",
      providesTags: ["Technician"],
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
    updateTaskStatus: builder.mutation<RepairTask, { taskId: number; status: string }>({
      query: ({ taskId, status }) => ({
        url: `/repair-tasks/${taskId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["RepairTask", "Technician"],
    }),
  }),
});

export const {
  useGetUnassignedTasksQuery,
  useGetActiveTasksQuery,
  useGetAvailableTechniciansQuery,
  useAssignTaskMutation,
  useClaimTaskMutation,
  useUpdateTaskStatusMutation,
} = repairTaskApi;
