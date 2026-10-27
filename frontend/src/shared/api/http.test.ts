import { HttpResponse, http } from "msw";
import { z } from "zod";

import { API, server } from "@/test/server";

import { ApiError, request } from "./http";
import { getSession, onUnauthorized, saveSession } from "./session";

describe("request", () => {
  it("sends the bearer token and validates the response", async () => {
    saveSession({ token: "abc", roomieId: 3 });
    let header: string | null = null;
    server.use(
      http.get(`${API}/ping`, ({ request: incoming }) => {
        header = incoming.headers.get("Authorization");
        return HttpResponse.json({ ok: true });
      }),
    );
    const result = await request("/ping", { schema: z.object({ ok: z.boolean() }) });
    expect(result).toEqual({ ok: true });
    expect(header).toBe("Bearer abc");
  });

  it("turns error payloads into ApiError with the server message", async () => {
    server.use(
      http.get(`${API}/boom`, () => HttpResponse.json({ error: "Nope" }, { status: 403 })),
    );
    await expect(request("/boom")).rejects.toMatchObject({ status: 403, message: "Nope" });
  });

  it("uses a generic message when the body has no error", async () => {
    server.use(http.get(`${API}/boom`, () => new HttpResponse(null, { status: 500 })));
    await expect(request("/boom")).rejects.toBeInstanceOf(ApiError);
  });

  it("clears the session and notifies on 401 when a token was sent", async () => {
    saveSession({ token: "stale", roomieId: 3 });
    const listener = vi.fn();
    const off = onUnauthorized(listener);
    server.use(http.get(`${API}/me`, () => HttpResponse.json({ error: "x" }, { status: 401 })));
    await expect(request("/me")).rejects.toMatchObject({ status: 401 });
    expect(listener).toHaveBeenCalledOnce();
    expect(getSession()).toBeNull();
    off();
  });

  it("does not notify on 401 without a token", async () => {
    const listener = vi.fn();
    const off = onUnauthorized(listener);
    server.use(
      http.post(`${API}/login`, () => HttpResponse.json({ error: "Mal" }, { status: 401 })),
    );
    await expect(request("/login", { method: "POST", body: {} })).rejects.toMatchObject({
      message: "Mal",
    });
    expect(listener).not.toHaveBeenCalled();
    off();
  });

  it("reports network failures", async () => {
    server.use(http.get(`${API}/down`, () => HttpResponse.error()));
    await expect(request("/down")).rejects.toMatchObject({ status: 0 });
  });
});
