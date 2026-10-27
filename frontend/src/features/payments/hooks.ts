import { useQuery } from "@tanstack/react-query";

import { paymentsApi } from "./api";

export function usePaypalDemoConfig() {
  return useQuery({
    queryKey: ["config"],
    queryFn: paymentsApi.config,
    staleTime: Infinity,
    select: (config) => config.paypal_demo,
  });
}
