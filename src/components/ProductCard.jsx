import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

// Helper function to format condition display with emoji and symbol
function getConditionDisplay(conditionName, conditionId) {
  // Map by condition ID for more reliable mapping
  const conditionIdMap = {
    'AA': { emoji: '🟢', display: 'New' },      // New in Box
    'A': { emoji: '🟢', display: 'New' },       // New without a box
    'B': { emoji: '🟡', display: 'Pre-Owned' }, // Pre-owned (minimal defects)
    'C': { emoji: '🟠', display: 'Pre-Owned' }, // Pre-owned (moderate wear)
    'D': { emoji: '🟠', display: 'Used' },      // Used
    'E': { emoji: '🔴', display: 'Used' },      // Used (notable touches)
    'F': { emoji: '🔴', display: 'Used' }       // Very Used
  };

  // Use condition ID mapping if available, otherwise fallback to name mapping
  let condition;
  if (conditionId && conditionIdMap[conditionId]) {
    condition = conditionIdMap[conditionId];
  } else {
    // Fallback name mapping for cases where ID is not available
    const conditionNameMap = {
      'New': { emoji: '🟢', display: 'New' },
      'New in Box': { emoji: '🟢', display: 'New' },
      'New without a box': { emoji: '🟢', display: 'New' },
      'Pre-owned (minimal defects)': { emoji: '🟡', display: 'Pre-Owned' },
      'Pre-owned (moderate wear)': { emoji: '🟠', display: 'Pre-Owned' },
      'Used': { emoji: '🟠', display: 'Used' },
      'Used (notable touches)': { emoji: '🔴', display: 'Used' },
      'Very Used': { emoji: '🔴', display: 'Used' }
    };
    condition = conditionNameMap[conditionName] || { emoji: '🟢', display: 'New' };
  }
  
  // Add condition ID symbol if available
  if (conditionId) {
    return `${condition.emoji} ${condition.display} (${conditionId})`;
  }
  
  return `${condition.emoji} ${condition.display}`;
}

export default function ProductCard({
  id,
  description = "Power Tool",
  sku,
  display_sku,
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
  warehouse_location,
  warehouse_name,
  // Customer pricing and availability
  price = 199.99,
  in_stock = true,
  type = "product",
}) {
  const { addToCart, canAddToCart, getItemQuantityInCart } = useCart();
  const { t, formatPrice } = useLanguage();

  const productItem = {
    id,
    description,
    sku,
    display_sku,
    image_url,
    price,
    quantity,
    type: 'product'
  };

  const quantityInCart = getItemQuantityInCart(id, 'product');
  const canAdd = canAddToCart(productItem);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (canAdd) {
      addToCart(productItem);
    }
  };

  return (
    <Link to={`/item/product/${id}`} className="block">
      <div className="rounded-2xl border border-makmex-border bg-makmex-panel p-5 shadow-card transition hover:border-makmex-orange/60">
        <div className="mb-4 flex h-36 items-center justify-center rounded-xl bg-black/30 text-xs text-makmex-muted overflow-hidden">
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

        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="text-xs font-semibold text-makmex-muted">{brand_name}</div>
          
          {condition_name !== "New" && condition_name !== "New in Box" && condition_name !== "New without a box" && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide bg-yellow-500/20 text-yellow-300">
              {getConditionDisplay(condition_name, condition_id)}
            </span>
          )}
        </div>

        <h3 className="mt-2 text-sm font-bold leading-snug line-clamp-2 mb-3">{description}</h3>
        <div className="text-xs text-makmex-muted space-y-1.5 mb-4">
          {display_sku && <p><span className="font-medium">SKU:</span> {display_sku}</p>}
          {power_source && power_source !== 'none' && (
            <p>Power: {power_source === 'none' ? 'No Power Source' : power_source === 'cable' ? 'Cable' : power_source}</p>
          )}
          {specs && <p className="line-clamp-1" title={specs}>Specs: {specs}</p>}
          {warehouse_location && <p>Location: {warehouse_location}</p>}
          {quantity > 0 && quantity <= 5 && (
            <p className="text-amber-600">Only {quantity} left!</p>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between">
          <span className="text-lg font-extrabold">{formatPrice(price)}</span>

          <button
            disabled={!in_stock || !canAdd}
            onClick={handleAddToCart}
            className={
              in_stock && canAdd
                ? "rounded-lg bg-makmex-orange px-4 py-2 text-sm font-semibold text-black hover:bg-makmex-ember"
                : "cursor-not-allowed rounded-lg bg-makmex-border px-4 py-2 text-sm font-semibold text-makmex-muted"
            }
          >
            {!in_stock ? t('outOfStock') : 
             !canAdd ? `${t('inCart')} (${quantityInCart})` : 
             t('addToCart')}
          </button>
        </div>

        {/* Product Type at Bottom Center */}
        <div className="mt-3 text-center">
          <span className="inline-block rounded-md bg-makmex-surface px-2.5 py-1 text-xs font-medium text-makmex-muted border border-makmex-border">
            {product_type_name}
          </span>
        </div>
      </div>
    </Link>
  );
}
