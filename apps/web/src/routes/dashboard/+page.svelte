<script lang="ts">
	import { Users, Map, TrendingUp, Car } from 'lucide-svelte';

	let { data } = $props();
	const user = data.user!;
</script>

<svelte:head>
	<title>Dashboard - MeroAuto</title>
</svelte:head>

<div class="p-6 lg:p-8">
	<div class="mb-8">
		<h1 class="text-2xl font-bold text-gray-900 dark:text-white">
			Welcome back, {user.firstName || 'Admin'}
		</h1>
		<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">Here's what's happening with MeroAuto today.</p>
	</div>

	<!-- Stats Grid -->
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each [
			{ label: 'Active Drivers', value: '—', icon: Car, color: 'text-brand bg-brand/10' },
			{ label: 'Rides Today', value: '—', icon: Map, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
			{ label: 'Total Riders', value: '—', icon: Users, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
			{ label: 'Revenue (NPR)', value: '—', icon: TrendingUp, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' }
		] as stat}
			<div class="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
				<div class="flex items-center justify-between">
					<div>
						<p class="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
						<p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
					</div>
					<div class="flex h-10 w-10 items-center justify-center rounded-xl {stat.color}">
						<stat.icon class="h-5 w-5" />
					</div>
				</div>
			</div>
		{/each}
	</div>

	<!-- Placeholder -->
	<div class="mt-8 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center dark:border-gray-700 dark:bg-gray-800/50">
		<p class="text-gray-500 dark:text-gray-400">Connect Convex backend to populate live data.</p>
		<p class="mt-1 text-sm text-gray-400">Convex auth token is {data.token ? 'available' : 'not set'} for this session.</p>
	</div>
</div>
