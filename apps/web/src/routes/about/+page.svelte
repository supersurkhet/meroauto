<script lang="ts">
	import { t } from '$i18n';
	import { Heart, Shield, Users, MapPin } from 'lucide-svelte';
</script>

<svelte:head>
	<title>About Us - MeroAuto</title>
	<meta name="description" content="Learn about MeroAuto's mission to transform auto-rickshaw transportation in Nepal." />
</svelte:head>

<section class="bg-gradient-to-b from-brand-50 to-white py-20 dark:from-gray-900 dark:to-gray-900">
	<div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
		<div class="mx-auto max-w-3xl text-center">
			<h1 class="text-4xl font-bold text-gray-900 sm:text-5xl dark:text-white">{$t('about.title')}</h1>
			<p class="mt-3 text-lg text-gray-500 dark:text-gray-400">{$t('about.subtitle')}</p>
		</div>

		<!-- Mission -->
		<div class="mt-16 rounded-2xl border border-brand-200 bg-brand-50 p-8 sm:p-12 dark:border-brand-800 dark:bg-brand-900/20">
			<h2 class="text-2xl font-bold text-brand-800 dark:text-brand-light">{$t('about.mission')}</h2>
			<p class="mt-4 text-lg leading-relaxed text-brand-700 dark:text-brand-200">{$t('about.missionText')}</p>
		</div>

		<!-- Story -->
		<div class="mt-16 grid items-center gap-12 lg:grid-cols-2">
			<div>
				<h2 class="text-3xl font-bold text-gray-900 dark:text-white">{$t('about.story')}</h2>
				<p class="mt-4 leading-relaxed text-gray-600 dark:text-gray-300">{$t('about.storyText')}</p>
				<p class="mt-4 leading-relaxed text-gray-600 dark:text-gray-300">
					Starting from Surkhet, we're building a platform that respects the existing auto-rickshaw ecosystem while adding technology that benefits both riders and drivers. Fair pricing, transparent operations, and community trust are at our core.
				</p>
			</div>
			<div class="grid grid-cols-2 gap-4">
				{#each [
					{ value: '2026', label: 'Founded' },
					{ value: 'Surkhet', label: 'Headquarters' },
					{ value: '200+', label: 'Drivers' },
					{ value: '5,000+', label: 'Happy Riders' }
				] as stat}
					<div class="rounded-xl border border-gray-200 bg-white p-6 text-center dark:border-gray-700 dark:bg-gray-800">
						<p class="text-2xl font-bold text-brand">{stat.value}</p>
						<p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
					</div>
				{/each}
			</div>
		</div>

		<!-- Values -->
		<div class="mt-20">
			<h2 class="mb-10 text-center text-2xl font-bold text-gray-900 dark:text-white">{$t('about.values')}</h2>
			<div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
				{#each [
					{ icon: Shield, title: 'about.value1', desc: 'Every decision starts with rider and driver safety.', color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20' },
					{ icon: Heart, title: 'about.value2', desc: 'Transparent pricing that is fair to both riders and drivers.', color: 'text-red-500 bg-red-50 dark:bg-red-900/20' },
					{ icon: Users, title: 'about.value3', desc: 'Built for and with the Surkhet community.', color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
					{ icon: MapPin, title: 'about.value4', desc: 'Designed for Nepal, not a copy of foreign apps.', color: 'text-brand bg-brand-50 dark:bg-brand-900/20' }
				] as value}
					<div class="rounded-xl border border-gray-100 bg-white p-6 dark:border-gray-800 dark:bg-gray-800">
						<div class="mb-3 flex h-12 w-12 items-center justify-center rounded-xl {value.color}">
							<value.icon class="h-6 w-6" />
						</div>
						<h3 class="font-semibold text-gray-900 dark:text-white">{$t(value.title)}</h3>
						<p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{value.desc}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>
