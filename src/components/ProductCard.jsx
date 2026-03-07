import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

// Helper to map condition names to emojis
function getEmojiForCondition(conditionName) {
  const conditionNameMap = {
    'New': '🟢',
    'New in Box': '🟢',
    'New without a box': '🟢',
    'Pre-owned (minimal defects)': '🟡',
    'Pre-owned (moderate wear)': '🟠',
    'Used': '🟠',
    'Used (notable touches)': '🔴',
    'Very Used': '🔴'
  };
  return conditionNameMap[conditionName] || '🟢';
}

export default function ProductCard({
  id,
  description = "Power Tool",
  sku,
  display_sku,
  image_url,
  primary_image,
  images = [],
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
  const { t, formatPrice, translateConditionName, translatePowerSource } = useLanguage();

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
      <div className="rounded-2xl border border-makmex-border bg-makmex-panel p-3 sm:p-5 shadow-card transition hover:border-makmex-orange/60">
        {/* Image - Reduced height on mobile */}
        <div className="mb-3 sm:mb-4 flex h-24 sm:h-36 items-center justify-center rounded-xl bg-black/30 text-xs text-makmex-muted overflow-hidden">
          {primary_image?.signed_url || image_url ? (
            <img 
              src={primary_image?.signed_url || image_url} 
              alt={description}
              className="w-full h-full object-contain"
            />
          ) : (
            "Image"
          )}
        </div>

        {/* Brand and condition - Stack on very small screens */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
          <div className="text-xs font-semibold text-makmex-muted truncate">{brand_name}</div>
          
          {condition_name !== "New" && condition_name !== "New in Box" && condition_name !== "New without a box" && (
            <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide bg-yellow-500/20 text-yellow-300 whitespace-nowrap">
              {getEmojiForCondition(condition_name)} {translateConditionName(condition_name)} ({condition_id})
            </span>
          )}
        </div>

        {/* Title - Smaller on mobile */}
        <h3 className="mt-2 text-xs sm:text-sm font-bold leading-snug line-clamp-2 mb-2 sm:mb-3">{description}</h3>
        
        {/* Metadata - Reduced spacing on mobile */}
        <div className="text-[11px] sm:text-xs text-makmex-muted space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
          {display_sku && <p className="truncate" title={display_sku}><span className="font-medium">{t('sku')}:</span> {display_sku}</p>}
          {power_source && power_source !== 'none' && (
            <p className="truncate">{t('power')}: {translatePowerSource(power_source)}</p>
          )}
          {specs && <p className="line-clamp-1" title={specs}>{t('specs')}: {specs}</p>}
          {warehouse_location && <p className="truncate">{t('location')}: {warehouse_location}</p>}
          {quantity > 0 && quantity <= 5 && (
            <p className="text-amber-600">{t('limitedStock', { quantity })}</p>
          )}
        </div>

        {/* Price and button - Stack on very narrow screens */}
        <div className="mt-3 sm:mt-5 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2">
          <span className="text-base sm:text-lg font-extrabold">{formatPrice(price)}</span>

          <button
            disabled={!in_stock || !canAdd}
            onClick={handleAddToCart}
            className={
              in_stock && canAdd
                ? "rounded-lg bg-makmex-orange px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-black hover:bg-makmex-ember whitespace-nowrap"
                : "cursor-not-allowed rounded-lg bg-makmex-border px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-makmex-muted whitespace-nowrap"
            }
          >
            {!in_stock ? t('outOfStock') : 
             !canAdd ? `${t('inCart')} (${quantityInCart})` : 
             t('addToCart')}
          </button>
        </div>

        {/* Product Type at Bottom Center */}
        <div className="mt-2 sm:mt-3 text-center">
          <span className="inline-block rounded-md bg-makmex-surface px-2.5 py-1 text-[10px] sm:text-xs font-medium text-makmex-muted border border-makmex-border">
            {product_type_name}
          </span>
        </div>
      </div>
    </Link>
  );
}
