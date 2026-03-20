<script lang="ts">
	import { Users, Map, TrendingUp, Car, Activity } from 'lucide-svelte';

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
			{ label: 'Active Drivers', value: '0', icon: Car, color: 'text-brand bg-brand/10' },
			{ label: 'Rides Today', value: '0', icon: Map, color: 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' },
			{ label: 'Total Riders', value: '0', icon: Users, color: 'text-amber-600 bg-amber-50 dark:bg-amber-900/20' },
			{ label: 'Revenue (NPR)', value: '0', icon: TrendingUp, color: 'text-green-600 bg-green-50 dark:bg-green-900/20' }
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

	<!-- Recent Activity -->
	<div class="mt-8 rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
		<h2 class="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
			<Activity class="h-5 w-5 text-brand" />
			Recent Activity
		</h2>
		<div class="flex flex-col items-center justify-center py-8 text-center">
			<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
				<Activity class="h-6 w-6 text-gray-400" />
			</div>
			<p class="text-sm text-gray-500 dark:text-gray-400">No recent activity yet.</p>
			<p class="mt-1 text-xs text-gray-400">Data will appear here once rides start flowing through the system.</p>
		</div>
	</div>
</div>
