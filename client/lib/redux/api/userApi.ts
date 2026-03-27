import { createApi } from "@reduxjs/toolkit/query/react";
import { User, UserCreate } from "@/types/auth";
import { baseQuery } from "./baseQuery";


// Note: UserUpdate can be partially defined or inferred
export type UserUpdate = Partial<UserCreate> & { is_active?: boolean };

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: baseQuery,
  tagTypes: ["User"],
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/user/",
      providesTags: ["User"],
    }),
    getUserByUsername: builder.query<User, string>({
      query: (username) => `/user/username/${username}`,
      providesTags: (result, error, arg) => [{ type: "User", id: arg }],
    }),
    createUser: builder.mutation<User, UserCreate>({
      query: (newUser) => ({
        url: "/user/",
        method: "POST",
        body: newUser,
      }),
      invalidatesTags: ["User"],
    }),
    updateUser: builder.mutation<User, { id: number; data: UserUpdate }>({
      query: ({ id, data }) => ({
        url: `/user/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["User"],
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({
        url: `/user/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByUsernameQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
