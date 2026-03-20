<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { t } from "$lib/i18n";
  import { zones, refreshZones, createZone, updateZone, removeZone } from "$lib/stores/data";
  import { cn } from "$lib/utils";
  import { Input, Label } from "$lib/components/ui";

  let mapContainer: HTMLDivElement;
  let map: any;
  let circles: any[] = [];
  let L: any;
  let isAdding = $state(false);
  let newZone = $state({ name: "", nameNe: "", centerLat: 28.601, centerLng: 81.617, radiusKm: 2, baseFare: 50, perKmRate: 25, minimumFare: 50 });

  onMount(async () => {
    await refreshZones();
    L = await import("leaflet");
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    await new Promise((r) => setTimeout(r, 200));
    map = L.map(mapContainer).setView([28.601, 81.617], 13);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OSM', maxZoom: 19 }).addTo(map);
    map.on("click", (e: any) => {
      if (isAdding) {
        newZone.centerLat = Math.round(e.latlng.lat * 10000) / 10000;
        newZone.centerLng = Math.round(e.latlng.lng * 10000) / 10000;
        renderPreview();
      }
    });
    renderZones();
  });

  let previewCircle: any = null;
  function renderPreview() {
    if (!map || !L || !isAdding) return;
    if (previewCircle) previewCircle.remove();
    previewCircle = L.circle([newZone.centerLat, newZone.centerLng], { radius: newZone.radiusKm * 1000, color: "#3b82f6", fillColor: "#3b82f6", fillOpacity: 0.15, weight: 2, dashArray: "6 4" }).addTo(map);
  }
  $effect(() => { if (isAdding) { void newZone.centerLat; void newZone.centerLng; void newZone.radiusKm; renderPreview(); } else if (previewCircle) { previewCircle.remove(); previewCircle = null; } });

  function renderZones() {
    if (!map || !L) return;
    circles.forEach((c) => c.remove()); circles = [];
    $zones.forEach((z) => {
      const c = L.circle([z.center.lat, z.center.lng], { radius: z.radiusKm * 1000, color: z.isActive ? "#22c55e" : "#6b7280", fillColor: z.isActive ? "#22c55e" : "#6b7280", fillOpacity: 0.1, weight: 2 }).addTo(map);
      c.bindPopup(`<b>${z.name}</b><br/>${z.nameNe ?? ""}<br/>R: ${z.radiusKm} km${z.baseFare ? `<br/>Base: रू${z.baseFare}` : ""}`);
      circles.push(c);
    });
  }

  $effect(() => { void $zones; renderZones(); });

  async function handleAdd() { if (!newZone.name) return; await createZone(newZone); isAdding = false; newZone = { name: "", nameNe: "", centerLat: 28.601, centerLng: 81.617, radiusKm: 2, baseFare: 50, perKmRate: 25, minimumFare: 50 }; }
  async function toggleActive(id: string, active: boolean) { await updateZone(id, { isActive: !active }); }

  onDestroy(() => { map?.remove(); });
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div><h1 class="text-2xl font-bold tracking-tight">{$t("zones.title")}</h1><p class="text-sm text-muted-foreground">Define service areas</p></div>
    <button onclick={() => (isAdding = !isAdding)} class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">{isAdding ? $t("common.cancel") : $t("zones.addZone")}</button>
  </div>

  <div class="grid gap-4 lg:grid-cols-[1fr_320px]">
    <div class="rounded-xl border overflow-hidden shadow-sm" style="height: 500px;"><div bind:this={mapContainer} class="h-full w-full"></div></div>
    <div class="space-y-4 overflow-y-auto" style="max-height: 500px;">
      {#if isAdding}
        <div class="rounded-xl border bg-card p-4 shadow-sm space-y-3">
          <h3 class="text-sm font-semibold">{$t("zones.addZone")}</h3>
          <div><Label class="text-xs">{$t("zones.name")}</Label><Input bind:value={newZone.name} class="mt-1" /></div>
          <div><Label class="text-xs">{$t("zones.nameNe")}</Label><Input bind:value={newZone.nameNe} class="mt-1" /></div>
          <div class="rounded-md border border-dashed border-blue-400 bg-blue-50/50 dark:bg-blue-900/10 p-2 text-center">
            <p class="text-xs font-medium text-blue-600 dark:text-blue-400">Click on the map to set zone center</p>
            <p class="text-[11px] text-muted-foreground mt-0.5">{newZone.centerLat.toFixed(4)}, {newZone.centerLng.toFixed(4)}</p>
          </div>
          <div><Label class="text-xs">{$t("zones.radius")}</Label><Input type="number" step="0.5" bind:value={newZone.radiusKm} class="mt-1" /></div>
          <div class="grid grid-cols-3 gap-2">
            <div><Label class="text-xs">Base Fare</Label><Input type="number" bind:value={newZone.baseFare} class="mt-1" /></div>
            <div><Label class="text-xs">Per km</Label><Input type="number" bind:value={newZone.perKmRate} class="mt-1" /></div>
            <div><Label class="text-xs">Min Fare</Label><Input type="number" bind:value={newZone.minimumFare} class="mt-1" /></div>
          </div>
          <button onclick={handleAdd} class="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">{$t("common.save")}</button>
        </div>
      {/if}
      {#each $zones as zone (zone._id)}
        <div class="rounded-xl border bg-card p-4 shadow-sm">
          <div class="flex items-start justify-between">
            <div><h3 class="font-medium text-sm">{zone.name}</h3><p class="text-xs text-muted-foreground">{zone.nameNe ?? ""}</p></div>
            <span class={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium", zone.isActive ? "bg-green-500/10 text-green-600" : "bg-gray-500/10 text-gray-600")}>{zone.isActive ? "Active" : "Inactive"}</span>
          </div>
          <div class="mt-2 text-xs text-muted-foreground space-y-0.5">
            <p>Center: {zone.center.lat.toFixed(3)}, {zone.center.lng.toFixed(3)}</p>
            <p>Radius: {zone.radiusKm} km</p>
            {#if zone.baseFare}<p>Base: रू{zone.baseFare} | Per km: रू{zone.perKmRate}</p>{/if}
          </div>
          <div class="mt-3 flex gap-1">
            <button onclick={() => toggleActive(zone._id, zone.isActive)} class="rounded-md px-2.5 py-1 text-xs font-medium hover:bg-muted transition-colors">{zone.isActive ? "Deactivate" : "Activate"}</button>
            <button onclick={() => removeZone(zone._id)} class="rounded-md px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-500/10 transition-colors">{$t("common.delete")}</button>
          </div>
        </div>
      {:else}
        <div class="py-12 text-center text-muted-foreground text-sm">{$t("zones.noZones")}</div>
      {/each}
    </div>
  </div>
</div>
