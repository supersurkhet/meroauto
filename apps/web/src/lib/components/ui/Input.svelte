<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		class: className,
		value = $bindable(''),
		variant = 'default',
		...rest
	}: HTMLInputAttributes & { variant?: 'default' | 'error'; value?: string } = $props();
</script>

<input
	bind:value
	class={cn(
		'flex h-10 w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-gray-700 dark:text-white',
		variant === 'error'
			? 'border-red-500 ring-2 ring-red-500/20 focus:border-red-500 focus:ring-red-500/20'
			: 'border-gray-300 focus:border-brand focus:ring-brand/20 dark:border-gray-600',
		className
	)}
	{...rest}
/>
