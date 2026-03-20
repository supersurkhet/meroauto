<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLSelectAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		value = $bindable(''),
		children,
		...rest
	}: HTMLSelectAttributes & { children: Snippet; value?: string | number | null } = $props();
</script>

<select
	bind:value
	class={cn(
		'flex h-10 w-full appearance-none rounded-xl border border-gray-300 bg-white px-4 py-2.5 pr-8 text-sm text-gray-900 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
		className
	)}
	{...rest}
>
	{@render children()}
</select>
