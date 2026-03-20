<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
  import { drivers, refreshDrivers, approveDriver, suspendDriver } from "$lib/stores/data";
  import { formatCurrency, formatDate, cn } from "$lib/utils";
  import type { Driver } from "$lib/stores/types";

  onMount(() => { refreshDrivers(); });

  let search = $state("");
  let filter = $state<"all" | "approved" | "pending" | "suspended" | "online">("all");
  let selectedDriver = $state<Driver | null>(null);
  let actionLoading = $state<string | null>(null);

  const filtered = $derived(
    $drivers.filter((d) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || (d.name?.toLowerCase().includes(q) ?? false) || (d.phone?.includes(q) ?? false) || d.licenseNumber.toLowerCase().includes(q);
      const matchesFilter = filter === "all" || (filter === "approved" && d.isApproved && !d.isSuspended) || (filter === "pending" && !d.isApproved && !d.isSuspended) || (filter === "suspended" && d.isSuspended) || (filter === "online" && d.status !== "offline");
      return matchesSearch && matchesFilter;
    })
  );

  function driverStatusBadge(d: Driver) {
    if (d.isSuspended) return { label: $t("drivers.suspended"), cls: "bg-red-500/10 text-red-600 dark:text-red-400" };
    if (!d.isApproved) return { label: $t("drivers.pending"), cls: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" };
    if (d.status !== "offline") return { label: d.status.replace("_", " "), cls: "bg-green-500/10 text-green-600 dark:text-green-400" };
    return { label: $t("drivers.offline"), cls: "bg-gray-500/10 text-gray-600 dark:text-gray-400" };
  }

  async function handleApprove(id: string) { actionLoading = id; try { await approveDriver(id); } finally { actionLoading = null; } }
  async function handleSuspend(id: string, suspended: boolean) { actionLoading = id; try { await suspendDriver(id, suspended); } finally { actionLoading = null; } }

  const filters = [
    { value: "all", label: "drivers.all" }, { value: "approved", label: "drivers.approved" },
    { value: "pending", label: "drivers.pending" }, { value: "suspended", label: "drivers.suspended" },
    { value: "online", label: "drivers.online" },
  ] as const;
</script>

<div class="space-y-6">
  <div><h1 class="text-2xl font-bold tracking-tight">{$t("drivers.title")}</h1><p class="text-sm text-muted-foreground">{filtered.length} drivers</p></div>

  <div class="flex items-center gap-4">
    <div class="relative flex-1 max-w-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" placeholder={$t("drivers.search")} bind:value={search} class="w-full rounded-lg border bg-background px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>
    <div class="flex rounded-lg border bg-background p-0.5">
      {#each filters as f}
        <button onclick={() => (filter = f.value)} class={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", filter === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{$t(f.label)}</button>
      {/each}
    </div>
  </div>

  <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead><tr class="border-b bg-muted/50">
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("drivers.name")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("drivers.phone")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("drivers.license")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("drivers.status")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("drivers.rating")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("drivers.rides")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("drivers.earnings")}</th>
        <th class="px-4 py-3 text-right font-medium text-muted-foreground">{$t("common.actions")}</th>
      </tr></thead>
      <tbody>
        {#each filtered as driver (driver._id)}
          {@const badge = driverStatusBadge(driver)}
          <tr class="border-b last:border-0 hover:bg-muted/30 transition-colors">
            <td class="px-4 py-3"><div class="flex items-center gap-3"><div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-xs">{(driver.name ?? "?").split(" ").map((n) => n[0]).slice(0, 2).join("")}</div><div><p class="font-medium">{driver.name}</p><p class="text-xs text-muted-foreground">{driver.email}</p></div></div></td>
            <td class="px-4 py-3 text-muted-foreground">{driver.phone}</td>
            <td class="px-4 py-3 font-mono text-xs">{driver.licenseNumber}</td>
            <td class="px-4 py-3"><span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {badge.cls}">{badge.label}</span></td>
            <td class="px-4 py-3"><div class="flex items-center gap-1"><svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg><span>{driver.rating}</span></div></td>
            <td class="px-4 py-3">{driver.totalRides}</td>
            <td class="px-4 py-3 font-medium">{formatCurrency(driver.totalEarnings)}</td>
            <td class="px-4 py-3"><div class="flex items-center justify-end gap-1">
              {#if actionLoading === driver._id}
                <span class="text-xs text-muted-foreground animate-pulse">Working...</span>
              {:else}
                {#if !driver.isApproved && !driver.isSuspended}
                  <button onclick={() => handleApprove(driver._id)} class="rounded-md bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 hover:bg-green-500/20 transition-colors">{$t("drivers.approve")}</button>
                {/if}
                {#if driver.isSuspended}
                  <button onclick={() => handleSuspend(driver._id, false)} class="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-600 hover:bg-blue-500/20 transition-colors">{$t("drivers.reactivate")}</button>
                {:else if driver.isApproved}
                  <button onclick={() => handleSuspend(driver._id, true)} class="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors">{$t("drivers.suspend")}</button>
                {/if}
                <button onclick={() => (selectedDriver = driver)} class="rounded-md bg-muted px-2.5 py-1 text-xs font-medium hover:bg-muted/80 transition-colors">{$t("drivers.viewDocuments")}</button>
              {/if}
            </div></td>
          </tr>
        {:else}
          <tr><td colspan="8" class="px-4 py-12 text-center text-muted-foreground">{$t("drivers.noDrivers")}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if selectedDriver}
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" role="dialog">
    <div class="w-full max-w-lg rounded-xl bg-card p-6 shadow-xl border">
      <div class="flex items-start justify-between mb-4">
        <div><h2 class="text-lg font-bold">{selectedDriver.name}</h2><p class="text-sm text-muted-foreground">{selectedDriver.phone}</p></div>
        <button onclick={() => (selectedDriver = null)} class="rounded-md p-1 hover:bg-muted"><svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg></button>
      </div>
      <div class="grid grid-cols-2 gap-3 text-sm">
        {#each [{ l: "License", v: selectedDriver.licenseNumber }, { l: "Expires", v: formatDate(selectedDriver.licenseExpiry) }, { l: "Rating", v: `${selectedDriver.rating} / 5.0` }, { l: "Total Rides", v: selectedDriver.totalRides }, { l: "Earnings", v: formatCurrency(selectedDriver.totalEarnings) }, { l: "Joined", v: formatDate(selectedDriver.createdAt) }] as item}
          <div class="rounded-lg bg-muted/50 p-3"><p class="text-xs text-muted-foreground">{item.l}</p><p class="font-medium">{item.v}</p></div>
        {/each}
      </div>
      <div class="rounded-lg border p-3 mt-3 text-sm">
        <p class="text-xs text-muted-foreground mb-2">Documents</p>
        <div class="space-y-2">
          <div class="flex items-center justify-between"><span>Driver's License</span><span class="text-xs text-green-600 font-medium">Verified</span></div>
          <div class="flex items-center justify-between"><span>Vehicle Registration</span><span class="text-xs text-green-600 font-medium">Verified</span></div>
          <div class="flex items-center justify-between"><span>Insurance</span><span class="text-xs text-yellow-600 font-medium">Pending</span></div>
        </div>
      </div>
    </div>
  </div>
{/if}
