<script lang="ts">
	import { t } from '$i18n';
	import { MapPin, Clock, CreditCard, Shield, Smartphone, QrCode, ArrowRight, Star, Users, Car, Map } from 'lucide-svelte';
</script>

<svelte:head>
	<title>MeroAuto - Your Auto Rickshaw, One Tap Away</title>
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "Organization",
			"name": "MeroAuto",
			"description": "Auto-rickshaw ride-sharing platform in Surkhet, Nepal",
			"url": "https://meroauto.com",
			"logo": "https://meroauto.com/logo.png",
			"foundingDate": "2026",
			"foundingLocation": "Surkhet, Nepal",
			"address": {
				"@type": "PostalAddress",
				"streetAddress": "Birendranagar",
				"addressLocality": "Birendranagar",
				"addressRegion": "Surkhet",
				"addressCountry": "NP"
			},
			"contactPoint": {
				"@type": "ContactPoint",
				"telephone": "+977-83-520000",
				"contactType": "customer service",
				"availableLanguage": ["English", "Nepali"]
			},
			"sameAs": []
		}
	</script>
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "MobileApplication",
			"name": "MeroAuto",
			"operatingSystem": "Android, iOS",
			"applicationCategory": "TravelApplication",
			"description": "Book auto-rickshaw rides in Surkhet, Nepal. QR instant booking, live tracking, digital payments.",
			"offers": {
				"@type": "Offer",
				"price": "0",
				"priceCurrency": "NPR"
			},
			"aggregateRating": {
				"@type": "AggregateRating",
				"ratingValue": "4.7",
				"ratingCount": "5000"
			}
		}
	</script>
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "WebSite",
			"name": "MeroAuto",
			"url": "https://meroauto.com",
			"potentialAction": {
				"@type": "SearchAction",
				"target": "https://meroauto.com/pricing?q={search_term_string}",
				"query-input": "required name=search_term_string"
			}
		}
	</script>
</svelte:head>

