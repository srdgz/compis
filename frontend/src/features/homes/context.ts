import { useOutletContext } from "react-router-dom";

import type { Roomie } from "@/features/roomies/api";

export interface HomeContext {
  roomie: Roomie;
  homeId: number;
}

export function useHomeContext(): HomeContext {
  return useOutletContext<HomeContext>();
}
