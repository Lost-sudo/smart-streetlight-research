import { createApi, BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query/react";
import { AuthResponse, User, LoginInput, UserCreate } from "@/types/auth";
import { setCredentials, logOut } from "../slices/authSlice";
import { RootState } from "../store";
import { baseQuery } from "./baseQuery";

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  const isLogoutRequest = typeof args === 'object' && 'url' in args && args.url === '/auth/logout';

  if (result.error && result.error.status === 401 && !isLogoutRequest) {
    const refreshResult = await baseQuery(
      { url: "/auth/refresh", method: "POST" },
      api,
      extraOptions
    );

    if (refreshResult.data) {
      const { access_token } = refreshResult.data as { access_token: string };
      const user = (api.getState() as RootState).auth.user;
      
      if (user) {
        api.dispatch(setCredentials({
          user,
          accessToken: access_token,
        }));
      }

      result = await baseQuery(args, api, extraOptions);
    } else {
      api.dispatch(logOut());
    }
  }
  return result;
};

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithReauth,
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginInput>({
      query: (credentials) => {
        // Use standard JSON body for mobile if possible, 
        // but keeping it the same as web if they expect Form Data.
        // Web used URLSearchParams.
        const body = new URLSearchParams();
        body.append("username", credentials.username);
        body.append("password", credentials.password);
        return {
          url: "/auth/login",
          method: "POST",
          body: body.toString(), // URLSearchParams.toString() works in RN
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
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
