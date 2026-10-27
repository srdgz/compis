import { Navigate, Route, Routes } from "react-router-dom";

import { ActivityPage } from "@/features/activity/ActivityPage";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { SignupPage } from "@/features/auth/pages/SignupPage";
import { CalendarPage } from "@/features/calendar/CalendarPage";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { ExpensesPage } from "@/features/finance/ExpensesPage";
import { FilesPage } from "@/features/files/FilesPage";
import { ProfilePage } from "@/features/profile/ProfilePage";
import { RoomiesPage } from "@/features/roomies/pages/RoomiesPage";
import { ShoppingPage } from "@/features/shopping/ShoppingPage";
import { TasksPage } from "@/features/tasks/TasksPage";

import { AppShell } from "./AppShell";
import { HomeGate, RequireAuth } from "./guards";
import { NotFoundPage } from "./NotFoundPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route element={<RequireAuth />}>
        <Route element={<AppShell />}>
          <Route path="/profile" element={<ProfilePage />} />
          <Route element={<HomeGate />}>
            <Route index element={<DashboardPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/shopping" element={<ShoppingPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/files" element={<FilesPage />} />
            <Route path="/activity" element={<ActivityPage />} />
            <Route path="/roomies" element={<RoomiesPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
      <Route path="/home" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
