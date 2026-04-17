import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice";
import { authApi } from "./api/authApi";
import { userApi } from "./api/userApi";
import { streetlightApi } from "./api/streetlightApi";
import { predictiveMaintenanceApi } from "./api/predictiveMaintenanceApi";
import { repairTaskApi } from "./api/repairTaskApi";
import { alertApi } from "./api/alertApi";
import { predictiveAlertApi } from "./api/predictiveAlertApi";
import { repairLogApi } from "./api/repairLogApi";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    [authApi.reducerPath]: authApi.reducer,
    [userApi.reducerPath]: userApi.reducer,
    [streetlightApi.reducerPath]: streetlightApi.reducer,
    [predictiveMaintenanceApi.reducerPath]: predictiveMaintenanceApi.reducer,
    [repairTaskApi.reducerPath]: repairTaskApi.reducer,
    [alertApi.reducerPath]: alertApi.reducer,
    [predictiveAlertApi.reducerPath]: predictiveAlertApi.reducer,
    [repairLogApi.reducerPath]: repairLogApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware, 
      userApi.middleware, 
      streetlightApi.middleware,
      predictiveMaintenanceApi.middleware,
      repairTaskApi.middleware,
      alertApi.middleware,
      predictiveAlertApi.middleware,
      repairLogApi.middleware
    ),
});


export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
