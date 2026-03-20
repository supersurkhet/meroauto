<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLInputAttributes } from 'svelte/elements';

	let {
		class: className,
		checked = $bindable(false),
		...rest
	}: Omit<HTMLInputAttributes, 'type'> & { checked?: boolean } = $props();
</script>

<input
	type="checkbox"
	bind:checked
	class={cn(
		'h-4 w-4 rounded border-gray-300 text-brand transition-colors focus:ring-2 focus:ring-brand/20 dark:border-gray-600',
		className
	)}
	{...rest}
/>
