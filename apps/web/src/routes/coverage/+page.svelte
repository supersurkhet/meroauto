<script lang="ts">
	import { t } from '$i18n';
	import { MapPin, Clock, CheckCircle, Navigation, Layers } from 'lucide-svelte';
	import { browser } from '$app/environment';
	import { surkhetLocations, surkhetZones } from '$lib/locations';

	let selectedLocation = $state<(typeof surkhetLocations)[number] | null>(null);
	let showZones = $state(true);

	const activeLocations = surkhetLocations.filter((l) => l.type !== 'coming-soon');
	const comingSoonLocations = surkhetLocations.filter((l) => l.type === 'coming-soon');

	const upcomingCities = [
		{ city: 'Nepalgunj', eta: 'Q3 2026', riders: '15,000+ potential riders' },
		{ city: 'Butwal', eta: 'Q4 2026', riders: '20,000+ potential riders' },
		{ city: 'Dhangadhi', eta: 'Q1 2027', riders: '12,000+ potential riders' },
		{ city: 'Pokhara', eta: 'Q2 2027', riders: '50,000+ potential riders' }
	];
</script>

<svelte:head>
	<title>Coverage Map - MeroAuto | Service Areas in Surkhet</title>
	<meta name="description" content="Interactive coverage map showing MeroAuto's service areas in Surkhet Valley. Check if we operate in your area." />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "Service",
			"name": "MeroAuto Ride Service",
			"areaServed": {
				"@type": "City",
				"name": "Surkhet",
				"geo": {
					"@type": "GeoCoordinates",
					"latitude": "28.6083",
					"longitude": "81.6368"
				}
			},
			"provider": {
				"@type": "Organization",
				"name": "MeroAuto"
			}
		}
	</script>
</svelte:head>