<!-- Hero Section -->
<section class="relative overflow-hidden bg-gradient-to-br from-brand-50 via-white to-emerald-50 dark:from-gray-900 dark:via-gray-900 dark:to-brand-900/20">
	<!-- Decorative elements -->
	<div class="pointer-events-none absolute inset-0 overflow-hidden">
		<div class="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-brand/10 blur-3xl"></div>
		<div class="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl"></div>
		<!-- Auto rickshaw pattern -->
		<svg class="absolute right-0 bottom-0 h-96 w-96 text-brand/5" viewBox="0 0 200 200" fill="currentColor">
			<path d="M60,140 Q60,100 80,80 L120,80 Q140,80 150,100 L155,120 Q160,140 140,140 Z" />
			<circle cx="80" cy="145" r="12" />
			<circle cx="135" cy="145" r="12" />
			<path d="M85,80 L85,60 Q85,50 95,50 L115,50 Q125,50 125,60 L125,80" fill="none" stroke="currentColor" stroke-width="3" />
		</svg>
	</div>

	<div class="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
		<div class="grid items-center gap-12 lg:grid-cols-2">
			<div class="max-w-2xl">
				<div class="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700 dark:border-brand-800 dark:bg-brand-900/30 dark:text-brand-light">
					<span class="relative flex h-2 w-2">
						<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
						<span class="relative inline-flex h-2 w-2 rounded-full bg-brand"></span>
					</span>
					Now live in Surkhet
				</div>

				<h1 class="text-5xl leading-tight font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl dark:text-white">
					{$t('hero.title')}
					<span class="bg-gradient-to-r from-brand to-brand-dark bg-clip-text text-transparent">{$t('hero.titleHighlight')}</span>
				</h1>

				<p class="mt-6 max-w-lg text-lg leading-relaxed text-gray-600 dark:text-gray-300">
					{$t('hero.subtitle')}
				</p>

				<div class="mt-8 flex flex-col gap-3 sm:flex-row">
					<a href="#download" class="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-brand/25 transition-all hover:-translate-y-0.5 hover:bg-brand-dark hover:shadow-xl hover:shadow-brand/30">
						<Smartphone class="h-5 w-5" />
						{$t('hero.cta')}
					</a>
					<a href="/register" class="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-gray-700 transition-all hover:-translate-y-0.5 hover:border-brand hover:text-brand dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:border-brand dark:hover:text-brand-light">
						{$t('hero.ctaDriver')}
						<ArrowRight class="h-5 w-5" />
					</a>
				</div>
			</div>

			<!-- Auto-rickshaw illustration -->
			<div class="hidden lg:block">
				<div class="relative">
					<div class="absolute -inset-4 rounded-3xl bg-gradient-to-r from-brand/20 to-amber-400/20 blur-2xl"></div>
					<div class="relative rounded-3xl border border-gray-200/50 bg-white/80 p-8 shadow-2xl backdrop-blur dark:border-gray-700/50 dark:bg-gray-800/80">
						<!-- Stylized auto rickshaw SVG -->
						<svg viewBox="0 0 400 300" class="w-full" xmlns="http://www.w3.org/2000/svg">
							<!-- Road -->
							<rect x="0" y="240" width="400" height="60" rx="8" fill="#f3f4f6" class="dark:fill-gray-700"/>
							<line x1="30" y1="270" x2="100" y2="270" stroke="#d1d5db" stroke-width="3" stroke-dasharray="10,8" class="dark:stroke-gray-600"/>
							<line x1="140" y1="270" x2="210" y2="270" stroke="#d1d5db" stroke-width="3" stroke-dasharray="10,8" class="dark:stroke-gray-600"/>
							<line x1="250" y1="270" x2="320" y2="270" stroke="#d1d5db" stroke-width="3" stroke-dasharray="10,8" class="dark:stroke-gray-600"/>

							<!-- Auto body -->
							<path d="M100,240 L100,160 Q100,140 120,130 L200,110 Q220,105 240,110 L280,125 Q300,135 300,155 L300,240" fill="#10b981" stroke="#059669" stroke-width="2"/>

							<!-- Roof -->
							<path d="M110,160 Q110,120 150,105 L230,95 Q260,90 270,120 L275,155" fill="#34d399" stroke="#059669" stroke-width="2"/>

							<!-- Windshield -->
							<path d="M130,155 L155,120 Q160,115 175,112 L220,108 Q235,106 240,115 L255,150" fill="#bfdbfe" stroke="#93c5fd" stroke-width="1.5" opacity="0.8"/>

							<!-- Side window -->
							<rect x="155" y="140" width="65" height="45" rx="5" fill="#bfdbfe" opacity="0.6" stroke="#93c5fd" stroke-width="1"/>

							<!-- Headlight -->
							<circle cx="295" cy="175" r="8" fill="#fbbf24" stroke="#f59e0b" stroke-width="2"/>
							<circle cx="295" cy="175" r="4" fill="#fef3c7"/>

							<!-- Wheels -->
							<circle cx="140" cy="240" r="22" fill="#374151" stroke="#1f2937" stroke-width="3"/>
							<circle cx="140" cy="240" r="10" fill="#9ca3af"/>
							<circle cx="140" cy="240" r="4" fill="#374151"/>
							<circle cx="275" cy="240" r="22" fill="#374151" stroke="#1f2937" stroke-width="3"/>
							<circle cx="275" cy="240" r="10" fill="#9ca3af"/>
							<circle cx="275" cy="240" r="4" fill="#374151"/>

							<!-- Handle -->
							<line x1="105" y1="160" x2="85" y2="145" stroke="#6b7280" stroke-width="4" stroke-linecap="round"/>
							<circle cx="82" cy="142" r="5" fill="#9ca3af"/>

							<!-- Passenger -->
							<circle cx="190" cy="135" r="12" fill="#fbbf24"/>
							<path d="M183,147 Q190,155 197,147" fill="none" stroke="#92400e" stroke-width="1.5"/>

							<!-- Phone with map -->
							<rect x="320" y="80" width="60" height="100" rx="10" fill="#1f2937" stroke="#374151" stroke-width="2"/>
							<rect x="325" y="90" width="50" height="75" rx="5" fill="#ecfdf5"/>
							<circle cx="350" cy="120" r="8" fill="#10b981" opacity="0.3"/>
							<circle cx="350" cy="120" r="3" fill="#10b981"/>
							<path d="M335,110 Q345,130 360,125 Q355,140 340,145" fill="none" stroke="#10b981" stroke-width="2" stroke-dasharray="4,3"/>
							<circle cx="340" cy="145" r="4" fill="#ef4444"/>

							<!-- Connection line -->
							<path d="M300,150 Q320,120 325,115" fill="none" stroke="#10b981" stroke-width="1.5" stroke-dasharray="5,5" opacity="0.5"/>

							<!-- QR code hint -->
							<rect x="260" y="180" width="25" height="25" rx="3" fill="white" stroke="#d1d5db" stroke-width="1"/>
							<rect x="263" y="183" width="5" height="5" fill="#374151"/>
							<rect x="270" y="183" width="5" height="5" fill="#374151"/>
							<rect x="277" y="183" width="5" height="5" fill="#374151"/>
							<rect x="263" y="190" width="5" height="5" fill="#374151"/>
							<rect x="277" y="190" width="5" height="5" fill="#374151"/>
							<rect x="263" y="197" width="5" height="5" fill="#374151"/>
							<rect x="270" y="197" width="5" height="5" fill="#374151"/>
							<rect x="277" y="197" width="5" height="5" fill="#374151"/>
						</svg>

						<div class="mt-4 flex items-center justify-between">
							<div class="flex items-center gap-2">
								<div class="h-2 w-2 rounded-full bg-brand animate-pulse"></div>
								<span class="text-sm font-medium text-gray-600 dark:text-gray-300">3 autos nearby</span>
							</div>
							<span class="text-sm text-gray-400">ETA: 2 min</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Stats -->
		<div class="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:mt-24">
			{#each [
				{ icon: Users, value: '5,000+', label: 'hero.ridersServed' },
				{ icon: Car, value: '200+', label: 'hero.activeDrivers' },
				{ icon: Map, value: '25,000+', label: 'hero.ridesCompleted' },
				{ icon: MapPin, value: '1', label: 'hero.citiesCovered' }
			] as stat}
				<div class="rounded-2xl border border-gray-200/60 bg-white/60 p-5 text-center backdrop-blur dark:border-gray-700/60 dark:bg-gray-800/60">
					<stat.icon class="mx-auto mb-2 h-6 w-6 text-brand" />
					<p class="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
					<p class="text-sm text-gray-500 dark:text-gray-400">{$t(stat.label)}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- How It Works -->
