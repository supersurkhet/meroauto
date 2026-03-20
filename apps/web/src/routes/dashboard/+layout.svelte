<script lang="ts">
	import { t } from '$i18n';
	import { LayoutDashboard, Users, Map, Settings, LogOut, ChevronRight } from 'lucide-svelte';
	import { page } from '$app/stores';

	let { children, data } = $props();

	const user = data.user!; // Guaranteed by hooks.server.ts guard

	const navItems = [
		{ href: '/dashboard', label: 'Overview', icon: LayoutDashboard },
		{ href: '/dashboard/drivers', label: 'Drivers', icon: Users },
		{ href: '/dashboard/rides', label: 'Rides', icon: Map },
		{ href: '/dashboard/settings', label: 'Settings', icon: Settings }
	];
</script>

<div class="flex min-h-[calc(100vh-4rem)]">
	<!-- Sidebar -->
	<aside class="hidden w-64 shrink-0 border-r border-gray-200 bg-gray-50 lg:block dark:border-gray-800 dark:bg-gray-900">
		<div class="flex h-full flex-col">
			<!-- User info -->
			<div class="border-b border-gray-200 px-4 py-5 dark:border-gray-800">
				<div class="flex items-center gap-3">
					{#if user.profilePictureUrl}
						<img src={user.profilePictureUrl} alt="" class="h-9 w-9 rounded-full" />
					{:else}
						<div class="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">
							{(user.firstName?.[0] || user.email[0]).toUpperCase()}
						</div>
					{/if}
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-semibold text-gray-900 dark:text-white">
							{user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.email}
						</p>
						<p class="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
					</div>
				</div>
			</div>

			<!-- Nav -->
			<nav class="flex-1 space-y-1 px-3 py-4">
				{#each navItems as item}
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors {$page.url.pathname === item.href
							? 'bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-light'
							: 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'}"
					>
						<item.icon class="h-4 w-4" />
						{item.label}
					</a>
				{/each}
			</nav>

			<!-- Logout -->
			<div class="border-t border-gray-200 px-3 py-3 dark:border-gray-800">
				<a href="/auth/logout" class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
					<LogOut class="h-4 w-4" />
					Sign out
				</a>
			</div>
		</div>
	</aside>

	<!-- Main content -->
	<div class="flex-1">
		{@render children()}
	</div>
</div>
