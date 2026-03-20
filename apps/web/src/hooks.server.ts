import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const response = await resolve(event, {
		preload: ({ type }) => type === 'css' || type === 'js' || type === 'font'
	});

	// Security headers
	response.headers.set('X-Frame-Options', 'DENY');
	response.headers.set('X-Content-Type-Options', 'nosniff');
	response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
	response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self)');
	response.headers.set(
		'Content-Security-Policy',
		[
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline'",
			"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://unpkg.com",
			"font-src 'self' https://fonts.gstatic.com",
			"img-src 'self' data: blob: https://*.tile.openstreetmap.org https://unpkg.com",
			"connect-src 'self' https://*.convex.cloud wss://*.convex.cloud",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'"
		].join('; ')
	);

	// Cache static assets aggressively
	const url = event.url.pathname;
	if (url.startsWith('/_app/immutable/')) {
		response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
	} else if (url.match(/\.(svg|png|jpg|ico|woff2?)$/)) {
		response.headers.set('Cache-Control', 'public, max-age=86400, stale-while-revalidate=604800');
	}

	return response;
};
