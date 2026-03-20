<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { page } from "$app/stores";
  import { handleAuthCallback, authLoading } from "$lib/stores/auth";

  onMount(async () => {
    const token = $page.url.searchParams.get("token") ?? $page.url.hash?.replace("#token=", "");
    if (token) {
      await handleAuthCallback(token);
      goto("/");
    } else {
      // No token — redirect to login
      goto("/auth/login");
    }
  });
</script>

<div class="flex h-screen items-center justify-center">
  {#if $authLoading}
    <div class="text-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
      <p class="mt-4 text-sm text-muted-foreground">Authenticating...</p>
    </div>
  {:else}
    <p class="text-sm text-muted-foreground">Redirecting...</p>
  {/if}
</div>
