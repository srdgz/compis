import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import vm from "node:vm";

type Listener = (event: Record<string, unknown>) => void;

function loadServiceWorker() {
  const listeners: Record<string, Listener> = {};
  const store = new Map<string, Map<string, unknown>>();
  const fetchCalls: string[] = [];
  let online = true;

  const cacheFor = (name: string) => {
    if (!store.has(name)) store.set(name, new Map());
    const entries = store.get(name)!;
    return {
      addAll: async (urls: string[]) => urls.forEach((url) => entries.set(url, `cached:${url}`)),
      put: async (request: string | { url: string }, value: unknown) => {
        const key = typeof request === "string" ? request : new URL(request.url).pathname;
        entries.set(key, value);
      },
    };
  };

  const caches = {
    open: async (name: string) => cacheFor(name),
    keys: async () => [...store.keys()],
    delete: async (name: string) => store.delete(name),
    match: async (request: string | { url: string }) => {
      const key = typeof request === "string" ? request : new URL(request.url).pathname;
      for (const entries of store.values()) if (entries.has(key)) return entries.get(key);
      return undefined;
    },
  };

  const self = {
    location: { origin: "https://compis.test" },
    addEventListener: (name: string, listener: Listener) => (listeners[name] = listener),
    skipWaiting: () => undefined,
    clients: { claim: async () => undefined },
  };

  const fetch = async (request: { url: string }) => {
    fetchCalls.push(new URL(request.url).pathname);
    if (!online) throw new Error("offline");
    return { clone: () => ({ body: request.url }), body: request.url };
  };

  const code = readFileSync(resolve(process.cwd(), "public/sw.js"), "utf8");
  vm.runInNewContext(code, { self, caches, fetch, URL, Promise, void: undefined });

  async function dispatch(name: string, event: Record<string, unknown>) {
    let pending: Promise<unknown> | undefined;
    listeners[name]!({
      ...event,
      waitUntil: (promise: Promise<unknown>) => (pending = promise),
      respondWith: (promise: Promise<unknown>) => (pending = promise),
    });
    return pending ? await pending : undefined;
  }

  const request = (path: string, init: { method?: string; mode?: string } = {}) => ({
    url: `https://compis.test${path}`,
    method: init.method ?? "GET",
    mode: init.mode ?? "no-cors",
  });

  return {
    store,
    fetchCalls,
    setOnline: (value: boolean) => (online = value),
    install: () => dispatch("install", {}),
    activate: () => dispatch("activate", {}),
    fetchEvent: (path: string, init?: { method?: string; mode?: string }) =>
      dispatch("fetch", { request: request(path, init) }),
    ignored: (path: string, init?: { method?: string; mode?: string }) => {
      let handled = false;
      listeners["fetch"]!({
        request: request(path, init),
        respondWith: () => (handled = true),
      });
      return !handled;
    },
  };
}

describe("service worker", () => {
  it("precaches the app shell on install", async () => {
    const sw = loadServiceWorker();
    await sw.install();
    expect([...sw.store.get("compis-shell-v1")!.keys()]).toEqual([
      "/",
      "/favicon.svg",
      "/manifest.webmanifest",
    ]);
  });

  it("removes caches from older versions on activate", async () => {
    const sw = loadServiceWorker();
    await sw.install();
    sw.store.set("compis-shell-v0", new Map());
    await sw.activate();
    expect([...sw.store.keys()]).toEqual(["compis-shell-v1"]);
  });

  it("never handles API calls, writes or other origins", () => {
    const sw = loadServiceWorker();
    expect(sw.ignored("/api/task/home/1")).toBe(true);
    expect(sw.ignored("/tasks", { method: "POST", mode: "navigate" })).toBe(true);
  });

  it("serves the cached shell when a navigation fails offline", async () => {
    const sw = loadServiceWorker();
    await sw.install();
    sw.setOnline(false);
    expect(await sw.fetchEvent("/tasks", { mode: "navigate" })).toBe("cached:/");
  });

  it("caches hashed assets and reuses them without the network", async () => {
    const sw = loadServiceWorker();
    await sw.fetchEvent("/assets/index-abc.js");
    expect(sw.fetchCalls).toEqual(["/assets/index-abc.js"]);
    await new Promise((resolve) => setTimeout(resolve, 0));
    sw.setOnline(false);
    await sw.fetchEvent("/assets/index-abc.js");
    expect(sw.fetchCalls).toHaveLength(1);
  });
});