<section class="bg-gradient-to-b from-brand-50 to-white dark:from-gray-900 dark:to-gray-900">
	<div class="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">{$t('coverage.title')}</h1>
			<p class="mt-3 text-lg text-gray-500 dark:text-gray-400">{$t('coverage.subtitle')}</p>
		</div>

		<!-- Map Controls -->
		<div class="mt-8 flex flex-wrap items-center justify-between gap-4">
			<div class="flex items-center gap-4">
				<div class="flex items-center gap-2">
					<span class="flex h-3 w-3 rounded-full bg-brand"></span>
					<span class="text-sm text-gray-600 dark:text-gray-400">Main Hub</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="flex h-3 w-3 rounded-full bg-blue-500"></span>
					<span class="text-sm text-gray-600 dark:text-gray-400">Active Zone</span>
				</div>
				<div class="flex items-center gap-2">
					<span class="flex h-3 w-3 rounded-full bg-amber-500"></span>
					<span class="text-sm text-gray-600 dark:text-gray-400">Coming Soon</span>
				</div>
			</div>
			<button
				onclick={() => (showZones = !showZones)}
				class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
			>
				<Layers class="h-4 w-4" />
				{showZones ? 'Hide' : 'Show'} Zones
			</button>
		</div>

		<!-- Interactive Leaflet Map -->
		<div class="mt-4 overflow-hidden rounded-2xl border border-gray-200 shadow-lg dark:border-gray-700">
			{#if browser}
				{#await import('$components/LeafletMap.svelte') then LeafletMap}
					<LeafletMap.default
						zones={showZones ? surkhetZones : []}
						locations={surkhetLocations.map(l => ({ ...l, coords: [...l.coords] as [number, number] }))}
						center={[28.6083, 81.6368]}
						zoom={13}
						height="520px"
						onLocationClick={(loc) => { selectedLocation = loc as typeof selectedLocation; }}
					/>
				{/await}
			{:else}
				<div class="flex h-[520px] items-center justify-center bg-gray-100 dark:bg-gray-800">
					<p class="text-gray-500">Loading map...</p>
				</div>
			{/if}
		</div>

		<!-- Selected Location Detail -->
		{#if selectedLocation}
			<div class="mt-4 rounded-xl border border-brand-200 bg-brand-50 p-4 dark:border-brand-800 dark:bg-brand-900/20">
				<div class="flex items-start justify-between">
					<div>
						<div class="flex items-center gap-2">
							<Navigation class="h-5 w-5 text-brand" />
							<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{selectedLocation.name}</h3>
						</div>
						{#if selectedLocation.description}
							<p class="mt-1 text-sm text-gray-600 dark:text-gray-300">{selectedLocation.description}</p>
						{/if}
					</div>
					<span class="rounded-full px-3 py-1 text-xs font-medium {selectedLocation.type === 'hub' ? 'bg-brand-100 text-brand-800' : selectedLocation.type === 'active' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}">
						{selectedLocation.type === 'hub' ? 'Main Hub' : selectedLocation.type === 'active' ? 'Active' : 'Coming Soon'}
					</span>
				</div>
			</div>
		{/if}

		<!-- Active & Coming Soon Grid -->
		<div class="mt-12 grid gap-8 md:grid-cols-2">
			<div>
				<h2 class="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
					<CheckCircle class="h-6 w-6 text-brand" />
					{$t('coverage.currentZones')}
					<span class="ml-2 rounded-full bg-brand-50 px-2 py-0.5 text-sm font-normal text-brand-700 dark:bg-brand-900/30 dark:text-brand-light">{activeLocations.length} areas</span>
				</h2>
				<div class="space-y-3">
					{#each activeLocations as loc}
						<button
							onclick={() => { selectedLocation = loc; }}
							class="flex w-full items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-brand hover:shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand {selectedLocation?.name === loc.name ? 'border-brand ring-2 ring-brand/20' : ''}"
						>
							<div class="h-2.5 w-2.5 rounded-full {loc.type === 'hub' ? 'bg-brand' : 'bg-blue-500'}"></div>
							<div class="flex-1">
								<span class="font-medium text-gray-700 dark:text-gray-300">{loc.name}</span>
								{#if loc.description}
									<p class="text-xs text-gray-400">{loc.description}</p>
								{/if}
							</div>
							{#if loc.type === 'hub'}
								<span class="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/30 dark:text-brand-light">Hub</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<h2 class="mb-6 flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
					<Clock class="h-6 w-6 text-amber-500" />
					{$t('coverage.comingSoon')}
				</h2>

				<!-- Expansion within Surkhet -->
				{#if comingSoonLocations.length > 0}
					<div class="mb-6">
						<h3 class="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">SURKHET EXPANSION</h3>
						<div class="space-y-3">
							{#each comingSoonLocations as loc}
								<div class="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
									<div class="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
									<div class="flex-1">
										<span class="font-medium text-gray-700 dark:text-gray-300">{loc.name}</span>
										{#if loc.description}
											<p class="text-xs text-gray-400">{loc.description}</p>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- New Cities -->
				<h3 class="mb-3 text-sm font-semibold text-gray-500 dark:text-gray-400">NEW CITIES</h3>
				<div class="space-y-3">
					{#each upcomingCities as upcoming}
						<div class="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
							<div class="flex items-center gap-3">
								<div class="h-2.5 w-2.5 rounded-full bg-amber-400"></div>
								<div>
									<span class="font-medium text-gray-700 dark:text-gray-300">{upcoming.city}</span>
									<p class="text-xs text-gray-400">{upcoming.riders}</p>
								</div>
							</div>
							<span class="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{upcoming.eta}</span>
						</div>
					{/each}
				</div>

				<div class="mt-6 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center dark:border-gray-600 dark:bg-gray-800/50">
					<MapPin class="mx-auto mb-2 h-8 w-8 text-gray-400" />
					<p class="font-medium text-gray-700 dark:text-gray-300">{$t('coverage.requestCity')}</p>
					<p class="mt-1 text-sm text-gray-400">Tell us where you want MeroAuto next</p>
					<a href="/contact" class="mt-3 inline-flex rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
						Request Now
					</a>
				</div>
			</div>
		</div>
	</div>
</section>
