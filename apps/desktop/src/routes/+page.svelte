<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
  import { dashboardStats, hourlyData, driverUtilization, dailyRideData, refreshDashboard } from "$lib/stores/data";
  import { formatCurrency } from "$lib/utils";

  onMount(() => { refreshDashboard(); });

  const statCards = $derived([
    { label: $t("dashboard.totalRides"), value: $dashboardStats.rides.total, trend: "+12%" },
    { label: $t("dashboard.activeRides"), value: $dashboardStats.rides.active, highlight: true },
    { label: $t("dashboard.totalDrivers"), value: $dashboardStats.drivers.total },
    { label: $t("dashboard.onlineDrivers"), value: $dashboardStats.drivers.online, highlight: true },
    { label: $t("dashboard.revenue"), value: formatCurrency($dashboardStats.revenue.total), trend: "+8%" },
    { label: $t("dashboard.todayRides"), value: $dashboardStats.rides.today },
  ]);

  const chartW = 700;
  const chartH = 200;
  const barGap = 4;

  function rideBars(data: { date: string; rides: number }[]) {
    const max = Math.max(...data.map((d) => d.rides), 1);
    const barW = (chartW - barGap * data.length) / data.length;
    return data.map((d, i) => ({
      x: i * (barW + barGap), y: chartH - (d.rides / max) * chartH,
      w: barW, h: (d.rides / max) * chartH, label: d.date, value: d.rides,
    }));
  }

  function hourBars(data: { hour: number; count: number }[]) {
    const max = Math.max(...data.map((d) => d.count), 1);
    const barW = (chartW - barGap * 24) / 24;
    return data.map((d, i) => ({
      x: i * (barW + barGap), y: chartH - (d.count / max) * chartH,
      w: barW, h: (d.count / max) * chartH,
      label: `${d.hour}:00`, value: d.count, isPeak: d.count > max * 0.7,
    }));
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">{$t("dashboard.title")}</h1>
    <p class="text-muted-foreground text-sm">Overview of MeroAuto operations in Surkhet</p>
  </div>

  <div class="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
    {#each statCards as card}
      <div class="rounded-xl border bg-card p-4 shadow-sm">
        <div class="flex items-center justify-between">
          <p class="text-xs font-medium text-muted-foreground">{card.label}</p>
          {#if card.trend}<span class="text-xs font-medium text-primary">{card.trend}</span>{/if}
        </div>
        <p class="mt-2 text-2xl font-bold {card.highlight ? 'text-primary' : ''}">{card.value}</p>
      </div>
    {/each}
  </div>

  <div class="grid gap-6 lg:grid-cols-2">
    <div class="rounded-xl border bg-card p-5 shadow-sm">
      <h3 class="text-sm font-semibold mb-4">{$t("dashboard.ridesPerDay")}</h3>
      <svg viewBox="0 0 {chartW} {chartH + 30}" class="w-full">
        {#each rideBars($dailyRideData) as bar}
          <rect x={bar.x} y={bar.y} width={bar.w} height={Math.max(bar.h, 1)} rx="3" class="fill-primary/80 hover:fill-primary transition-colors" />
          <text x={bar.x + bar.w / 2} y={chartH + 16} text-anchor="middle" class="fill-muted-foreground text-[8px]">{bar.label}</text>
          <text x={bar.x + bar.w / 2} y={bar.y - 4} text-anchor="middle" class="fill-foreground text-[8px] font-medium">{bar.value}</text>
        {/each}
      </svg>
    </div>
    <div class="rounded-xl border bg-card p-5 shadow-sm">
      <h3 class="text-sm font-semibold mb-4">{$t("dashboard.peakHours")}</h3>
      <svg viewBox="0 0 {chartW} {chartH + 30}" class="w-full">
        {#each hourBars($hourlyData) as bar}
          <rect x={bar.x} y={bar.y} width={bar.w} height={Math.max(bar.h, 1)} rx="2" class="{bar.isPeak ? 'fill-chart-1' : 'fill-primary/40'} hover:fill-primary transition-colors" />
          {#if bar.value > 0}
            <text x={bar.x + bar.w / 2} y={bar.y - 3} text-anchor="middle" class="fill-foreground text-[7px]">{bar.value}</text>
          {/if}
          {#if Number(bar.label.split(":")[0]) % 3 === 0}
            <text x={bar.x + bar.w / 2} y={chartH + 14} text-anchor="middle" class="fill-muted-foreground text-[8px]">{bar.label}</text>
          {/if}
        {/each}
      </svg>
    </div>
  </div>

  <div class="grid gap-4 lg:grid-cols-3">
    <div class="rounded-xl border bg-card p-5 shadow-sm">
      <h3 class="text-sm font-semibold mb-3">{$t("dashboard.driverUtilization")}</h3>
      <div class="space-y-3">
        <div class="flex justify-between text-sm">
          <span class="text-muted-foreground">Online / Total</span>
          <span class="font-medium">{$dashboardStats.drivers.online} / {$dashboardStats.drivers.total}</span>
        </div>
        <div class="h-2 rounded-full bg-muted overflow-hidden">
          <div class="h-full rounded-full bg-primary transition-all" style="width: {($dashboardStats.drivers.online / Math.max($dashboardStats.drivers.total, 1)) * 100}%"></div>
        </div>
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">Approved</span><span class="font-medium">{$dashboardStats.drivers.approved}</span></div>
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">Pending Approval</span><span class="font-medium text-yellow-600">{$dashboardStats.drivers.pendingApproval}</span></div>
      </div>
    </div>
    <div class="rounded-xl border bg-card p-5 shadow-sm">
      <h3 class="text-sm font-semibold mb-3">{$t("dashboard.revenue")}</h3>
      <div class="space-y-3">
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">{$t("common.today")}</span><span class="font-medium">{formatCurrency($dashboardStats.revenue.today)}</span></div>
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">{$t("common.thisWeek")}</span><span class="font-medium">{formatCurrency($dashboardStats.revenue.thisWeek)}</span></div>
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">{$t("common.total")}</span><span class="font-medium">{formatCurrency($dashboardStats.revenue.total)}</span></div>
        <div class="flex justify-between text-sm"><span class="text-muted-foreground">Completion Rate</span><span class="font-medium text-primary">{Math.round(($dashboardStats.rides.completed / Math.max($dashboardStats.rides.total, 1)) * 100)}%</span></div>
      </div>
    </div>
    <div class="rounded-xl border bg-card p-5 shadow-sm">
      <h3 class="text-sm font-semibold mb-3">Top Drivers Today</h3>
      <div class="space-y-2">
        {#each $driverUtilization.slice(0, 5) as driver, i}
          <div class="flex items-center justify-between text-sm">
            <span class="flex items-center gap-2">
              <span class="text-xs text-muted-foreground w-4">{i + 1}.</span>
              <span class="font-medium">{driver.driverName}</span>
            </span>
            <div class="flex items-center gap-3">
              <span class="text-xs text-muted-foreground">{driver.todayRides} rides</span>
              <span class="flex items-center gap-0.5 text-xs">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 fill-yellow-500 text-yellow-500" viewBox="0 0 24 24"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                {driver.rating}
              </span>
            </div>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
