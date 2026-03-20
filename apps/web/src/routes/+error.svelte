<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowLeft, Home, AlertTriangle } from 'lucide-svelte';
</script>

<svelte:head>
	<title>Error {$page.status} - MeroAuto</title>
</svelte:head>

<section class="flex min-h-[60vh] items-center justify-center px-4">
	<div class="text-center">
		<div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-red-50 dark:bg-red-900/20">
			<AlertTriangle class="h-10 w-10 text-red-500" />
		</div>

		<h1 class="text-6xl font-extrabold text-gray-900 dark:text-white">{$page.status}</h1>

		<p class="mt-3 text-xl text-gray-600 dark:text-gray-300">
			{#if $page.status === 404}
				This page doesn't exist — maybe it took an auto somewhere else.
			{:else}
				Something went wrong. Our team has been notified.
			{/if}
		</p>

		{#if $page.error?.message}
			<p class="mt-2 text-sm text-gray-400">{$page.error.message}</p>
		{/if}

		<div class="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
			<a href="/" class="inline-flex items-center gap-2 rounded-xl bg-brand px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-dark">
				<Home class="h-4 w-4" />
				Back to Home
			</a>
			<button onclick={() => history.back()} class="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300">
				<ArrowLeft class="h-4 w-4" />
				Go Back
			</button>
		</div>
	</div>
</section>
