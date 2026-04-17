import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQuery";

export interface MaintenanceLog {
  id: number;
  streetlight_id: number;
  technician_id: number;
  description: string;
  parts_replaced: string;
  scheduled_date: string;
  completion_date: string | null;
  status: string;
}

export const maintenanceLogApi = createApi({
  reducerPath: "maintenanceLogApi",
  baseQuery: baseQueryWithReauth,
  tagTypes: ["MaintenanceLog"],
  endpoints: (builder) => ({
    getAllMaintenanceLogs: builder.query<MaintenanceLog[], void>({
      query: () => "/maintenance/",
      providesTags: ["MaintenanceLog"],
    }),
  }),
});

export const { useGetAllMaintenanceLogsQuery } = maintenanceLogApi;
