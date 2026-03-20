import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { authenticateWithCode, serializeSession, type SessionUser } from '$lib/server/auth';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state') || '/register';

	if (!code) {
		redirect(302, '/auth/login');
	}

	try {
		const { user, accessToken } = await authenticateWithCode(code);

		const session: SessionUser = {
			id: user.id,
			email: user.email,
			firstName: user.firstName,
			lastName: user.lastName,
			profilePictureUrl: user.profilePictureUrl
		};

		cookies.set('meroauto_session', serializeSession(session), {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		if (accessToken) {
			cookies.set('meroauto_token', accessToken, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax',
				maxAge: 60 * 60 // 1 hour
			});
		}
	} catch (err) {
		console.error('Auth callback error:', err);
		redirect(302, '/register?error=auth_failed');
	}

	redirect(302, state);
};
