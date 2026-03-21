<script lang="ts">
  import "../app.css";
  import { onMount } from "svelte";
  import { page } from "$app/stores";
  import { goto } from "$app/navigation";
  import { t, locale } from "$lib/i18n";
  import { cn } from "$lib/utils";
  import ErrorBoundary from "$lib/components/error-boundary.svelte";
  import { currentUser, isAuthenticated, authLoading, fetchUser, signOut } from "$lib/stores/auth";
  import { USE_CONVEX } from "$lib/convex";

  const THEME_STORAGE_KEY = "desktop-theme";

  let { children } = $props();

  let sidebarCollapsed = $state(false);
  let darkMode = $state(false);
  let themeReady = $state(false);

  function applyTheme(isDark: boolean) {
    document.documentElement.classList.toggle("dark", isDark);
    document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  }

  // Auth check on mount
  onMount(async () => {
    const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    darkMode = savedTheme ? savedTheme === "dark" : prefersDark;
    applyTheme(darkMode);
    themeReady = true;

    if (USE_CONVEX) {
      await fetchUser();
    } else {
      // No Convex = dev mode, auto-authenticate
      isAuthenticated.set(true);
      authLoading.set(false);
    }
  });

  $effect(() => {
    if (!themeReady) return;
    applyTheme(darkMode);
    localStorage.setItem(THEME_STORAGE_KEY, darkMode ? "dark" : "light");
  });

  // Auth gate: redirect to login if not authenticated (skip auth routes)
  const isAuthRoute = $derived($page.url.pathname.startsWith("/auth"));
  $effect(() => {
    if (!$authLoading && !$isAuthenticated && !isAuthRoute) {
      goto("/auth/login");
    }
  });

  function toggleDark() {
    darkMode = !darkMode;
  }

  function toggleLocale() {
    locale.update((l) => (l === "en" ? "ne" : "en"));
  }

  const navItems = [
    { href: "/", icon: "chart", key: "nav.dashboard" },
    { href: "/drivers", icon: "users", key: "nav.drivers" },
    { href: "/rides", icon: "car", key: "nav.rides" },
    { href: "/live-map", icon: "map", key: "nav.liveMap" },
    { href: "/pricing", icon: "tag", key: "nav.pricing" },
    { href: "/qr-codes", icon: "qr", key: "nav.qrCodes" },
    { href: "/zones", icon: "globe", key: "nav.zones" },
    { href: "/payments", icon: "wallet", key: "nav.payments" },
  ];

  function isActive(href: string, pathname: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }
</script>

{#if $authLoading}
  <div class="flex h-screen items-center justify-center bg-background">
    <div class="text-center">
      <div class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
      <p class="mt-4 text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
{:else if isAuthRoute || !$isAuthenticated}
  {@render children()}
{:else}
<div class="flex h-screen overflow-hidden bg-background">
  <!-- Sidebar -->
  <aside
    class={cn(
      "flex flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
      sidebarCollapsed ? "w-16" : "w-60"
    )}
  >
    <!-- Logo -->
    <div class="flex h-14 items-center gap-2 border-b border-sidebar-border px-4">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-sm">
        M
      </div>
      {#if !sidebarCollapsed}
        <div class="flex flex-col">
          <span class="text-sm font-semibold text-sidebar-foreground">{$t("app.name")}</span>
          <span class="text-[10px] text-muted-foreground">{$t("app.tagline")}</span>
        </div>
      {/if}
    </div>

    <!-- Nav -->
    <nav class="flex-1 overflow-y-auto p-2 space-y-0.5">
      {#each navItems as item}
        {@const active = isActive(item.href, $page.url.pathname)}
        <a
          href={item.href}
          class={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
        >
          <span class="shrink-0 w-5 text-center">
            {#if item.icon === "chart"}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>
            {:else if item.icon === "users"}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            {:else if item.icon === "car"}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.6A2 2 0 0 0 13.7 5H6.3a2 2 0 0 0-1.6.9L2 9.5 .5 11c-.8.2-1.5 1-1.5 1.9v3c0 .6.4 1 1 1h2" transform="translate(1,0)"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
            {:else if item.icon === "map"}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
            {:else if item.icon === "tag"}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z"/><path d="M7 7h.01"/></svg>
            {:else if item.icon === "qr"}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="8" height="8" rx="1"/><rect x="14" y="2" width="8" height="8" rx="1"/><rect x="2" y="14" width="8" height="8" rx="1"/><path d="M14 14h2v2h-2z"/><path d="M20 14h2v2h-2z"/><path d="M14 20h2v2h-2z"/><path d="M20 20h2v2h-2z"/><path d="M17 17h2v2h-2z"/></svg>
            {:else if item.icon === "globe"}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
            {:else if item.icon === "wallet"}
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>
            {/if}
          </span>
          {#if !sidebarCollapsed}
            <span>{$t(item.key)}</span>
          {/if}
        </a>
      {/each}
    </nav>

    <!-- Footer -->
    <div class="border-t border-sidebar-border p-2 space-y-1">
      <button
        onclick={toggleDark}
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <span class="shrink-0 w-5 text-center">
          {#if darkMode}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
          {:else}
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
          {/if}
        </span>
        {#if !sidebarCollapsed}
          <span>{darkMode ? $t("common.lightMode") : $t("common.darkMode")}</span>
        {/if}
      </button>
      <button
        onclick={toggleLocale}
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <span class="shrink-0 w-5 text-center text-xs font-bold">{$locale === "en" ? "ने" : "EN"}</span>
        {#if !sidebarCollapsed}
          <span>{$locale === "en" ? "नेपाली" : "English"}</span>
        {/if}
      </button>
      <button
        onclick={() => signOut()}
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <span class="shrink-0 w-5 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        </span>
        {#if !sidebarCollapsed}
          <span>Sign Out</span>
        {/if}
      </button>
      <button
        onclick={() => (sidebarCollapsed = !sidebarCollapsed)}
        class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors"
      >
        <span class="shrink-0 w-5 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 transition-transform {sidebarCollapsed ? 'rotate-180' : ''}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </span>
        {#if !sidebarCollapsed}
          <span>Collapse</span>
        {/if}
      </button>
    </div>
  </aside>

  <!-- Main content -->
  <main class="flex-1 overflow-y-auto">
    <div class="p-6">
      <ErrorBoundary>
        {@render children()}
      </ErrorBoundary>
    </div>
  </main>
</div>
{/if}
