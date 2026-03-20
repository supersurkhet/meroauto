<script lang="ts">
	import { t } from '$i18n';
	import { browser } from '$app/environment';
	import { Download, Monitor, Smartphone, ChevronRight, Shield, Zap, Star, ExternalLink, ArrowDown, Check } from 'lucide-svelte';

	type Platform = 'android' | 'ios' | 'macos' | 'windows' | 'linux';

	const GITHUB_RELEASES = 'https://github.com/supersurkhet/meroauto/releases/latest';

	const platforms = {
		android: {
			name: 'Android',
			icon: Smartphone,
			subtitle: 'Android 8.0+',
			fileName: 'meroauto-rider.apk',
			fileSize: '~12 MB',
			href: `${GITHUB_RELEASES}/download/meroauto-rider.apk`,
			badge: 'Rider App',
			color: 'from-green-500 to-emerald-600',
			bgGlow: 'bg-green-500/20',
			iconBg: 'bg-green-500',
			description: 'Book auto-rickshaw rides, track live, pay digitally.',
			available: true,
			version: 'v1.0.0'
		},
		ios: {
			name: 'iOS',
			icon: Smartphone,
			subtitle: 'iPhone & iPad · iOS 16+',
			fileName: '',
			fileSize: '',
			href: '/download',
			badge: 'Coming to App Store',
			color: 'from-gray-600 to-gray-800',
			bgGlow: 'bg-gray-500/20',
			iconBg: 'bg-gray-700',
			description: 'Join the TestFlight beta for early access.',
			available: false,
			version: 'Beta'
		},
		macos: {
			name: 'macOS',
			icon: Monitor,
			subtitle: 'macOS 12+ · Apple Silicon & Intel',
			fileName: 'MeroAuto-Admin.dmg',
			fileSize: '~45 MB',
			href: `${GITHUB_RELEASES}/download/MeroAuto-Admin.dmg`,
			badge: 'Admin Dashboard',
			color: 'from-blue-500 to-indigo-600',
			bgGlow: 'bg-blue-500/20',
			iconBg: 'bg-blue-600',
			description: 'Manage drivers, rides, pricing, and analytics.',
			available: true,
			version: 'v1.0.0'
		},
		windows: {
			name: 'Windows',
			icon: Monitor,
			subtitle: 'Windows 10+',
			fileName: 'MeroAuto-Admin.msi',
			fileSize: '~40 MB',
			href: `${GITHUB_RELEASES}/download/MeroAuto-Admin.msi`,
			badge: 'Admin Dashboard',
			color: 'from-cyan-500 to-blue-600',
			bgGlow: 'bg-cyan-500/20',
			iconBg: 'bg-cyan-600',
			description: 'Manage drivers, rides, pricing, and analytics.',
			available: true,
			version: 'v1.0.0'
		},
		linux: {
			name: 'Linux',
			icon: Monitor,
			subtitle: 'Ubuntu 20.04+, Fedora 36+',
			fileName: 'meroauto-admin.AppImage',
			fileSize: '~50 MB',
			href: `${GITHUB_RELEASES}/download/meroauto-admin.AppImage`,
			badge: 'Admin Dashboard',
			color: 'from-orange-500 to-red-600',
			bgGlow: 'bg-orange-500/20',
			iconBg: 'bg-orange-600',
			description: 'Manage drivers, rides, pricing, and analytics.',
			available: true,
			version: 'v1.0.0'
		}
	} as const;

	function detectPlatform(): Platform {
		if (!browser) return 'android';
		const ua = navigator.userAgent.toLowerCase();
		if (/android/.test(ua)) return 'android';
		if (/iphone|ipad|ipod/.test(ua)) return 'ios';
		if (/macintosh|mac os x/.test(ua)) return 'macos';
		if (/windows/.test(ua)) return 'windows';
		if (/linux/.test(ua)) return 'linux';
		return 'android';
	}

	const detectedPlatform = $state<Platform>(detectPlatform());
	const primary = $derived(platforms[detectedPlatform]);
	const secondary = $derived(
		(Object.entries(platforms) as [Platform, typeof platforms[Platform]][])
			.filter(([key]) => key !== detectedPlatform)
	);
</script>

<svelte:head>
	<title>{$t('download.title')} - MeroAuto</title>
	<meta name="description" content="Download MeroAuto for Android, iOS, Windows, macOS, or Linux. Auto-rickshaw rides in Surkhet at your fingertips." />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "SoftwareApplication",
			"name": "MeroAuto",
			"operatingSystem": "Android, iOS, Windows, macOS, Linux",
			"applicationCategory": "TravelApplication",
			"offers": { "@type": "Offer", "price": "0", "priceCurrency": "NPR" },
			"downloadUrl": "https://github.com/supersurkhet/meroauto/releases/latest"
		}
	</script>
