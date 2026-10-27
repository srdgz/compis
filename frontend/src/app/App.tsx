import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "@/features/auth/AuthProvider";
import { ApiError } from "@/shared/api/http";
import { ToastProvider } from "@/shared/ui/Toast";

import { AppRoutes } from "./routes";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        retry: (count, error) => !(error instanceof ApiError) && count < 2,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export function Providers({
  children,
  client: provided,
}: {
  children: React.ReactNode;
  client?: QueryClient;
}) {
  const [client] = useState(() => provided ?? createQueryClient());
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>
        <ToastProvider>{children}</ToastProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export function App() {
  return (
    <Providers>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Providers>
  );
}
