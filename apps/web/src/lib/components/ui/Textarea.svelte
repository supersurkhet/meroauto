<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLTextareaAttributes } from 'svelte/elements';

	let {
		class: className,
		value = $bindable(''),
		...rest
	}: HTMLTextareaAttributes & { value?: string } = $props();
</script>

<textarea
	bind:value
	class={cn(
		'flex min-h-[80px] w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-white',
		className
	)}
	{...rest}
></textarea>
