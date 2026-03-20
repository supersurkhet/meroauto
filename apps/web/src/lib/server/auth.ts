import { WorkOS } from '@workos-inc/node';
import { env } from '$env/dynamic/private';

const workos = new WorkOS(env.WORKOS_API_KEY || '');

const clientId = env.WORKOS_CLIENT_ID || '';
export { workos, clientId };

export function getAuthorizationUrl(origin: string, state?: string): string {
	const redirectUri = env.WORKOS_REDIRECT_URI || `${origin}/auth/callback`;
	return workos.userManagement.getAuthorizationUrl({
		provider: 'authkit',
		clientId,
		redirectUri,
		state
	});
}

export async function authenticateWithCode(code: string) {
	return workos.userManagement.authenticateWithCode({
		code,
		clientId
	});
}

export async function getUser(userId: string) {
	return workos.userManagement.getUser(userId);
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
