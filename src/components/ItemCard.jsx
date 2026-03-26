import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

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

function getTranslatedConditionName(conditionName, conditionId, translateConditionName) {
  // Map condition IDs to full condition names for proper translation
  const idToNameMap = {
    'AA': 'New (in box)',
    'A': 'New (without a box)',
    'B': 'Pre-owned (minimal defects)',
    'C': 'Pre-owned (moderate wear)',
    'D': 'Used',
    'E': 'Used (notable touches)',
    'F': 'Very Used'
  };
  
  // If condition_name is just 'New', use the mapping based on condition_id
  if (conditionName === 'New' && idToNameMap[conditionId]) {
    return translateConditionName(idToNameMap[conditionId]);
  }
  
  return translateConditionName(conditionName);
}

function getTypeBadge(type, t) {
  if (type === 'combo') {
    return { label: `🎁 ${t('combo')}`, className: 'bg-blue-500/20 text-blue-300' };
  }

  if (type === 'kit') {
    return { label: `🧰 ${t('kit')}`, className: 'bg-purple-500/20 text-purple-300' };
  }

  return { label: `🛠️ ${t('product')}`, className: 'bg-makmex-surface text-makmex-muted border border-makmex-border' };
}

export default function ItemCard({
  id,
  name,
  description = 'Power Tool',
  sku,
  display_sku,
  image_url,
  primary_image,
  images = [],
  condition_id,
  power_source,
  specs,
  brand_name = 'Unknown Brand',
  condition_name = 'New',
  product_type_name = 'Tool',
  quantity,
  warehouse_location,
  item_count = 0,
  price = 199.99,
  in_stock = true,
  type = 'product',
  layout = 'compact',
  combo_items = [],
  kit_items = []
}) {
  const { addToCart, canAddToCart, getItemQuantityInCart } = useCart();
  const { t, formatPrice, translateConditionName, translatePowerSource } = useLanguage();

  const cardTitle = name || description;
  const displayImageUrl = primary_image?.card_url || primary_image?.public_url || image_url;
  
  const itemsList = type === 'combo' ? combo_items : (type === 'kit' ? kit_items : []);
  const displayItems = itemsList.map(ci => ({
    name: ci.products?.description || ci.products?.name || 'Unknown',
    brand: ci.products?.brand_name || 'Unknown Brand',
    sku: ci.products?.display_sku || ci.products?.sku || 'N/A'
  }));

  const cartItem = {
    id,
    name,
    description,
    sku,
    display_sku,
    image_url: displayImageUrl,
    price,
    quantity,
    type
  };

  const quantityInCart = getItemQuantityInCart(id, type);
  const canAdd = canAddToCart(cartItem);
  const badge = getTypeBadge(type, t);
  const lowStockText = quantity > 0 && quantity <= 5 ? t('limitedStock', { quantity }) : null;

  const handleAddToCart = (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (canAdd) {
      addToCart(cartItem);
    }
  };

  const actionButtonClass = in_stock && canAdd
    ? 'rounded-lg bg-makmex-orange px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-black hover:bg-makmex-ember whitespace-nowrap'
    : 'cursor-not-allowed rounded-lg bg-makmex-border px-2 sm:px-3 py-1.5 sm:py-2 text-xs font-semibold text-makmex-muted whitespace-nowrap';

  const buttonLabel = !in_stock ? t('outOfStock') : (!canAdd ? `${t('inCart')} (${quantityInCart})` : t('addToCart'));

  if (layout === 'standard') {
    return (
      <Link to={`/item/${type}/${id}`} className="block">
        <div className="rounded-2xl border border-makmex-border bg-makmex-panel p-3 shadow-card transition hover:border-makmex-orange/60">
          <div className="flex flex-col gap-3 lg:grid lg:grid-cols-[11rem_minmax(0,1fr)_20rem] lg:items-stretch">
            <div className="w-full lg:w-[11rem] flex-shrink-0">
              <div className="flex h-48 w-full items-center justify-center overflow-hidden rounded-xl border border-makmex-border bg-black/30 text-xs text-makmex-muted">
                {displayImageUrl ? (
                  <img
                    src={displayImageUrl}
                    alt={cardTitle}
                    className="h-full w-full object-contain"
                    loading="lazy"
                    decoding="async"
                    fetchPriority="low"
                    onError={(event) => {
                      if (primary_image?.public_url && event.currentTarget.src !== primary_image.public_url) {
                        event.currentTarget.src = primary_image.public_url;
                      }
                    }}
                  />
                ) : (
                  'Image'
                )}
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="mb-1.5 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-makmex-muted truncate">{brand_name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-bold tracking-wide whitespace-nowrap ${badge.className}`}>
                  {badge.label}
                </span>
              </div>

              <h3 className="text-base font-extrabold leading-tight mb-1.5 line-clamp-2">{cardTitle}</h3>

              {condition_name && (
                <div className="mb-2">
                  <span className="inline-flex rounded-full px-2 py-0.5 text-xs font-bold tracking-wide bg-yellow-500/20 text-yellow-300 whitespace-nowrap">
                    {getEmojiForCondition(condition_name)} {getTranslatedConditionName(condition_name, condition_id, translateConditionName)} {condition_id ? `(${condition_id})` : ''}
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2 text-xs text-makmex-muted sm:grid-cols-[8rem_minmax(0,1fr)]">
                <div className="space-y-1.5 pr-2">
                  <p className="text-base font-extrabold text-makmex-text">{formatPrice(price)}</p>
                  <button
                    disabled={!in_stock || !canAdd}
                    onClick={handleAddToCart}
                    className={`${actionButtonClass} w-full max-w-[8rem] text-xs py-1.5`}
                  >
                    {buttonLabel}
                  </button>
                  {lowStockText && <p className="text-xs text-amber-600 font-semibold">{lowStockText}</p>}
                </div>

                <div className="space-y-1 min-w-0 text-xs">
                  {display_sku && <p className="truncate" title={display_sku}><span className="font-medium">{t('sku')}:</span> {display_sku}</p>}
                  {warehouse_location && <p className="truncate"><span className="font-medium">{t('location')}:</span> {warehouse_location}</p>}
                  {power_source && power_source !== 'none' && <p className="truncate"><span className="font-medium">{t('power')}:</span> {translatePowerSource(power_source)}</p>}
                  {product_type_name && <p className="truncate"><span className="font-medium">{t('type')}:</span> {product_type_name}</p>}
                  {item_count > 0 && <p className="truncate"><span className="font-medium">Items:</span> {item_count}</p>}
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[20rem] flex-shrink-0">
              <div className="h-48 w-full rounded-xl border border-makmex-border bg-makmex-surface p-3 text-xs text-makmex-muted overflow-y-auto">
                {type === 'combo' || type === 'kit' ? (
                  <>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-makmex-text">{t('products')}</p>
                    <div className="space-y-2">
                      {displayItems.map((item, idx) => (
                        <div key={idx} className="pb-2 border-b border-makmex-border last:border-b-0">
                          <p className="font-semibold text-makmex-text line-clamp-2 text-xs">{item.name}</p>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wide text-makmex-text">{t('specs')}</p>
                    <p className="whitespace-pre-wrap leading-relaxed text-xs">{specs || '—'}</p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/item/${type}/${id}`} className="block w-full">
      <div className="rounded-2xl border border-makmex-border bg-makmex-panel p-3 sm:p-5 shadow-card transition hover:border-makmex-orange/60 h-full">
        <div className="mb-3 sm:mb-4 flex h-24 sm:h-36 items-center justify-center rounded-xl bg-black/30 text-xs text-makmex-muted overflow-hidden">
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt={cardTitle}
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              onError={(event) => {
                if (primary_image?.public_url && event.currentTarget.src !== primary_image.public_url) {
                  event.currentTarget.src = primary_image.public_url;
                }
              }}
            />
          ) : (
            'Image'
          )}
        </div>

        <div className="text-xs font-semibold text-makmex-muted truncate mb-2">{brand_name}</div>

        <h3 className="text-xs sm:text-sm font-bold leading-snug line-clamp-2 mb-2">{cardTitle}</h3>

        {condition_name && (
          <div className="mb-2">
            <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide bg-yellow-500/20 text-yellow-300 whitespace-nowrap">
              {getEmojiForCondition(condition_name)} {getTranslatedConditionName(condition_name, condition_id, translateConditionName)} {condition_id ? `(${condition_id})` : ''}
            </span>
          </div>
        )}

        <div className="text-[11px] sm:text-xs text-makmex-muted space-y-1 sm:space-y-1.5 mb-3 sm:mb-4">
          {display_sku && <p className="truncate" title={display_sku}><span className="font-medium">{t('sku')}:</span> {display_sku}</p>}
          {power_source && power_source !== 'none' && (
            <p className="truncate">{t('power')}: {translatePowerSource(power_source)}</p>
          )}
          {specs && <p className="line-clamp-1" title={specs}>{t('specs')}: {specs}</p>}
          {warehouse_location && <p className="truncate">{t('location')}: {warehouse_location}</p>}
          {item_count > 0 && <p className="truncate">Items: {item_count}</p>}
          {quantity > 0 && quantity <= 5 && (
            <p className="text-amber-600">{t('limitedStock', { quantity })}</p>
          )}
        </div>

        <div className="mt-3 sm:mt-5 flex flex-col xs:flex-row items-stretch xs:items-center justify-between gap-2">
          <span className="text-base sm:text-lg font-extrabold">{formatPrice(price)}</span>

          <button
            disabled={!in_stock || !canAdd}
            onClick={handleAddToCart}
            className={actionButtonClass}
          >
            {buttonLabel}
          </button>
        </div>

        <div className="mt-2 sm:mt-3 flex items-center gap-2 flex-wrap justify-center">
          <span className={`inline-block rounded-md px-2 py-1 text-[10px] sm:text-xs font-medium whitespace-nowrap ${badge.className}`}>
            {badge.label}
          </span>
          {product_type_name && (
            <span className="inline-block rounded-md bg-makmex-surface px-2 py-1 text-[10px] sm:text-xs font-medium text-makmex-muted border border-makmex-border">
              {product_type_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
