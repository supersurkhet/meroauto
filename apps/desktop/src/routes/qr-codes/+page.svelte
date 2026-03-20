<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
  import { qrCodes, drivers, vehicles, refreshQrCodes, generateQrCode, deactivateQrCode } from "$lib/stores/data";
  import { cn } from "$lib/utils";
  import { SearchInput, Select, Label } from "$lib/components/ui";

  onMount(() => { refreshQrCodes(); });

  let search = $state("");
  let filter = $state<"all" | "active" | "inactive">("all");
  let showGenerate = $state(false);
  let selectedDriverId = $state("");
  let selectedVehicleId = $state("");
  let generating = $state(false);

  const filtered = $derived($qrCodes.filter((qr) => {
    const q = search.toLowerCase();
    const matchesSearch = !q || (qr.driverName?.toLowerCase().includes(q) ?? false) || (qr.vehicle?.registrationNumber?.toLowerCase().includes(q) ?? false) || qr.code.toLowerCase().includes(q);
    return (filter === "all" || (filter === "active" && qr.isActive) || (filter === "inactive" && !qr.isActive)) && matchesSearch;
  }));

  const approvedDrivers = $derived($drivers.filter((d) => d.isApproved && !d.isSuspended));
  const driverVehicles = $derived(selectedDriverId ? $vehicles.filter((v) => v.driverId === selectedDriverId && v.isActive) : []);

  async function handleGenerate() {
    if (!selectedDriverId || !selectedVehicleId) return;
    generating = true;
    try { await generateQrCode(selectedDriverId, selectedVehicleId); showGenerate = false; selectedDriverId = ""; selectedVehicleId = ""; } finally { generating = false; }
  }

  function qrSvg(text: string, size = 200): string {
    const cells = 21, cs = size / cells;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/>`;
    let h = 0;
    for (let i = 0; i < text.length; i++) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
    for (const [fy, fx] of [[0,0],[0,14],[14,0]]) for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++)
      if (y === 0 || y === 6 || x === 0 || x === 6 || (y >= 2 && y <= 4 && x >= 2 && x <= 4))
        svg += `<rect x="${(fx+x)*cs}" y="${(fy+y)*cs}" width="${cs}" height="${cs}" fill="black"/>`;
    for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
      if ((y < 8 && x < 8) || (y < 8 && x > 12) || (y > 12 && x < 8)) continue;
      h = ((h * 1103515245 + 12345) >>> 0) % 2147483648;
      if (h % 3 === 0) svg += `<rect x="${x*cs}" y="${y*cs}" width="${cs}" height="${cs}" fill="black"/>`;
    }
    return svg + `</svg>`;
  }
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div><h1 class="text-2xl font-bold tracking-tight">{$t("qr.title")}</h1><p class="text-sm text-muted-foreground">{filtered.length} QR codes</p></div>
    <button onclick={() => (showGenerate = !showGenerate)} class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">{showGenerate ? $t("common.cancel") : $t("qr.generate")}</button>
  </div>

  {#if showGenerate}
    <div class="rounded-xl border bg-card p-5 shadow-sm max-w-md space-y-3">
      <h3 class="font-semibold">Generate New QR Code</h3>
      <div><Label class="text-xs text-muted-foreground">Driver</Label><Select class="mt-1" bind:value={selectedDriverId}><option value="">Select driver...</option>{#each approvedDrivers as d}<option value={d._id}>{d.name} ({d.licenseNumber})</option>{/each}</Select></div>
      {#if selectedDriverId}<div><Label class="text-xs text-muted-foreground">Vehicle</Label><Select class="mt-1" bind:value={selectedVehicleId}><option value="">Select vehicle...</option>{#each driverVehicles as v}<option value={v._id}>{v.registrationNumber} ({v.type.replace("_", " ")})</option>{/each}</Select></div>{/if}
      <button onclick={handleGenerate} disabled={!selectedDriverId || !selectedVehicleId || generating} class="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">{generating ? "Generating..." : $t("qr.generate")}</button>
    </div>
  {/if}

  <div class="flex items-center gap-4">
    <SearchInput class="flex-1 max-w-sm" placeholder="Search QR codes..." bind:value={search} />
    <div class="flex rounded-lg border bg-background p-0.5">
      {#each [{v:"all",l:"All"},{v:"active",l:"Active"},{v:"inactive",l:"Inactive"}] as f}
        <button onclick={() => (filter = f.v as typeof filter)} class={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", filter === f.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{f.l}</button>
      {/each}
    </div>
  </div>

  <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each filtered as qr (qr._id)}
      <div class="rounded-xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
        <div class="flex justify-center mb-3"><div class="w-32 h-32 rounded-lg overflow-hidden bg-white p-2">{@html qrSvg(qr.code)}</div></div>
        <div class="space-y-1.5 text-center">
          <p class="font-medium text-sm">{qr.driverName ?? "—"}</p>
          <p class="text-xs text-muted-foreground font-mono">{qr.vehicle?.registrationNumber ?? "—"}</p>
          <p class="text-[10px] text-muted-foreground font-mono">{qr.code}</p>
          {#if qr.scans > 0}<p class="text-[10px] text-muted-foreground">{qr.scans} scans</p>{/if}
        </div>
        <div class="flex items-center justify-between mt-3 pt-3 border-t">
          <span class={cn("inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium", qr.isActive ? "bg-green-500/10 text-green-600" : "bg-gray-500/10 text-gray-600")}>{qr.isActive ? "Active" : "Inactive"}</span>
          {#if qr.isActive}<button onclick={() => deactivateQrCode(qr._id)} class="rounded-md px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-500/10 transition-colors">Deactivate</button>{/if}
        </div>
      </div>
    {:else}
      <div class="col-span-full py-12 text-center text-muted-foreground">{$t("qr.noQr")}</div>
    {/each}
  </div>
</div>