<section class="bg-white py-20 dark:bg-gray-900">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h2 class="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">{$t('howItWorks.title')}</h2>
			<p class="mt-3 text-lg text-gray-500 dark:text-gray-400">{$t('howItWorks.subtitle')}</p>
		</div>

		<div class="mt-16 grid gap-8 md:grid-cols-3">
			{#each [
				{ icon: Smartphone, title: 'howItWorks.step1Title', desc: 'howItWorks.step1Desc', step: '1', color: 'from-brand to-emerald-600' },
				{ icon: MapPin, title: 'howItWorks.step2Title', desc: 'howItWorks.step2Desc', step: '2', color: 'from-blue-500 to-cyan-500' },
				{ icon: CreditCard, title: 'howItWorks.step3Title', desc: 'howItWorks.step3Desc', step: '3', color: 'from-amber-500 to-orange-500' }
			] as item}
				<div class="group relative">
					<div class="absolute -inset-1 rounded-2xl bg-gradient-to-r {item.color} opacity-0 blur-lg transition-opacity group-hover:opacity-20"></div>
					<div class="relative rounded-2xl border border-gray-100 bg-white p-8 transition-shadow hover:shadow-xl dark:border-gray-800 dark:bg-gray-800">
						<div class="mb-4 flex items-center gap-4">
							<div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r {item.color} text-lg font-bold text-white shadow-lg">
								{item.step}
							</div>
							<item.icon class="h-6 w-6 text-gray-400" />
						</div>
						<h3 class="text-xl font-semibold text-gray-900 dark:text-white">{$t(item.title)}</h3>
						<p class="mt-2 leading-relaxed text-gray-500 dark:text-gray-400">{$t(item.desc)}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- QR Feature -->
