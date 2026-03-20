<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
  let error = $state<Error | null>(null);

  function handleError(e: unknown) {
    error = e instanceof Error ? e : new Error(String(e));
  }

  function reset() {
    error = null;
  }
</script>

<svelte:boundary onerror={handleError}>
  {#if error}
    <div class="flex flex-col items-center justify-center py-16 text-center">
      <div class="rounded-xl border border-destructive/20 bg-destructive/5 p-6 max-w-md">
        <h2 class="text-lg font-semibold text-destructive mb-2">Something went wrong</h2>
        <p class="text-sm text-muted-foreground mb-4">{error.message}</p>
        <button
          onclick={reset}
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >Try Again</button>
      </div>
    </div>
  {:else}
    {@render children()}
  {/if}
</svelte:boundary>
