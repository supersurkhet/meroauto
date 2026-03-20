import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = import.meta.env.VITE_CONVEX_URL as string | undefined;

export const USE_CONVEX = !!CONVEX_URL;

let _client: ConvexHttpClient | null = null;

export function getClient(): ConvexHttpClient {
  if (!_client) {
    if (!CONVEX_URL) throw new Error("VITE_CONVEX_URL not set");
    _client = new ConvexHttpClient(CONVEX_URL);
  }
  return _client;
}

/** Set auth token for authenticated Convex calls */
export function setAuthToken(token: string) {
  getClient().setAuth(token);
}

/** Call a Convex query by name */
export async function query<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  return await getClient().query(name as any, args);
}

/** Call a Convex mutation by name */
export async function mutate<T = unknown>(name: string, args: Record<string, unknown> = {}): Promise<T> {
  return await getClient().mutation(name as any, args);
}
