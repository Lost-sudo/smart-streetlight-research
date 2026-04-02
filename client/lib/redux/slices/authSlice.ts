import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "@/types/auth";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading true for hydration
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: User; accessToken: string }>
    ) => {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      state.isAuthenticated = true;
      state.isLoading = false;
      
      // Persist to localStorage
      if (typeof window !== "undefined") {
        localStorage.setItem("smartlight_auth", JSON.stringify({ user, accessToken }));
      }
    },
    logOut: (state) => {
      state.user = null;
      state.accessToken = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      
      if (typeof window !== "undefined") {
        localStorage.removeItem("smartlight_auth");
      }
    },
    hydrate: (state) => {
      if (typeof window !== "undefined") {
        const savedAuth = localStorage.getItem("smartlight_auth");
        if (savedAuth) {
          try {
            const { user, accessToken } = JSON.parse(savedAuth);
            state.user = user;
            state.accessToken = accessToken;
            state.isAuthenticated = true;
          } catch (e) {
            console.error("Failed to hydrate auth state", e);
            localStorage.removeItem("smartlight_auth");
          }
        }
      }
      state.isLoading = false;
    },
  },
});

export const { setCredentials, logOut, hydrate } = authSlice.actions;

export default authSlice.reducer;

export const selectCurrentUser = (state: { auth: AuthState }) => state.auth.user;
export const selectIsAuthenticated = (state: { auth: AuthState }) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: { auth: AuthState }) => state.auth.isLoading;
