<script lang="ts">
  import { onMount } from "svelte";
  import { t } from "$lib/i18n";
  import { payments, paymentStats, refreshPayments, refundPayment } from "$lib/stores/data";
  import { formatCurrency, formatDateTime, cn, statusColor } from "$lib/utils";

  onMount(() => { refreshPayments(); });

  let search = $state("");
  let statusFilter = $state("all");
  let actionLoading = $state<string | null>(null);

  const filtered = $derived(() => {
    return $payments.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch = !q || p._id.includes(q) || p.method.includes(q) || (p.transactionId?.toLowerCase().includes(q) ?? false);
      const matchesStatus = statusFilter === "all" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => b.createdAt - a.createdAt);
  });

  async function handleRefund(paymentId: string) {
    actionLoading = paymentId;
    try { await refundPayment(paymentId); } finally { actionLoading = null; }
  }

  function methodBadge(method: string) {
    const styles: Record<string, string> = {
      cash: "bg-green-500/10 text-green-600",
      khalti: "bg-purple-500/10 text-purple-600",
      esewa: "bg-emerald-500/10 text-emerald-600",
      fonepay: "bg-blue-500/10 text-blue-600",
    };
    return styles[method] ?? "bg-gray-500/10 text-gray-600";
  }
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold tracking-tight">Payments</h1>
    <p class="text-sm text-muted-foreground">{filtered().length} transactions</p>
  </div>

  <!-- Payment stats -->
  <div class="grid grid-cols-2 gap-4 lg:grid-cols-5">
    <div class="rounded-xl border bg-card p-4 shadow-sm">
      <p class="text-xs font-medium text-muted-foreground">Total Revenue</p>
      <p class="mt-2 text-2xl font-bold text-primary">{formatCurrency($paymentStats.totalRevenue)}</p>
    </div>
    <div class="rounded-xl border bg-card p-4 shadow-sm">
      <p class="text-xs font-medium text-muted-foreground">Transactions</p>
      <p class="mt-2 text-2xl font-bold">{$paymentStats.totalTransactions}</p>
    </div>
    <div class="rounded-xl border bg-card p-4 shadow-sm">
      <p class="text-xs font-medium text-muted-foreground">Pending</p>
      <p class="mt-2 text-2xl font-bold text-yellow-600">{$paymentStats.pending}</p>
    </div>
    <div class="rounded-xl border bg-card p-4 shadow-sm">
      <p class="text-xs font-medium text-muted-foreground">Failed</p>
      <p class="mt-2 text-2xl font-bold text-red-600">{$paymentStats.failed}</p>
    </div>
    <div class="rounded-xl border bg-card p-4 shadow-sm">
      <p class="text-xs font-medium text-muted-foreground">Refunded</p>
      <p class="mt-2 text-2xl font-bold text-purple-600">{$paymentStats.refunded}</p>
    </div>
  </div>

  <!-- Payment method breakdown -->
  <div class="rounded-xl border bg-card p-5 shadow-sm">
    <h3 class="text-sm font-semibold mb-3">Revenue by Payment Method</h3>
    <div class="grid grid-cols-4 gap-4">
      {#each Object.entries($paymentStats.byMethod) as [method, amount]}
        <div class="text-center">
          <span class={cn("inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium capitalize", methodBadge(method))}>{method}</span>
          <p class="mt-1 text-sm font-bold">{formatCurrency(amount as number)}</p>
        </div>
      {/each}
    </div>
  </div>

  <!-- Filters -->
  <div class="flex items-center gap-4">
    <div class="relative flex-1 max-w-sm">
      <svg xmlns="http://www.w3.org/2000/svg" class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
      <input type="text" placeholder="Search by ID, method, txn..." bind:value={search} class="w-full rounded-lg border bg-background px-9 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
    </div>
    <div class="flex rounded-lg border bg-background p-0.5">
      {#each [{ v: "all", l: "All" }, { v: "completed", l: "Completed" }, { v: "pending", l: "Pending" }, { v: "failed", l: "Failed" }, { v: "refunded", l: "Refunded" }] as f}
        <button onclick={() => (statusFilter = f.v)} class={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", statusFilter === f.v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{f.l}</button>
      {/each}
    </div>
  </div>

  <!-- Table -->
  <div class="rounded-xl border bg-card shadow-sm overflow-hidden">
    <table class="w-full text-sm">
      <thead><tr class="border-b bg-muted/50">
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">ID</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Amount</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Method</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Transaction ID</th>
        <th class="px-4 py-3 text-left font-medium text-muted-foreground">Date</th>
        <th class="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
      </tr></thead>
      <tbody>
        {#each filtered() as payment (payment._id)}
          <tr class="border-b last:border-0 hover:bg-muted/30 transition-colors">
            <td class="px-4 py-3 font-mono text-xs text-muted-foreground">{payment._id}</td>
            <td class="px-4 py-3 font-medium">{formatCurrency(payment.amount)}</td>
            <td class="px-4 py-3"><span class={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize", methodBadge(payment.method))}>{payment.method}</span></td>
            <td class="px-4 py-3"><span class={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize", statusColor(payment.status))}>{payment.status}</span></td>
            <td class="px-4 py-3 font-mono text-xs text-muted-foreground">{payment.transactionId ?? "—"}</td>
            <td class="px-4 py-3 text-muted-foreground text-xs">{formatDateTime(payment.createdAt)}</td>
            <td class="px-4 py-3 text-right">
              {#if payment.status === "completed"}
                {#if actionLoading === payment._id}
                  <span class="text-xs text-muted-foreground animate-pulse">Processing...</span>
                {:else}
                  <button onclick={() => handleRefund(payment._id)} class="rounded-md bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-500/20 transition-colors">Refund</button>
                {/if}
              {:else}
                <span class="text-xs text-muted-foreground">—</span>
              {/if}
            </td>
          </tr>
        {:else}
          <tr><td colspan="7" class="px-4 py-12 text-center text-muted-foreground">No payments found</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
