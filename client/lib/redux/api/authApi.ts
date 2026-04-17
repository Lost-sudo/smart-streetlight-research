import { createApi } from "@reduxjs/toolkit/query/react";
import { AuthResponse, User, LoginInput, UserCreate } from "@/types/auth";
import { setCredentials, logOut } from "../slices/authSlice";
import { baseQueryWithReauth } from "./baseQuery";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,

  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginInput>({
      query: (credentials) => {
        const body = new URLSearchParams();
        body.append("username", credentials.username);
        body.append("password", credentials.password);
        return {
          url: "/auth/login",
          method: "POST",
          body: body,
        };
      },

      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
              const { data } = await queryFulfilled;
              dispatch(setCredentials({
                  user: data.user,
                  accessToken: data.access_token,
              }));
          } catch (err) {
              console.error("Login failed", err);
          }
      }
    }),
    register: builder.mutation<User, UserCreate>({
      query: (user) => ({
        url: "/auth/register",
        method: "POST",
        body: user,
      }),
    }),

    logout: builder.mutation<void, void>({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
          try {
              await queryFulfilled;
              dispatch(logOut());
          } catch (err) {
              console.error("Logout failed", err);
              // Clear client state even if backend call fails
              dispatch(logOut());
          }
      }
    }),
    getMe: builder.query<User, void>({
        query: () => "/auth/me",
    })
  }),
});

export const { useLoginMutation, useRegisterMutation, useLogoutMutation, useGetMeQuery } = authApi;
