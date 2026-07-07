import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import "@/index.css";
import App from "@/App";
import { AuthProvider } from "@/lib/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false },
  },
});

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
        <Toaster position="top-center" theme="dark" richColors />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>,
);
