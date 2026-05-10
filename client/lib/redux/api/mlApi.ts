import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './baseQuery';

export interface MLVersionInfo {
  version: number;
  file_name: string;
  metrics: Record<string, any>;
  created_at: string | null;
}

export interface MLVersionsResponse {
  random_forest: MLVersionInfo;
  lstm: MLVersionInfo;
}

export interface MLStatusResponse {
  is_training: boolean;
  progress: number;
  status_message: string;
  last_run: string | null;
  error: string | null;
}

export interface MLDataStatsResponse {
  total_points: number;
  storage_size: string;
  last_updated: string;
}

export interface MLDatasetVersion {
  id: number;
  version: number;
  file_name: string;
  row_count: number | null;
  created_at: string;
  hf_url: string | null;
}

export const mlApi = createApi({
  reducerPath: 'mlApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['MLVersions', 'MLStatus', 'MLDataStats', 'MLDatasets'],
  endpoints: (builder) => ({
    getMLVersions: builder.query<MLVersionsResponse, void>({
      query: () => '/ml/versions',
      providesTags: ['MLVersions'],
    }),
    getMLStatus: builder.query<MLStatusResponse, void>({
      query: () => '/ml/status',
      providesTags: ['MLStatus'],
    }),
    getMLDataStats: builder.query<MLDataStatsResponse, void>({
      query: () => '/ml/data-stats',
      providesTags: ['MLDataStats'],
    }),
    getMLDatasets: builder.query<MLDatasetVersion[], void>({
      query: () => '/ml/datasets',
      providesTags: ['MLDatasets'],
    }),
    triggerRetraining: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: '/ml/retrain',
        method: 'POST',
      }),
      invalidatesTags: ['MLVersions', 'MLStatus', 'MLDataStats', 'MLDatasets'],
    }),
  }),
});

export const { 
  useGetMLVersionsQuery, 
  useGetMLStatusQuery, 
  useGetMLDataStatsQuery, 
  useGetMLDatasetsQuery,
  useTriggerRetrainingMutation 
} = mlApi;
