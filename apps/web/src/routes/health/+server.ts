import type { RequestHandler } from './$types';

export const GET: RequestHandler = () => {
	return new Response(
		JSON.stringify({
			status: 'ok',
			service: 'meroauto-web',
			timestamp: new Date().toISOString(),
			version: '0.0.1'
		}),
		{
			headers: {
				'Content-Type': 'application/json',
				'Cache-Control': 'no-cache'
			}
		}
	);
};
