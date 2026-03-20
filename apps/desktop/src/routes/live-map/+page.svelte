<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { t } from "$lib/i18n";
  import { driverLocations, activeRides, refreshLocations, refreshRides } from "$lib/stores/data";

  let mapContainer: HTMLDivElement;
  let map: any;
  let markers: any[] = [];
  let rideLines: any[] = [];
  let L: any;
  let refreshInterval: ReturnType<typeof setInterval>;

  onMount(async () => {
    await Promise.all([refreshLocations(), refreshRides()]);
    L = await import("leaflet");
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);
    await new Promise((r) => setTimeout(r, 200));
    map = L.map(mapContainer).setView([28.601, 81.617], 14);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: '&copy; OSM', maxZoom: 19 }).addTo(map);
    updateMarkers();
    refreshInterval = setInterval(async () => { await refreshLocations(); updateMarkers(); }, 5000);
  });

  function updateMarkers() {
    if (!map || !L) return;
    markers.forEach((m) => m.remove()); rideLines.forEach((l) => l.remove());
    markers = []; rideLines = [];
    const activeDriverIds = new Set($activeRides.map((r) => r.driverId));

    $driverLocations.forEach((loc) => {
      const inRide = activeDriverIds.has(loc.driverId);
      const icon = L.divIcon({
        html: `<div class="flex items-center justify-center w-8 h-8 rounded-full ${inRide ? "bg-blue-500" : "bg-green-500"} text-white text-xs font-bold shadow-lg border-2 border-white"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg></div>`,
        className: "", iconSize: [32, 32], iconAnchor: [16, 16],
      });
      const marker = L.marker([loc.lat, loc.lng], { icon }).addTo(map)
        .bindPopup(`<b>${loc.driverName ?? "Driver"}</b><br/>${inRide ? "In Ride" : loc.driver?.status ?? "online"}<br/>Speed: ${loc.speed ?? 0} km/h`);
      markers.push(marker);
    });

    $activeRides.forEach((ride) => {
      rideLines.push(L.polyline([[ride.pickup.lat, ride.pickup.lng], [ride.dropoff.lat, ride.dropoff.lng]], { color: "#3b82f6", weight: 3, dashArray: "8 4", opacity: 0.7 }).addTo(map));
      const pIcon = L.divIcon({ html: `<div class="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>`, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
      const dIcon = L.divIcon({ html: `<div class="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>`, className: "", iconSize: [16, 16], iconAnchor: [8, 8] });
      markers.push(L.marker([ride.pickup.lat, ride.pickup.lng], { icon: pIcon }).addTo(map).bindPopup(`Pickup: ${ride.pickup.address}`));
      markers.push(L.marker([ride.dropoff.lat, ride.dropoff.lng], { icon: dIcon }).addTo(map).bindPopup(`Dropoff: ${ride.dropoff.address}`));
    });
  }

  $effect(() => { void $driverLocations; void $activeRides; updateMarkers(); });
  onDestroy(() => { clearInterval(refreshInterval); map?.remove(); });
</script>

<div class="space-y-4">
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold tracking-tight">{$t("liveMap.title")}</h1>
      <p class="text-sm text-muted-foreground">{$activeRides.length} active rides · {$driverLocations.length} online drivers</p>
    </div>
    <div class="flex items-center gap-4 text-xs">
      <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-green-500"></span> Available</span>
      <span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-blue-500"></span> In Ride</span>
    </div>
  </div>
  <div class="grid gap-4 lg:grid-cols-[1fr_300px]">
    <div class="relative rounded-xl border overflow-hidden shadow-sm" style="height: 600px;"><div bind:this={mapContainer} class="h-full w-full"></div></div>
    <div class="rounded-xl border bg-card p-4 shadow-sm overflow-y-auto" style="max-height: 600px;">
      <h3 class="text-sm font-semibold mb-3">{$t("liveMap.activeRides")} ({$activeRides.length})</h3>
      {#if $activeRides.length === 0}
        <p class="text-sm text-muted-foreground py-8 text-center">{$t("liveMap.noActiveRides")}</p>
      {:else}
        <div class="space-y-3">
          {#each $activeRides as ride (ride._id)}
            <div class="rounded-lg border p-3 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-medium">{ride.riderName ?? "Rider"}</span>
                <span class="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">{ride.status.replace(/_/g, " ")}</span>
              </div>
              <div class="text-xs text-muted-foreground">
                <p class="flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-green-500 shrink-0"></span>{ride.pickup.address}</p>
                <p class="flex items-center gap-1"><span class="h-1.5 w-1.5 rounded-full bg-red-500 shrink-0"></span>{ride.dropoff.address}</p>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-muted-foreground">{ride.driverName ?? "Driver"}</span>
                <span class="font-medium">रू {ride.fare}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