<section class="bg-gray-50 py-20 dark:bg-gray-800">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="grid items-center gap-12 lg:grid-cols-2">
			<div>
				<div class="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
					<QrCode class="h-4 w-4" />
					Instant Ride Feature
				</div>
				<h2 class="text-3xl font-bold text-gray-900 sm:text-4xl dark:text-white">
					Scan QR, Skip the Wait
				</h2>
				<p class="mt-4 text-lg leading-relaxed text-gray-600 dark:text-gray-300">
					See an auto-rickshaw on the street? Just scan the QR code on its back to instantly book that specific driver. No waiting for matching — ride immediately.
				</p>
				<ul class="mt-6 space-y-3">
					{#each ['Every auto has a unique QR code', 'Scan to see driver details & rating', 'Instant booking — no wait time', 'Works even without internet (SMS fallback)'] as feature}
						<li class="flex items-center gap-3 text-gray-600 dark:text-gray-300">
							<div class="flex h-6 w-6 items-center justify-center rounded-full bg-brand/10">
								<svg class="h-4 w-4 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
								</svg>
							</div>
							{feature}
						</li>
					{/each}
				</ul>
			</div>
			<div class="flex justify-center">
				<div class="relative">
					<div class="absolute -inset-4 rounded-3xl bg-gradient-to-r from-amber-400/20 to-brand/20 blur-2xl"></div>
					<div class="relative rounded-3xl border border-gray-200 bg-white p-8 shadow-xl dark:border-gray-700 dark:bg-gray-800">
						<QrCode class="mx-auto h-48 w-48 text-gray-800 dark:text-gray-200" />
						<p class="mt-4 text-center text-sm font-medium text-gray-500 dark:text-gray-400">Scan to ride with Driver #142</p>
						<div class="mt-3 flex items-center justify-center gap-1">
							{#each Array(5) as _, i}
								<Star class="h-4 w-4 {i < 4 ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}" />
							{/each}
							<span class="ml-1 text-sm text-gray-500">4.8</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Download CTA -->
<section id="download" class="relative overflow-hidden bg-brand py-20">
	<div class="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
	<div class="relative mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
		<h2 class="text-3xl font-bold text-white sm:text-4xl">
			Ready to ride? Download MeroAuto
		</h2>
		<p class="mt-4 text-lg text-white/80">
			Available for Android and iOS. Start riding in under a minute.
		</p>
		<div class="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
			<button class="inline-flex items-center gap-3 rounded-xl bg-black px-6 py-3 text-white transition-transform hover:-translate-y-0.5">
				<svg class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
					<path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
				</svg>
				<div class="text-left">
					<div class="text-xs text-gray-300">Download on the</div>
					<div class="text-sm font-semibold">App Store</div>
				</div>
			</button>
			<button class="inline-flex items-center gap-3 rounded-xl bg-black px-6 py-3 text-white transition-transform hover:-translate-y-0.5">
				<svg class="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
					<path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302c.634.423.634 1.377 0 1.8l-2.302 2.302L15.802 12l1.896-2.492zM5.864 2.658L16.8 8.991l-2.302 2.302L5.864 2.658z"/>
				</svg>
				<div class="text-left">
					<div class="text-xs text-gray-300">Get it on</div>
					<div class="text-sm font-semibold">Google Play</div>
				</div>
			</button>
		</div>
	</div>
</section>
