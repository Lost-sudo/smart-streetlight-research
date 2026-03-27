"use client";

import { Provider } from "react-redux";
import { store } from "@/lib/redux/store";
import { useEffect } from "react";
import { hydrate } from "@/lib/redux/slices/authSlice";

export default function StoreProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    store.dispatch(hydrate());
  }, []);

  return <Provider store={store}>{children}</Provider>;
}
