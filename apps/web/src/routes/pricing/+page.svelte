<script lang="ts">
	import { t } from '$i18n';
	import { Calculator, MapPin, ArrowRight, Info, TrendingDown } from 'lucide-svelte';
	import { surkhetLocations, haversineDistance, estimateRoadDistance, calculateFare, getZone } from '$lib/locations';

	const selectableLocations = surkhetLocations.filter((l) => l.type !== 'coming-soon');

	let fromIndex = $state<number | null>(null);
	let toIndex = $state<number | null>(null);
	let fareResult = $state<ReturnType<typeof calculateFare> | null>(null);
	let routeDistance = $state<number | null>(null);
	let routeZone = $state<'A' | 'B' | 'C'>('A');
	let calculating = $state(false);

	const zones = [
		{ name: 'pricing.zoneA', baseFare: 50, perKm: 25, description: 'Birendranagar Municipality core area', radius: '0-1.5 km from center', color: 'border-brand' },
		{ name: 'pricing.zoneB', baseFare: 60, perKm: 30, description: 'Extended Birendranagar area', radius: '1.5-3 km from center', color: 'border-blue-500' },
		{ name: 'pricing.zoneC', baseFare: 80, perKm: 35, description: 'Greater Surkhet Valley', radius: '3-5.5 km from center', color: 'border-amber-500' }
	];

	const popularRoutes = [
		{ from: 'Mangalgadhi', to: 'Birendranagar Chowk', distance: 2.4, fare: 85 },
		{ from: 'Airport Road', to: 'Itram', distance: 3.8, fare: 130 },
		{ from: 'Latikoili', to: 'Birendranagar Chowk', distance: 3.1, fare: 103 },
		{ from: 'Ghatgau', to: 'Birendranagar Chowk', distance: 3.0, fare: 100 },
		{ from: 'Mehelkuna', to: 'Maintada', distance: 5.8, fare: 224 },
		{ from: 'Mangalgadhi', to: 'Airport Road', distance: 4.5, fare: 155 }
	];

	const surcharges = [
		{ condition: 'Night (10 PM - 6 AM)', multiplier: '1.25x', icon: '🌙' },
		{ condition: 'Rain / Bad Weather', multiplier: '1.15x', icon: '🌧️' },
		{ condition: 'Festival / High Demand', multiplier: '1.2x', icon: '🎉' },
		{ condition: 'Extra Passenger (4+)', multiplier: '+NPR 20', icon: '👥' }
	];

	function doCalculate() {
		if (fromIndex === null || toIndex === null || fromIndex === toIndex) return;

		calculating = true;

		// Simulate brief calculation time for UX
		setTimeout(() => {
			const from = selectableLocations[fromIndex!];
			const to = selectableLocations[toIndex!];

			const straightLine = haversineDistance(from.coords[0], from.coords[1], to.coords[0], to.coords[1]);
			const roadDist = estimateRoadDistance(straightLine);
			routeDistance = Math.round(roadDist * 10) / 10;

			// Determine zone based on midpoint distance from center
			const midLat = (from.coords[0] + to.coords[0]) / 2;
			const midLon = (from.coords[1] + to.coords[1]) / 2;
			const centerDist = haversineDistance(midLat, midLon, 28.6083, 81.6368);
			routeZone = getZone(centerDist);

			fareResult = calculateFare(routeDistance, routeZone);
			calculating = false;
		}, 400);
	}

	function swapLocations() {
		const temp = fromIndex;
		fromIndex = toIndex;
		toIndex = temp;
		if (fromIndex !== null && toIndex !== null) doCalculate();
	}
</script>

<svelte:head>
	<title>Pricing & Fare Calculator - MeroAuto</title>
	<meta name="description" content="MeroAuto fare rates and pricing calculator. Transparent pricing for auto-rickshaw rides in Surkhet with distance-based estimation." />
	<script type="application/ld+json">
		{
			"@context": "https://schema.org",
			"@type": "PriceSpecification",
			"name": "MeroAuto Ride Pricing",
			"priceCurrency": "NPR",
			"price": "50",
			"description": "Base fare starting at NPR 50 with first 1 km included. Per km rate: NPR 25-35 depending on zone."
		}
	</script>
</svelte:head>

