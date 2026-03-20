import { ConvexClient } from 'convex/browser';
import { writable } from 'svelte/store';
import { browser } from '$app/environment';

const CONVEX_URL = 'https://meroauto.convex.cloud';

let client: ConvexClient | null = null;

export function getConvexClient(): ConvexClient {
	if (!client && browser) {
		client = new ConvexClient(CONVEX_URL);
	}
	return client!;
}

export const convexToken = writable<string | null>(null);

export function setConvexAuth(token: string | null) {
	convexToken.set(token);
	if (!browser || !client) return;

	if (token) {
		client.setAuth(async () => token);
	} else {
		client.setAuth(async () => null);
	}
}