</svelte:head>

<!-- ━━━ HERO: Detected Platform ━━━ -->
<section class="relative overflow-hidden bg-gradient-to-b from-gray-50 via-white to-gray-50/50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
	<!-- Ambient glow behind hero card -->
	<div class="pointer-events-none absolute inset-0">
		<div class="absolute top-32 left-1/2 h-[500px] w-[700px] -translate-x-1/2 rounded-full {primary.bgGlow} blur-[120px]"></div>
	</div>

	<div class="relative mx-auto max-w-3xl px-4 pt-28 pb-20 sm:px-6 sm:pt-36 sm:pb-24 lg:px-8">
		<div class="text-center">
			<h1 class="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl dark:text-white">
				{$t('download.title')}
			</h1>
			<p class="mx-auto mt-3 max-w-lg text-base text-gray-500 dark:text-gray-400">
				{$t('download.subtitle')}
			</p>
		</div>

		<!-- ▼ THE HERO CARD ▼ -->
		<div class="relative mt-12">
			<div class="absolute -inset-1 rounded-[28px] bg-gradient-to-r {primary.color} opacity-20 blur-xl"></div>

			<div class="relative overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-2xl dark:border-gray-700/80 dark:bg-gray-800">
				<!-- Gradient accent bar -->
				<div class="h-1.5 bg-gradient-to-r {primary.color}"></div>

				<div class="px-8 py-10 sm:px-12 sm:py-12">
					<div class="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
						<!-- Platform icon -->
						<div class="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl {primary.iconBg} text-white shadow-lg sm:h-24 sm:w-24">
							<primary.icon class="h-10 w-10 sm:h-12 sm:w-12" />
						</div>

						<div class="flex-1 text-center sm:text-left">
							<!-- Platform badge -->
							<div class="mb-2 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
								<span class="relative flex h-1.5 w-1.5">
									<span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand opacity-75"></span>
									<span class="relative inline-flex h-1.5 w-1.5 rounded-full bg-brand"></span>
								</span>
								{$t('download.detected')} {primary.name}
							</div>

							<!-- Title -->
							<h2 class="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-white">
								{$t('download.downloadFor')} {primary.name}
							</h2>

							<!-- Description -->
							<p class="mt-2 text-gray-500 dark:text-gray-400">{primary.description}</p>

							<!-- Meta row -->
							<div class="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-gray-400 sm:justify-start">
								<span class="inline-flex items-center gap-1">
									<Check class="h-3.5 w-3.5 text-brand" />
									{primary.subtitle}
								</span>
								{#if primary.available}
									<span>{primary.version}</span>
									<span>{primary.fileSize}</span>
									<span class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-light">{primary.badge}</span>
								{/if}
							</div>

							<!-- CTA Button -->
							<div class="mt-8">
								{#if primary.available}
									<a
										href={primary.href}
										class="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r {primary.color} px-10 py-5 text-lg font-bold text-white shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl active:translate-y-0"
									>
										<ArrowDown class="h-6 w-6 transition-transform group-hover:translate-y-1" />
										{$t('download.downloadFor')} {primary.name}
									</a>
									<p class="mt-3 text-sm text-gray-400">
										{primary.fileName} · {$t('download.free')}
									</p>
								{:else}
									<div class="inline-flex items-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 px-10 py-5 text-lg font-bold text-gray-400 dark:border-gray-600">
										<Smartphone class="h-6 w-6" />
										{$t('download.comingSoon')}
									</div>
									<p class="mt-3 text-sm text-gray-400">{$t('download.testflight')}</p>
								{/if}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- GitHub releases link -->
		<p class="mt-6 text-center">
			<a href={GITHUB_RELEASES} target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 text-sm font-medium text-brand hover:text-brand-dark">
				{$t('download.allReleases')}
				<ExternalLink class="h-3.5 w-3.5" />
			</a>
		</p>
	</div>
</section>

<!-- ━━━ OTHER PLATFORMS ━━━ -->
<section class="border-t border-gray-100 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
	<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
		<h2 class="mb-8 text-center text-lg font-semibold text-gray-500 dark:text-gray-400">{$t('download.otherPlatforms')}</h2>

		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{#each secondary as [key, platform]}
				<div class="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600">
					<div class="mb-3 flex items-center gap-3">
						<div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r {platform.color} text-white shadow-sm">
							<platform.icon class="h-5 w-5" />
						</div>
						<div>
							<p class="font-semibold text-gray-900 dark:text-white">{platform.name}</p>
							<p class="text-xs text-gray-400">{platform.badge}</p>
						</div>
					</div>

					{#if platform.available}
						<a
							href={platform.href}
							class="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-brand-900/20 dark:hover:text-brand-light"
						>
							<span class="flex items-center gap-2">
								<Download class="h-4 w-4" />
								{$t('download.download')}
							</span>
							<span class="text-xs text-gray-400">{platform.fileSize}</span>
						</a>
					{:else}
						<div class="flex items-center justify-center rounded-xl bg-gray-50 px-4 py-2.5 text-sm text-gray-400 dark:bg-gray-700/50">
							{$t('download.comingSoon')}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ STORE BADGES ━━━ -->
<section class="border-t border-gray-100 bg-gray-50 py-14 dark:border-gray-800 dark:bg-gray-800/50">
	<div class="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
		<h2 class="text-lg font-semibold text-gray-900 dark:text-white">{$t('download.mobileApps')}</h2>
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{$t('download.mobileAppsDesc')}</p>

		<div class="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
			<a href="/download" class="inline-flex items-center gap-3 rounded-xl bg-black px-5 py-2.5 text-white transition-transform hover:-translate-y-0.5">
				<svg class="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302c.634.423.634 1.377 0 1.8l-2.302 2.302L15.802 12l1.896-2.492zM5.864 2.658L16.8 8.991l-2.302 2.302L5.864 2.658z"/></svg>
				<div class="text-left">
					<div class="text-[10px] leading-tight text-gray-400">{$t('download.getItOn')}</div>
					<div class="text-sm font-semibold">Google Play</div>
				</div>
			</a>
			<a href="/download" class="inline-flex items-center gap-3 rounded-xl bg-black px-5 py-2.5 text-white transition-transform hover:-translate-y-0.5">
				<svg class="h-7 w-7" viewBox="0 0 24 24" fill="currentColor"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
				<div class="text-left">
					<div class="text-[10px] leading-tight text-gray-400">{$t('download.downloadOnThe')}</div>
					<div class="text-sm font-semibold">App Store</div>
				</div>
			</a>
		</div>
		<p class="mt-3 text-xs text-gray-400">{$t('download.storeNote')}</p>
	</div>
</section>

<!-- ━━━ FEATURES ━━━ -->
<section class="border-t border-gray-100 bg-white py-16 dark:border-gray-800 dark:bg-gray-900">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
		<div class="grid gap-8 md:grid-cols-3">
			{#each [
				{ icon: Zap, title: 'download.featureFast', desc: 'download.featureFastDesc' },
				{ icon: Shield, title: 'download.featureSecure', desc: 'download.featureSecureDesc' },
				{ icon: Star, title: 'download.featureRated', desc: 'download.featureRatedDesc' }
			] as feature}
				<div class="text-center">
					<div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10">
						<feature.icon class="h-6 w-6 text-brand" />
					</div>
					<h3 class="font-semibold text-gray-900 dark:text-white">{$t(feature.title)}</h3>
					<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{$t(feature.desc)}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ━━━ SYSTEM REQUIREMENTS ━━━ -->
<section class="border-t border-gray-100 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-800/50">
	<div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
		<h2 class="mb-8 text-center text-lg font-semibold text-gray-900 dark:text-white">{$t('download.sysReq')}</h2>
		<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
			{#each [
				{ platform: 'Android', reqs: ['Android 8.0 (Oreo) or later', '100 MB free storage', 'GPS & Internet connection'] },
				{ platform: 'iOS', reqs: ['iOS 16.0 or later', 'iPhone 8 or newer', 'GPS & Internet connection'] },
				{ platform: 'Desktop (Admin)', reqs: ['Windows 10+ / macOS 12+ / Ubuntu 20.04+', '200 MB free storage', 'Internet connection'] }
			] as req}
				<div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
					<h3 class="mb-3 font-semibold text-gray-900 dark:text-white">{req.platform}</h3>
					<ul class="space-y-1.5">
						{#each req.reqs as r}
							<li class="flex items-start gap-2 text-sm text-gray-500 dark:text-gray-400">
								<svg class="mt-0.5 h-4 w-4 shrink-0 text-brand" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" /></svg>
								{r}
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>
	</div>
</section>
