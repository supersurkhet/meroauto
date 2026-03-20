<script lang="ts">
  import { cn } from "$lib/utils";
  import type { Snippet } from "svelte";
  import type { HTMLSelectAttributes } from "svelte/elements";

  let {
    class: className = "",
    value = $bindable(""),
    children,
    ...rest
  }: HTMLSelectAttributes & { class?: string; value?: string; children: Snippet } = $props();
</script>

<select
  class={cn(
    "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
    className
  )}
  bind:value
  {...rest}
>
  {@render children()}
</select>
