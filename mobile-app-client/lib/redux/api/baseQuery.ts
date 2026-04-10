import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";

export const baseQuery = fetchBaseQuery({
  baseUrl: process.env.EXPO_PUBLIC_API_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});