<section class="bg-gradient-to-b from-brand-50 to-white py-20 dark:from-gray-900 dark:to-gray-900">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="text-center">
			<h1 class="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">{$t('pricing.title')}</h1>
			<p class="mt-3 text-lg text-gray-500 dark:text-gray-400">{$t('pricing.subtitle')}</p>
		</div>

		<!-- Base Rates -->
		<div class="mt-16 grid gap-6 md:grid-cols-3">
			{#each [
				{ label: 'pricing.baseFare', value: 'NPR 50', desc: 'First 1 km included', icon: '🚩' },
				{ label: 'pricing.perKm', value: 'NPR 25-35', desc: 'Varies by zone', icon: '📏' },
				{ label: 'pricing.waitingCharge', value: 'NPR 3/min', desc: 'After 3 min free wait', icon: '⏱️' }
			] as rate}
				<div class="rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800">
					<span class="text-3xl">{rate.icon}</span>
					<h3 class="mt-3 text-sm font-semibold text-gray-500 dark:text-gray-400">{$t(rate.label)}</h3>
					<p class="mt-1 text-3xl font-bold text-gray-900 dark:text-white">{rate.value}</p>
					<p class="mt-1 text-sm text-gray-400">{rate.desc}</p>
				</div>
			{/each}
		</div>

		<!-- Enhanced Fare Calculator -->
		<div class="mt-16 rounded-2xl border border-gray-200 bg-white p-8 shadow-lg dark:border-gray-700 dark:bg-gray-800">
			<div class="mb-6 flex items-center gap-3">
				<Calculator class="h-6 w-6 text-brand" />
				<h2 class="text-2xl font-bold text-gray-900 dark:text-white">{$t('pricing.calculate')}</h2>
			</div>

			<div class="grid gap-4 sm:grid-cols-[1fr_auto_1fr]">
				<div>
					<label for="from" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{$t('pricing.from')}</label>
					<div class="relative">
						<MapPin class="pointer-events-none absolute top-3 left-3 h-5 w-5 text-brand" />
						<select id="from" bind:value={fromIndex} onchange={doCalculate} class="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pr-4 pl-10 text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
							<option value={null} disabled selected>Select pickup</option>
							{#each selectableLocations as loc, i}
								<option value={i} disabled={i === toIndex}>{loc.name}</option>
							{/each}
						</select>
					</div>
				</div>

				<div class="flex items-end justify-center pb-1">
					<button onclick={swapLocations} class="rounded-full border border-gray-300 p-2 text-gray-400 transition-colors hover:border-brand hover:text-brand dark:border-gray-600" aria-label="Swap locations">
						<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
							<path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
						</svg>
					</button>
				</div>

				<div>
					<label for="to" class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">{$t('pricing.to')}</label>
					<div class="relative">
						<MapPin class="pointer-events-none absolute top-3 left-3 h-5 w-5 text-red-500" />
						<select id="to" bind:value={toIndex} onchange={doCalculate} class="w-full appearance-none rounded-xl border border-gray-300 bg-white py-2.5 pr-4 pl-10 text-gray-900 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-gray-600 dark:bg-gray-700 dark:text-white">
							<option value={null} disabled selected>Select destination</option>
							{#each selectableLocations as loc, i}
								<option value={i} disabled={i === fromIndex}>{loc.name}</option>
							{/each}
						</select>
					</div>
				</div>
			</div>

			<!-- Result -->
			{#if calculating}
				<div class="mt-6 flex items-center justify-center gap-3 rounded-xl bg-gray-50 p-6 dark:bg-gray-700/50">
					<div class="h-5 w-5 animate-spin rounded-full border-2 border-brand border-t-transparent"></div>
					<span class="text-gray-500">Calculating route...</span>
				</div>
			{:else if fareResult && routeDistance}
				<div class="mt-6 rounded-xl bg-gradient-to-r from-brand-50 to-emerald-50 p-6 dark:from-brand-900/20 dark:to-emerald-900/20">
					<div class="grid gap-6 sm:grid-cols-[2fr_1fr]">
						<div>
							<p class="text-sm font-medium text-gray-500 dark:text-gray-400">{$t('pricing.estimatedFare')}</p>
							<p class="mt-1 text-4xl font-bold text-brand">NPR {fareResult.total}</p>
							<div class="mt-3 space-y-1.5">
								<div class="flex items-center justify-between text-sm">
									<span class="text-gray-500">Base fare</span>
									<span class="font-medium text-gray-700 dark:text-gray-300">NPR {fareResult.baseFare}</span>
								</div>
								<div class="flex items-center justify-between text-sm">
									<span class="text-gray-500">Distance ({routeDistance} km × NPR {fareResult.perKm}/km)</span>
									<span class="font-medium text-gray-700 dark:text-gray-300">NPR {fareResult.distanceFare}</span>
								</div>
								<div class="border-t border-brand-200 pt-1.5 dark:border-brand-700">
									<div class="flex items-center justify-between text-sm">
										<span class="text-gray-500">Zone</span>
										<span class="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-900/40 dark:text-brand-light">Zone {routeZone}</span>
									</div>
								</div>
							</div>
						</div>
						<div class="flex flex-col items-center justify-center rounded-xl bg-white/60 p-4 dark:bg-gray-800/40">
							<p class="text-xs text-gray-400">Distance</p>
							<p class="text-2xl font-bold text-gray-900 dark:text-white">{routeDistance} km</p>
							<p class="text-xs text-gray-400">~{Math.ceil(routeDistance * 2.5)} min ride</p>
						</div>
					</div>
					<div class="mt-3 flex items-start gap-2 text-xs text-gray-400">
						<Info class="mt-0.5 h-3 w-3 shrink-0" />
						<span>Estimate based on road distance. Actual fare may vary by traffic, waiting time, and surcharges. First 1 km included in base fare.</span>
					</div>
				</div>
			{/if}
		</div>

		<!-- Surcharges -->
		<div class="mt-10 rounded-2xl border border-amber-200 bg-amber-50/50 p-6 dark:border-amber-800/50 dark:bg-amber-900/10">
			<h3 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
				<TrendingDown class="h-5 w-5 text-amber-500" />
				Surcharges & Discounts
			</h3>
			<div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
				{#each surcharges as s}
					<div class="flex items-center gap-3 rounded-lg bg-white px-4 py-3 dark:bg-gray-800">
						<span class="text-xl">{s.icon}</span>
						<div>
							<p class="text-sm font-medium text-gray-700 dark:text-gray-300">{s.condition}</p>
							<p class="text-sm font-bold text-amber-600">{s.multiplier}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Popular Routes -->
		<div class="mt-16">
			<h2 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">Popular Routes</h2>
			<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				{#each popularRoutes as route}
					<div class="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
						<div class="flex items-center gap-3">
							<div class="flex flex-col items-center">
								<div class="h-3 w-3 rounded-full border-2 border-brand bg-brand-50"></div>
								<div class="h-6 w-0.5 bg-gray-300 dark:bg-gray-600"></div>
								<div class="h-3 w-3 rounded-full border-2 border-red-500 bg-red-50"></div>
							</div>
							<div>
								<p class="text-sm font-medium text-gray-900 dark:text-white">{route.from}</p>
								<p class="text-sm text-gray-500">{route.to}</p>
							</div>
						</div>
						<div class="text-right">
							<p class="text-lg font-bold text-brand">NPR {route.fare}</p>
							<p class="text-xs text-gray-400">{route.distance} km</p>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Zone Pricing -->
		<div class="mt-16">
			<h2 class="mb-6 text-2xl font-bold text-gray-900 dark:text-white">{$t('pricing.zones')}</h2>
			<div class="grid gap-6 md:grid-cols-3">
				{#each zones as zone, i}
					<div class="rounded-2xl border-2 {zone.color} bg-white p-6 dark:bg-gray-800">
						{#if i === 0}
							<span class="mb-2 inline-block rounded-full bg-brand px-3 py-0.5 text-xs font-medium text-white">Most Popular</span>
						{/if}
						<h3 class="text-lg font-semibold text-gray-900 dark:text-white">{$t(zone.name)}</h3>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{zone.description}</p>
						<p class="mt-1 text-xs text-gray-400">{zone.radius}</p>
						<div class="mt-4 space-y-2">
							<div class="flex justify-between">
								<span class="text-sm text-gray-500">{$t('pricing.baseFare')}</span>
								<span class="font-semibold text-gray-900 dark:text-white">NPR {zone.baseFare}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-sm text-gray-500">{$t('pricing.perKm')}</span>
								<span class="font-semibold text-gray-900 dark:text-white">NPR {zone.perKm}/km</span>
							</div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
