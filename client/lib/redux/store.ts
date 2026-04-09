import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { authApi } from "./api/authApi";
import { userApi } from "./api/userApi";
import { streetlightApi } from "./api/streetlightApi";
import { predictiveMaintenanceApi } from "./api/predictiveMaintenanceApi";
import { repairTaskApi } from "./api/repairTaskApi";
import { alertApi } from "./api/alertApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [streetlightApi.reducerPath]: streetlightApi.reducer,
    [predictiveMaintenanceApi.reducerPath]: predictiveMaintenanceApi.reducer,
    [repairTaskApi.reducerPath]: repairTaskApi.reducer,
    [alertApi.reducerPath]: alertApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware, 
      userApi.middleware, 
      streetlightApi.middleware,
      predictiveMaintenanceApi.middleware,
      repairTaskApi.middleware,
      alertApi.middleware
    ),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
