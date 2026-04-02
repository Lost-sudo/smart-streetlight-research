import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQuery } from "./baseQuery";

export interface Streetlight {
  id: number;
  name: string;
  device_id: string | null;
  latitude: number;
  longitude: number;
  model_info: string;
  installation_date: string;
  status: string;
  is_on: boolean;
  dimming_level: number;
  created_at: string;
}

export interface StreetlightCreate {
  name: string;
  device_id?: string;
  latitude: number;
  longitude: number;
  model_info: string;
  installation_date: string;
  status: string;
  is_on: boolean;
  dimming_level: number;
}

export interface StreetlightLog {
  id: number;
  streetlight_id: number;
  voltage: number;
  current: number;
  power_consumption: number;
  light_intensity: number;
  timestamp: string;
}

export const streetlightApi = createApi({
  reducerPath: "streetlightApi",
  baseQuery: baseQuery,
  tagTypes: ["Streetlight", "StreetlightLog"],
  endpoints: (builder) => ({
    getStreetlights: builder.query<Streetlight[], void>({
      query: () => "/streetlight/",
      providesTags: ["Streetlight"],
    }),
    getStreetlightLogs: builder.query<StreetlightLog[], { id: number; limit?: number }>({
      query: ({ id, limit = 100 }) => `/streetlight_log/by-streetlight/${id}?limit=${limit}`,
      providesTags: (result, error, arg) => [{ type: "StreetlightLog", id: arg.id }],
    }),
    createStreetlight: builder.mutation<Streetlight, StreetlightCreate>({
      query: (streetlight) => ({
        url: "/streetlight/create",
        method: "POST",
        body: streetlight,
      }),
      invalidatesTags: ["Streetlight"],
    }),
  }),
});

export const {
  useGetStreetlightsQuery,
  useGetStreetlightLogsQuery,
  useCreateStreetlightMutation,
} = streetlightApi;
