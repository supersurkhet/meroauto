<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
  import { pricingRules, refreshPricing, updatePricingRule, createPricingRule } from "$lib/stores/data";
  import { formatCurrency, cn } from "$lib/utils";
  import type { PricingRule } from "$lib/stores/types";

  onMount(() => { refreshPricing(); });

  let editingId = $state<string | null>(null);
  let editValues = $state<Partial<PricingRule>>({});
  let savedMessage = $state("");
  let isAdding = $state(false);
  let newRule = $state({ vehicleType: "auto_rickshaw", baseFare: 50, perKmRate: 25, perMinuteRate: 3, minimumFare: 50, surgeMultiplier: 1.0 });

  function startEdit(p: PricingRule) { editingId = p._id; editValues = { ...p }; }
  async function saveEdit() {
    if (!editingId) return;
    await updatePricingRule(editingId, { baseFare: editValues.baseFare, perKmRate: editValues.perKmRate, perMinuteRate: editValues.perMinuteRate, minimumFare: editValues.minimumFare, surgeMultiplier: editValues.surgeMultiplier });
    editingId = null; savedMessage = "Pricing updated"; setTimeout(() => (savedMessage = ""), 3000);
  }
  async function addRule() {
    await createPricingRule(newRule);
    isAdding = false; savedMessage = "Rule created"; setTimeout(() => (savedMessage = ""), 3000);
  }

  const fields = [
    { key: "baseFare" as const, label: "pricing.baseFare", unit: "NPR" },
    { key: "perKmRate" as const, label: "pricing.perKmRate", unit: "NPR/km" },
    { key: "perMinuteRate" as const, label: "pricing.perMinuteRate", unit: "NPR/min" },
    { key: "minimumFare" as const, label: "pricing.minimumFare", unit: "NPR" },
    { key: "surgeMultiplier" as const, label: "pricing.surgeMultiplier", unit: "×" },
  ] as const;
</script>

<div class="space-y-6">
  <div class="flex items-center justify-between">
    <div><h1 class="text-2xl font-bold tracking-tight">{$t("pricing.title")}</h1><p class="text-sm text-muted-foreground">Configure base fare, per-km rates, and zone pricing</p></div>
    <button onclick={() => (isAdding = !isAdding)} class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">{isAdding ? $t("common.cancel") : "Add Rule"}</button>
  </div>

  {#if savedMessage}<div class="rounded-lg bg-green-500/10 border border-green-500/20 px-4 py-3 text-sm text-green-600 dark:text-green-400">{savedMessage}</div>{/if}

  {#if isAdding}
    <div class="rounded-xl border bg-card p-5 shadow-sm max-w-md">
      <h3 class="font-semibold mb-4">New Pricing Rule</h3>
      <div class="space-y-3">
        <div><label class="text-xs text-muted-foreground">Vehicle Type</label><select bind:value={newRule.vehicleType} class="w-full rounded-md border bg-background px-3 py-1.5 text-sm mt-1"><option value="auto_rickshaw">Auto Rickshaw</option><option value="e_rickshaw">E-Rickshaw</option></select></div>
        {#each fields as field}
          <div class="flex items-center justify-between"><label class="text-sm text-muted-foreground">{$t(field.label)}</label><div class="flex items-center gap-2"><input type="number" step={field.key === "surgeMultiplier" ? "0.1" : "1"} bind:value={newRule[field.key]} class="w-24 rounded-md border bg-background px-3 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-ring" /><span class="text-xs text-muted-foreground w-12">{field.unit}</span></div></div>
        {/each}
        <button onclick={addRule} class="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">{$t("common.save")}</button>
      </div>
    </div>
  {/if}

  <div class="grid gap-6 lg:grid-cols-2">
    {#each $pricingRules as p (p._id)}
      <div class="rounded-xl border bg-card p-5 shadow-sm">
        <div class="flex items-center justify-between mb-4">
          <div><h3 class="font-semibold">{p.zoneName ?? (p.isDefault ? "Default" : "Custom")}</h3><p class="text-xs text-muted-foreground">{p.vehicleType?.replace("_", " ") ?? "All"}</p></div>
          {#if editingId !== p._id}<button onclick={() => startEdit(p)} class="rounded-md bg-muted px-3 py-1.5 text-xs font-medium hover:bg-muted/80 transition-colors">{$t("common.edit")}</button>{/if}
        </div>
        {#if editingId === p._id}
          <div class="space-y-3">
            {#each fields as field}
              <div class="flex items-center justify-between"><label class="text-sm text-muted-foreground">{$t(field.label)}</label><div class="flex items-center gap-2"><input type="number" step={field.key === "surgeMultiplier" ? "0.1" : "1"} value={editValues[field.key] ?? 0} oninput={(e) => { editValues = { ...editValues, [field.key]: parseFloat((e.target as HTMLInputElement).value) }; }} class="w-24 rounded-md border bg-background px-3 py-1.5 text-sm text-right outline-none focus:ring-2 focus:ring-ring" /><span class="text-xs text-muted-foreground w-12">{field.unit}</span></div></div>
            {/each}
            <div class="flex justify-end gap-2 pt-2">
              <button onclick={() => { editingId = null; }} class="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors">{$t("common.cancel")}</button>
              <button onclick={saveEdit} class="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors">{$t("common.save")}</button>
            </div>
          </div>
        {:else}
          <div class="space-y-2.5">
            {#each fields as field}
              <div class="flex items-center justify-between"><span class="text-sm text-muted-foreground">{$t(field.label)}</span><span class="text-sm font-medium">{field.key === "surgeMultiplier" ? `${p[field.key]}×` : formatCurrency(p[field.key])}</span></div>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
  </div>

  <div class="rounded-xl border bg-card p-5 shadow-sm max-w-md">
    <h3 class="font-semibold mb-4">Fare Calculator</h3>
    {#if $pricingRules[0]}
      {@const p = $pricingRules[0]}
      {@const dist = 3}
      {@const dur = 12}
      {@const est = p.baseFare + dist * p.perKmRate + dur * p.perMinuteRate}
      <div class="space-y-2 text-sm">
        <p class="text-muted-foreground">Example: {dist} km, {dur} min ride</p>
        <div class="flex justify-between"><span class="text-muted-foreground">Base Fare</span><span>{formatCurrency(p.baseFare)}</span></div>
        <div class="flex justify-between"><span class="text-muted-foreground">Distance ({dist} km × {p.perKmRate})</span><span>{formatCurrency(dist * p.perKmRate)}</span></div>
        <div class="flex justify-between"><span class="text-muted-foreground">Time ({dur} min × {p.perMinuteRate})</span><span>{formatCurrency(dur * p.perMinuteRate)}</span></div>
        <hr /><div class="flex justify-between font-bold"><span>Estimated Fare</span><span class="text-primary">{formatCurrency(est)}</span></div>
      </div>
    {/if}
  </div>
</div>
