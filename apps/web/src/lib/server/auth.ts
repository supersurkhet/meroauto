import { env } from '$env/dynamic/private';

function getClientId(): string {
	const clientId = env.WORKOS_CLIENT_ID;
	if (!clientId) {
		throw new Error('WORKOS_CLIENT_ID is required for WorkOS authentication')
	}

	return clientId
}

async function getWorkOS() {
	const apiKey = env.WORKOS_API_KEY;
	if (!apiKey) {
		throw new Error('WORKOS_API_KEY is required for WorkOS authentication')
	}

	const { WorkOS } = await import('@workos-inc/node');
	return new WorkOS(apiKey)
}

export async function getAuthorizationUrl(origin: string, state?: string): Promise<string> {
	const workos = await getWorkOS();
	const clientId = getClientId();
	const redirectUri = env.WORKOS_REDIRECT_URI || `${origin}/auth/callback`;
	return workos.userManagement.getAuthorizationUrl({
		provider: 'authkit',
		clientId,
		redirectUri,
		state
	});
}

export async function authenticateWithCode(code: string) {
	const workos = await getWorkOS();
	const clientId = getClientId();
	return workos.userManagement.authenticateWithCode({
		code,
		clientId
	});
}

export async function getUser(userId: string) {
	return (await getWorkOS()).userManagement.getUser(userId);
}

export interface SessionUser {
	id: string;
	email: string;
	firstName: string | null;
	lastName: string | null;
	profilePictureUrl: string | null;
}

export function serializeSession(user: SessionUser): string {
	return Buffer.from(JSON.stringify(user)).toString('base64');
}

export function deserializeSession(cookie: string): SessionUser | null {
	try {
		return JSON.parse(Buffer.from(cookie, 'base64').toString('utf-8'));
	} catch {
		return null;
	}
}
