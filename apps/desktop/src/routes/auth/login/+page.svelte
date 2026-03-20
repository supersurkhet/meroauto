<script lang="ts">
  import { signIn, authLoading } from "$lib/stores/auth";

  let loginError = $state("");

  function handleLogin() {
    try {
      signIn();
    } catch (e: unknown) {
      loginError = e instanceof Error ? e.message : "Login failed";
    }
  }
</script>

<div class="flex h-screen items-center justify-center bg-background">
  <div class="w-full max-w-sm rounded-xl border bg-card p-8 shadow-lg text-center">
    <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold text-xl mx-auto mb-4">
      M
    </div>
    <h1 class="text-xl font-bold">MeroAuto Admin</h1>
    <p class="text-sm text-muted-foreground mt-1 mb-6">Sign in to manage your fleet</p>

    {#if loginError}
      <div class="rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive mb-4">
        {loginError}
      </div>
    {/if}

    <button
      onclick={handleLogin}
      disabled={$authLoading}
      class="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
    >
      {$authLoading ? "Signing in..." : "Sign in with WorkOS"}
    </button>

    <p class="text-xs text-muted-foreground mt-4">Admin access only. Contact your administrator for access.</p>
  </div>
</div>
