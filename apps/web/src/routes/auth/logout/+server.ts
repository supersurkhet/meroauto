import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ cookies }) => {
	cookies.delete('meroauto_session', { path: '/' });
	cookies.delete('meroauto_token', { path: '/' });
	redirect(302, '/');
};
