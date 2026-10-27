import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/features/auth/AuthProvider";
import type { HomeContext } from "@/features/homes/context";
import { OnboardingPage } from "@/features/homes/OnboardingPage";
import { useCurrentRoomie } from "@/features/roomies/hooks";
import { errorMessage } from "@/shared/api/http";
import { ErrorNotice, Loading } from "@/shared/ui/Feedback";

export function RequireAuth() {
  const { session } = useAuth();
  const location = useLocation();
  if (!session) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function HomeGate() {
  const { data: roomie, isPending, error } = useCurrentRoomie();
  if (isPending) return <Loading />;
  if (error || !roomie) return <ErrorNotice message={errorMessage(error)} />;
  if (roomie.home_id === null) return <OnboardingPage roomie={roomie} />;
  return <Outlet context={{ roomie, homeId: roomie.home_id } satisfies HomeContext} />;
}
