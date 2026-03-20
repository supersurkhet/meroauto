<script lang="ts">
	import { page } from '$app/stores';
	import { t, locale, type Locale } from '$i18n';
	import { theme } from '$lib/theme';
	import { Sun, Moon, Globe, Menu, X, Download } from 'lucide-svelte';

	let mobileOpen = $state(false);

	const links = [
		{ href: '/', key: 'nav.home' },
		{ href: '/pricing', key: 'nav.pricing' },
		{ href: '/safety', key: 'nav.safety' },
		{ href: '/coverage', key: 'nav.coverage' },
		{ href: '/about', key: 'nav.about' },
		{ href: '/contact', key: 'nav.contact' }
	];

	function toggleLocale() {
		locale.update((l) => (l === 'en' ? 'ne' : 'en'));
	}
</script>

<nav class="fixed top-0 right-0 left-0 z-50 border-b border-gray-200 bg-white/80 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<a href="/" class="flex items-center gap-2">
			<div class="flex h-9 w-9 items-center justify-center rounded-xl bg-brand font-bold text-white">म</div>
			<span class="text-xl font-bold text-gray-900 dark:text-white">MeroAuto</span>
		</a>

		<div class="hidden items-center gap-1 md:flex">
			{#each links as link}
				<a
					href={link.href}
					class="rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.url.pathname === link.href
						? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-light'
						: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white'}"
				>
					{$t(link.key)}
				</a>
			{/each}
		</div>

		<div class="flex items-center gap-2">
			<button onclick={toggleLocale} class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" aria-label="Toggle language">
				<Globe class="h-5 w-5" />
			</button>
			<button onclick={() => theme.toggle()} class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800" aria-label="Toggle theme">
				{#if $theme === 'dark'}
					<Sun class="h-5 w-5" />
				{:else}
					<Moon class="h-5 w-5" />
				{/if}
			</button>
			<a href="/download" class="hidden items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark sm:inline-flex">
				<Download class="h-4 w-4" />
				{$t('nav.download')}
			</a>
			<button onclick={() => (mobileOpen = !mobileOpen)} class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-gray-800" aria-label="Menu">
				{#if mobileOpen}
					<X class="h-5 w-5" />
				{:else}
					<Menu class="h-5 w-5" />
				{/if}
			</button>
		</div>
	</div>

	{#if mobileOpen}
		<div class="border-t border-gray-200 bg-white px-4 py-3 md:hidden dark:border-gray-800 dark:bg-gray-900">
			{#each links as link}
				<a
					href={link.href}
					onclick={() => (mobileOpen = false)}
					class="block rounded-lg px-3 py-2 text-base font-medium {$page.url.pathname === link.href
						? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-light'
						: 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'}"
				>
					{$t(link.key)}
				</a>
			{/each}
			<a href="/download" onclick={() => (mobileOpen = false)} class="mt-2 block rounded-lg bg-brand px-3 py-2 text-center text-base font-semibold text-white hover:bg-brand-dark">
				{$t('nav.download')}
			</a>
		</div>
	{/if}
</nav>
