<script lang="ts">
	import '../app.css';
	import Navbar from '$components/Navbar.svelte';
	import Footer from '$components/Footer.svelte';
	import { theme } from '$lib/theme';
	import { browser } from '$app/environment';
	import { getConvexClient, setConvexAuth } from '$lib/convex';

	let { children, data } = $props();

	// Initialize Convex client and set auth token
	$effect(() => {
		if (browser) {
			document.documentElement.classList.toggle('dark', $theme === 'dark');

			// Initialize Convex
			getConvexClient();

			// Set auth token for Convex if available
			setConvexAuth(data.token);
		}
	});
</script>

<svelte:head>
	<meta name="description" content="MeroAuto - Affordable auto-rickshaw rides in Surkhet, Nepal. Book in seconds, ride with confidence." />
	<meta property="og:title" content="MeroAuto - Your Auto Rickshaw, One Tap Away" />
	<meta property="og:description" content="Affordable, safe, and reliable auto-rickshaw rides in Surkhet." />
	<meta property="og:type" content="website" />
	<meta name="twitter:card" content="summary_large_image" />
</svelte:head>

<div class="flex min-h-screen flex-col">
	<Navbar />
	<main class="flex-1 pt-16">
		{@render children()}
	</main>
	<Footer />
</div>
