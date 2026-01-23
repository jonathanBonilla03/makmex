export default function ProductCard({
  id,
  description = "Power Tool",
  sku,
  image_url,
  condition_id,
  product_type_id,
  brand_id,
  power_source,
  specs,
  // Derived display fields (from JOINs)
  brand_name = "Unknown Brand",
  condition_name = "New",
  condition_description,
  product_type_name = "Tool",
  // Inventory information (customer-relevant only)
  quantity,
  warehouse_name,
  // Customer pricing and availability
  price = 199.99,
  in_stock = true,
}) {
  return (
    <div className="rounded-2xl border border-makmex-border bg-makmex-panel p-4 shadow-card transition hover:border-makmex-orange/60">
      <div className="mb-3 flex h-32 items-center justify-center rounded-xl bg-black/30 text-xs text-makmex-muted overflow-hidden">
        {image_url ? (
          <img 
            src={image_url} 
            alt={description}
            className="w-full h-full object-contain"
          />
        ) : (
          "Image"
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div className="text-xs font-semibold text-makmex-muted">{brand_name}</div>
        
        {condition_name !== "New" && (
          <span className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-yellow-500/20 text-yellow-300">
            {condition_name}
          </span>
        )}
      </div>

      <h3 className="mt-1 text-sm font-bold leading-snug line-clamp-2">{description}</h3>
      <div className="mt-0.5 text-xs text-makmex-muted space-y-1">
        {sku && <p><span className="font-medium">SKU:</span> {sku}</p>}
        {power_source && <p>Power: {power_source}</p>}
        {specs && <p className="line-clamp-1" title={specs}>Specs: {specs}</p>}
        {warehouse_name && <p>Location: {warehouse_name}</p>}
        {quantity > 0 && quantity <= 5 && (
          <p className="text-amber-600">Only {quantity} left!</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="text-lg font-extrabold">${price.toFixed(2)}</span>

        <button
          disabled={!in_stock}
          className={
            in_stock
              ? "rounded-lg bg-makmex-orange px-3 py-1.5 text-sm font-semibold text-black hover:bg-makmex-ember"
              : "cursor-not-allowed rounded-lg bg-makmex-border px-3 py-1.5 text-sm font-semibold text-makmex-muted"
          }
        >
          {in_stock ? "Add" : "Out"}
        </button>
      </div>
    </div>
  );
}
