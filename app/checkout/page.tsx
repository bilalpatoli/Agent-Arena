"use client";

// ─────────────────────────────────────────────────────────────────────────────
// Bug Fix Arena — the task environment: a broken ecommerce checkout.
// The "Place Order" button is disabled by a stuck validation condition; the fix
// is to repair the validation logic so a test order reaches /success. This is the
// surface a live computer-use agent drives.
// ─────────────────────────────────────────────────────────────────────────────

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-md px-6 py-10">
      <div className="mb-6">
        <h1 className="text-xl font-semibold">Checkout</h1>
        <p className="text-sm text-arena-muted">Shopline · review and place your order</p>
      </div>

      <div className="space-y-3 rounded-xl border border-arena-border bg-arena-panel p-4">
        <Line label="Wireless Headphones" value="$129.00" />
        <Line label="Shipping" value="$0.00" />
        <div className="border-t border-arena-border pt-3">
          <Line label="Total" value="$129.00" bold />
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-arena-fail/40 bg-arena-fail/[0.06] px-3 py-2 text-xs text-arena-fail">
        Validation error: order state is invalid — the Place Order button stays disabled.
      </div>

      <button
        disabled
        className="mt-4 w-full cursor-not-allowed rounded-lg bg-arena-panel2 py-2.5 font-semibold text-arena-muted"
      >
        Place Order
      </button>
      <p className="mt-2 text-center text-xs text-arena-muted">
        Bug: a stuck checkout validation condition blocks completion. Fix the logic to reach <span className="font-mono">/success</span>.
      </p>
    </main>
  );
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={bold ? "font-semibold" : "text-arena-muted"}>{label}</span>
      <span className={`tabular-nums ${bold ? "font-semibold" : ""}`}>{value}</span>
    </div>
  );
}
