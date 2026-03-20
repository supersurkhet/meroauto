<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
  import { rides, refreshRides } from "$lib/stores/data";
  import { formatCurrency, formatDateTime, cn, statusColor } from "$lib/utils";

  onMount(() => { refreshRides(); });

  let search = $state("");
  let statusFilter = $state("all");
  let sortBy = $state<"date" | "fare">("date");
  let sortDir = $state<"asc" | "desc">("desc");

  const filtered = $derived(() => {
    let result = $rides.filter((r) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || r.pickup.address.toLowerCase().includes(q) || r.dropoff.address.toLowerCase().includes(q) || (r.riderName?.toLowerCase().includes(q) ?? false) || (r.driverName?.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === "all" || (statusFilter === "active" && ["matched", "accepted", "in_progress"].includes(r.status)) || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
    result.sort((a, b) => { const m = sortDir === "desc" ? -1 : 1; return sortBy === "date" ? m * (a.createdAt - b.createdAt) : m * (a.fare - b.fare); });
    return result;
  });

  function statusLabel(s: string) { return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()); }
  const statusFilters = [{ value: "all", label: "rides.all" }, { value: "active", label: "rides.active" }, { value: "completed", label: "rides.completed" }, { value: "cancelled", label: "rides.cancelled" }] as const;
</script>

<div class="space-y-6">
  <div><h1 class="text-2xl font-bold tracking-tight">{$t("rides.title")}</h1><p class="text-sm text-muted-foreground">{filtered().length} rides</p></div>

  <div class="flex items-center gap-4 flex-wrap">
    <div class="relative flex-1 max-w-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" placeholder={$t("rides.search")} bind:value={search} class="w-full rounded-lg border bg-background px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>
    <div class="flex rounded-lg border bg-background p-0.5">
      {#each statusFilters as f}
        <button onclick={() => (statusFilter = f.value)} class={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", statusFilter === f.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{$t(f.label)}</button>
      {/each}
    </div>
    <div class="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Sort:</span>
      <button onclick={() => { sortBy = "date"; sortDir = sortDir === "desc" ? "asc" : "desc"; }} class={cn("px-2 py-1 rounded", sortBy === "date" && "bg-muted font-medium text-foreground")}>Date {sortBy === "date" ? (sortDir === "desc" ? "↓" : "↑") : ""}</button>
      <button onclick={() => { sortBy = "fare"; sortDir = sortDir === "desc" ? "asc" : "desc"; }} class={cn("px-2 py-1 rounded", sortBy === "fare" && "bg-muted font-medium text-foreground")}>Fare {sortBy === "fare" ? (sortDir === "desc" ? "↓" : "↑") : ""}</button>
    </div>
  </div>

  <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead><tr class="border-b bg-muted/50">
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("rides.rider")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("rides.driver")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("rides.pickup")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("rides.dropoff")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("rides.fare")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("rides.distance")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("rides.status")}</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Type</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">{$t("rides.date")}</th>
      </tr></thead>
      <tbody>
        {#each filtered() as ride (ride._id)}
          <tr class="border-b last:border-0 hover:bg-muted/30 transition-colors">
            <td class="px-4 py-3 font-medium">{ride.riderName ?? "—"}</td>
            <td class="px-4 py-3 text-muted-foreground">{ride.driverName ?? "—"}</td>
            <td class="px-4 py-3 text-muted-foreground max-w-[120px] truncate">{ride.pickup.address}</td>
            <td class="px-4 py-3 text-muted-foreground max-w-[120px] truncate">{ride.dropoff.address}</td>
            <td class="px-4 py-3 font-medium">{formatCurrency(ride.finalFare ?? ride.fare)}</td>
            <td class="px-4 py-3 text-muted-foreground">{ride.distance} km</td>
            <td class="px-4 py-3"><span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {statusColor(ride.status)}">{statusLabel(ride.status)}</span></td>
            <td class="px-4 py-3">
              {#if ride.isQrRide}<span class="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 font-medium">QR</span>
              {:else if ride.isPooling}<span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">Pool</span>
              {:else}<span class="text-[10px] text-muted-foreground">Standard</span>{/if}
            </td>
            <td class="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(ride.createdAt)}</td>
          </tr>
        {:else}
          <tr><td colspan="9" class="px-4 py-12 text-center text-muted-foreground">{$t("rides.noRides")}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
