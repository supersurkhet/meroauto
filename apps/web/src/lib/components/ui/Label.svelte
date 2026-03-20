<script lang="ts">
	import { cn } from '$lib/utils';
	import type { HTMLLabelAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	let {
		class: className,
		children,
		...rest
	}: HTMLLabelAttributes & { children: Snippet } = $props();
</script>

<label
	class={cn(
		'mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300',
		className
	)}
	{...rest}
>
	{@render children()}
</label>
