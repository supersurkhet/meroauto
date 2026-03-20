import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getAuthorizationUrl } from '$lib/server/auth';

export const GET: RequestHandler = ({ url }) => {
	const returnTo = url.searchParams.get('returnTo') || '/register';
	const authUrl = getAuthorizationUrl(url.origin, returnTo);
	redirect(302, authUrl);
};
