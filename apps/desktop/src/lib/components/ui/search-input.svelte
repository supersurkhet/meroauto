<script lang="ts">
  import { cn } from "$lib/utils";

  let {
    class: className = "",
    value = $bindable(""),
    placeholder = "Search...",
  }: { class?: string; value?: string; placeholder?: string } = $props();
</script>

<div class={cn("relative", className)}>
  <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
  <input
    type="text"
    {placeholder}
    bind:value
    class="flex h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
  />
</div>
