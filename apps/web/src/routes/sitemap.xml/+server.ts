import type { RequestHandler } from './$types';

const pages = [
	{ path: '/', priority: '1.0', changefreq: 'weekly' },
	{ path: '/pricing', priority: '0.8', changefreq: 'monthly' },
	{ path: '/safety', priority: '0.7', changefreq: 'monthly' },
	{ path: '/coverage', priority: '0.8', changefreq: 'monthly' },
	{ path: '/about', priority: '0.6', changefreq: 'monthly' },
	{ path: '/contact', priority: '0.6', changefreq: 'monthly' },
	{ path: '/register', priority: '0.9', changefreq: 'weekly' },
];

export const GET: RequestHandler = () => {
	const baseUrl = 'https://meroauto.com';
	const today = new Date().toISOString().split('T')[0];

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages
	.map(
		(page) => `  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
	)
	.join('\n')}
</urlset>`;

	return new Response(xml, {
		headers: {
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=3600'
		}
	});
};
