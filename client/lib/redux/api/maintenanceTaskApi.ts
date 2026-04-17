import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface MaintenanceTask {
  id: number;
  predictive_alert_id: number | null;
  streetlight_id: number;
  technician_id: number | null;
  status: string;
  priority: "critical" | "high" | "medium" | "low";
  description: string | null;
  scheduled_date: string | null;
  assigned_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface MaintenanceTaskAssign {
  technician_id: number;
  scheduled_date?: string;
}

export interface MaintenanceTaskComplete {
  description?: string;
  parts_replaced?: string;
  notes?: string;
}

export interface MaintenanceTaskCreate {
  predictive_alert_id?: number | null;
  streetlight_id: number;
  technician_id?: number | null;
  status?: string;
  priority: "critical" | "high" | "medium" | "low";
  description?: string | null;
  scheduled_date?: string | null;
}


export const maintenanceTaskApi = createApi({
  reducerPath: "maintenanceTaskApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["MaintenanceTask", "Technician", "PredictiveAlert"],
  endpoints: (builder) => ({
    getAllTasks: builder.query<MaintenanceTask[], void>({
      query: () => "/maintenance-tasks/",
      providesTags: ["MaintenanceTask"],
    }),
    getActiveTasks: builder.query<MaintenanceTask[], void>({
      query: () => "/maintenance-tasks/active",
      providesTags: ["MaintenanceTask"],
    }),
    getMyTasks: builder.query<MaintenanceTask[], void>({
      query: () => "/maintenance-tasks/my-tasks",
      providesTags: ["MaintenanceTask"],
    }),
    getTaskById: builder.query<MaintenanceTask, number>({
      query: (taskId) => `/maintenance-tasks/${taskId}`,
      providesTags: (result, error, id) => [{ type: "MaintenanceTask", id }],
    }),
    createTask: builder.mutation<MaintenanceTask, MaintenanceTaskCreate>({
      query: (body) => ({
        url: "/maintenance-tasks/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["MaintenanceTask", "PredictiveAlert"],
    }),
    assignTechnician: builder.mutation<MaintenanceTask, { taskId: number; assignment: MaintenanceTaskAssign }>({
      query: ({ taskId, assignment }) => ({
        url: `/maintenance-tasks/${taskId}/assign`,
        method: "POST",
        body: assignment,
      }),
      invalidatesTags: ["MaintenanceTask", "Technician"],
    }),
    updateStatus: builder.mutation<MaintenanceTask, { taskId: number; status: string }>({
      query: ({ taskId, status }) => ({
        url: `/maintenance-tasks/${taskId}/status?status_update=${status}`,
        method: "PATCH",
      }),
      invalidatesTags: ["MaintenanceTask", "Technician", "PredictiveAlert"],
    }),
    completeWithLog: builder.mutation<MaintenanceTask, { taskId: number; completion: MaintenanceTaskComplete }>({
      query: ({ taskId, completion }) => ({
        url: `/maintenance-tasks/${taskId}/complete`,
        method: "POST",
        body: completion,
      }),
      invalidatesTags: ["MaintenanceTask", "Technician", "PredictiveAlert"],
    }),
    deleteTask: builder.mutation<void, number>({
      query: (taskId) => ({
        url: `/maintenance-tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["MaintenanceTask"],
    }),
  }),
});

export const {
  useGetAllTasksQuery,
  useGetActiveTasksQuery,
  useGetMyTasksQuery,
  useGetTaskByIdQuery,
  useCreateTaskMutation,
  useAssignTechnicianMutation,
  useUpdateStatusMutation,
  useCompleteWithLogMutation,
  useDeleteTaskMutation,
} = maintenanceTaskApi;
