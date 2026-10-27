import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterAll, afterEach, beforeAll } from "vitest";

import { server } from "./server";
import { installMatchMedia, setViewportWidth } from "./viewport";

installMatchMedia();

beforeAll(() => server.listen({ onUnhandledFrame: "error" }));

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  document.documentElement.removeAttribute("data-theme");
  setViewportWidth(1280);
});

afterAll(() => server.close());

HTMLDialogElement.prototype.showModal = function showModal() {
  this.setAttribute("open", "");
};

HTMLDialogElement.prototype.close = function close() {
  this.removeAttribute("open");
  this.dispatchEvent(new Event("close"));
};
