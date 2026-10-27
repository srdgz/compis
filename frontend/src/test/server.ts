import { setupServer } from "msw/node";

export const API = "http://localhost/api";

export const server = setupServer();
