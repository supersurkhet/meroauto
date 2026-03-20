<script lang="ts">
  import Skeleton from "./skeleton.svelte";
</script>

<div class="space-y-6">
  <div>
    <Skeleton class="h-8 w-40 mb-2" />
    <Skeleton class="h-4 w-64" />
  </div>

  <!-- Stat cards -->
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
    {#each Array(6) as _}
      <div class="rounded-xl border bg-card p-4 shadow-sm">
        <Skeleton class="h-3 w-20 mb-3" />
        <Skeleton class="h-8 w-16" />
      </div>
    {/each}
  </div>

  <!-- Charts -->
  <div class="grid gap-6 lg:grid-cols-2">
    <div class="rounded-xl border bg-card p-5 shadow-sm">
      <Skeleton class="h-4 w-32 mb-4" />
      <Skeleton class="h-48 w-full" />
    </div>
    <div class="rounded-xl border bg-card p-5 shadow-sm">
      <Skeleton class="h-4 w-32 mb-4" />
      <Skeleton class="h-48 w-full" />
    </div>
  </div>

  <!-- Bottom cards -->
  <div class="grid gap-4 lg:grid-cols-3">
    {#each Array(3) as _}
      <div class="rounded-xl border bg-card p-5 shadow-sm space-y-3">
        <Skeleton class="h-4 w-36" />
        <Skeleton class="h-3 w-full" />
        <Skeleton class="h-3 w-3/4" />
        <Skeleton class="h-3 w-full" />
        <Skeleton class="h-3 w-2/3" />
      </div>
    {/each}
  </div>
</div>
