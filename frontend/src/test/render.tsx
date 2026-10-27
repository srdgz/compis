import { QueryClient } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import { Providers } from "@/app/App";
import { AppRoutes } from "@/app/routes";
import { saveSession } from "@/shared/api/session";

export function renderApp(route = "/", signedIn = false) {
  if (signedIn) saveSession({ token: "test-token", roomieId: 1 });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <Providers client={client}>
      <MemoryRouter initialEntries={[route]}>
        <AppRoutes />
      </MemoryRouter>
    </Providers>,
  );
}

export const roomie = {
  id: 1,
  email: "lucia@example.com",
  first_name: "Lucía",
  last_name: null,
  avatar: null,
  paypal_username: null,
  admin: true,
  is_active: true,
  home_id: 7,
};
