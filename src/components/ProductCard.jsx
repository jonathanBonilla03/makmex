export default function ProductCard({
  brand = "Milwaukee",
  name = "M18 Hammer Drill",
  subtitle = "Cordless • Fuel",
  price = 199.99,
  inStock = true,
  type = "product", // "product" | "kit" | "combo"
}) {
  return (
    <div className="rounded-2xl border border-makmex-border bg-makmex-panel p-4 shadow-card transition hover:border-makmex-orange/60">
      <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-black/30 text-xs text-makmex-muted">
        Image
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-makmex-muted">{brand}</div>

        {type !== "product" && (
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
              type === "kit"
                ? "bg-makmex-orange/20 text-makmex-orange"
                : "bg-blue-500/20 text-blue-300",
            ].join(" ")}
          >
            {type}
          </span>
        )}
      </div>

      <h3 className="mt-1 text-sm font-bold leading-snug">{name}</h3>
      <p className="mt-0.5 text-xs text-makmex-muted">{subtitle}</p>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-extrabold">${price.toFixed(2)}</span>

        <button
          disabled={!inStock}
          className={
            inStock
              ? "rounded-lg bg-makmex-orange px-3 py-1.5 text-sm font-semibold text-black hover:bg-makmex-ember"
              : "cursor-not-allowed rounded-lg bg-makmex-border px-3 py-1.5 text-sm font-semibold text-makmex-muted"
          }
        >
          {inStock ? "Add" : "Out"}
        </button>
      </div>
    </div>
  );
}
