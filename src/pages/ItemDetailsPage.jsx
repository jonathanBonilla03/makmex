import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProductById, getComboById, getKitById } from '../lib/supabase';
import { useCart } from '../context/CartContext';

// Helper function to format condition display with emoji and symbol
function getConditionDisplay(conditionName, conditionId) {
  const conditionIdMap = {
    'AA': { emoji: '🟢', display: 'New' },
    'A': { emoji: '🟢', display: 'New' },
    'B': { emoji: '🟡', display: 'Pre-Owned' },
    'C': { emoji: '🟠', display: 'Pre-Owned' },
    'D': { emoji: '🟠', display: 'Used' },
    'E': { emoji: '🔴', display: 'Used' },
    'F': { emoji: '🔴', display: 'Used' }
  };

  let condition;
  if (conditionId && conditionIdMap[conditionId]) {
    condition = conditionIdMap[conditionId];
  } else {
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
  
  if (conditionId) {
    return `${condition.emoji} ${condition.display} (${conditionId})`;
  }
  
  return `${condition.emoji} ${condition.display}`;
}

function ImageCarousel({ images, currentIndex, onIndexChange }) {
  if (!images || images.length === 0) {
    return (
      <div className="w-full h-96 bg-black/30 rounded-2xl flex items-center justify-center text-makmex-muted">
        No image available
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="w-full h-96 bg-black/30 rounded-2xl overflow-hidden">
        <img 
          src={images[0]} 
          alt="Product" 
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full h-96 bg-black/30 rounded-2xl overflow-hidden">
      <img 
        src={images[currentIndex]} 
        alt={`Product ${currentIndex + 1}`} 
        className="w-full h-full object-contain"
      />
      
      {/* Image indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => onIndexChange(index)}
            className={`w-2 h-2 rounded-full transition ${
              index === currentIndex 
                ? 'bg-makmex-orange' 
                : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
      
      {/* Navigation arrows */}
      <button
        onClick={() => onIndexChange(currentIndex === 0 ? images.length - 1 : currentIndex - 1)}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
      >
        ←
      </button>
      <button
        onClick={() => onIndexChange(currentIndex === images.length - 1 ? 0 : currentIndex + 1)}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition"
      >
        →
      </button>
    </div>
  );
}

function ProductDetails({ product, isSubItem = false }) {
  if (!product) return null;

  return (
    <div className={`space-y-4 ${isSubItem ? 'p-4 border border-makmex-border rounded-lg bg-makmex-surface/50' : ''}`}>
      {isSubItem && (
        <h4 className="font-semibold text-lg">{product.description}</h4>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div><span className="font-medium text-makmex-muted">SKU:</span> {product.display_sku || product.sku}</div>
          {product.brand_name && (
            <div><span className="font-medium text-makmex-muted">Brand:</span> {product.brand_name}</div>
          )}
          {product.condition_name && (
            <div><span className="font-medium text-makmex-muted">Condition:</span> {getConditionDisplay(product.condition_name, product.condition_id)}</div>
          )}
          {product.product_type_name && (
            <div><span className="font-medium text-makmex-muted">Type:</span> {product.product_type_name}</div>
          )}
        </div>
        
        <div className="space-y-2">
          {product.power_source && product.power_source !== 'none' && (
            <div><span className="font-medium text-makmex-muted">Power:</span> {product.power_source}</div>
          )}
          {product.warehouse_location && (
            <div><span className="font-medium text-makmex-muted">Location:</span> {product.warehouse_location}</div>
          )}
          {product.quantity !== undefined && (
            <div><span className="font-medium text-makmex-muted">Stock:</span> {product.quantity} available</div>
          )}
          {isSubItem && product.role && (
            <div><span className="font-medium text-makmex-muted">Role:</span> {product.role}</div>
          )}
        </div>
      </div>
      
      {product.specs && (
        <div>
          <div className="font-medium text-makmex-muted mb-1">Specifications:</div>
          <p className="text-sm">{product.specs}</p>
        </div>
      )}
      
      {product.condition_description && (
        <div>
          <div className="font-medium text-makmex-muted mb-1">Condition Details:</div>
          <p className="text-sm">{product.condition_description}</p>
        </div>
      )}
    </div>
  );
}

export default function ItemDetailsPage() {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentItemIndex, setCurrentItemIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    async function loadItem() {
      setLoading(true);
      setError(null);

      try {
        let result;
        switch (type) {
          case 'product':
            result = await getProductById(id);
            break;
          case 'combo':
            result = await getComboById(id);
            break;
          case 'kit':
            result = await getKitById(id);
            break;
          default:
            throw new Error('Invalid item type');
        }

        if (!result.success) {
          throw new Error(result.error);
        }

        setItem(result.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadItem();
  }, [type, id]);

  const handleAddToCart = () => {
    if (item && item.in_stock) {
      for (let i = 0; i < quantity; i++) {
        addToCart(item);
      }
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Loading item...</div>
          <div className="text-makmex-muted">Please wait while we fetch the details.</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-400 mb-2">Error loading item</div>
          <div className="text-makmex-muted mb-4">{error}</div>
          <button 
            onClick={() => navigate(-1)}
            className="bg-makmex-orange text-black px-4 py-2 rounded-lg font-semibold hover:bg-makmex-ember"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-xl font-semibold mb-2">Item not found</div>
          <div className="text-makmex-muted mb-4">The requested item could not be found.</div>
          <button 
            onClick={() => navigate(-1)}
            className="bg-makmex-orange text-black px-4 py-2 rounded-lg font-semibold hover:bg-makmex-ember"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Prepare images array
  const images = [];
  if (type === 'product') {
    if (item.image_url) images.push(item.image_url);
  } else if (type === 'combo' || type === 'kit') {
    // Add main item image if it exists
    if (item.image_url) images.push(item.image_url);
    
    // Add images from sub-items
    const subItems = type === 'combo' ? item.combo_items : item.kit_items;
    if (subItems) {
      subItems.forEach(subItem => {
        if (subItem.products?.image_url) {
          images.push(subItem.products.image_url);
        }
      });
    }
  }

  // Current sub-item for combos/kits
  const subItems = type === 'combo' ? item.combo_items : (type === 'kit' ? item.kit_items : null);
  const currentSubItem = subItems?.[currentItemIndex];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Back button */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-6 text-makmex-muted hover:text-makmex-text flex items-center gap-2"
      >
        ← Back to catalog
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Image section */}
        <div>
          <ImageCarousel 
            images={images} 
            currentIndex={currentImageIndex} 
            onIndexChange={setCurrentImageIndex} 
          />
        </div>

        {/* Details section */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-makmex-muted">{item.brand_name}</span>
              {item.condition_name !== "New" && item.condition_name !== "New in Box" && item.condition_name !== "New without a box" && (
                <span className="rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide bg-yellow-500/20 text-yellow-300">
                  {getConditionDisplay(item.condition_name, item.condition_id)}
                </span>
              )}
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide ${
                type === 'product' ? 'bg-green-500/20 text-green-300' :
                type === 'combo' ? 'bg-blue-500/20 text-blue-300' : 
                'bg-purple-500/20 text-purple-300'
              }`}>
                {type === 'product' ? '🔧 PRODUCT' : 
                 type === 'combo' ? '🎁 COMBO' : '🧰 KIT'}
              </span>
            </div>
            
            <h1 className="text-2xl font-bold mb-2">{item.name || item.description}</h1>
            
            <div className="text-3xl font-extrabold text-makmex-orange mb-4">
              {item.price.toFixed(2)} MXN
            </div>
            
            {item.quantity > 0 && item.quantity <= 5 && (
              <div className="text-amber-600 font-medium text-sm mb-4">
                Only {item.quantity} left in stock!
              </div>
            )}
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium">Quantity:</label>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded bg-makmex-border hover:bg-makmex-surface flex items-center justify-center text-sm font-bold"
                >
                  -
                </button>
                <span className="w-12 text-center">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(item.quantity || 99, quantity + 1))}
                  className="w-8 h-8 rounded bg-makmex-border hover:bg-makmex-surface flex items-center justify-center text-sm font-bold"
                >
                  +
                </button>
              </div>
            </div>
            
            <button
              onClick={handleAddToCart}
              disabled={!item.in_stock}
              className={`w-full py-3 rounded-lg font-semibold text-lg transition ${
                item.in_stock
                  ? addedToCart
                    ? "bg-green-600 text-white"
                    : "bg-makmex-orange text-black hover:bg-makmex-ember"
                  : "bg-makmex-border text-makmex-muted cursor-not-allowed"
              }`}
            >
              {addedToCart ? "Added to Cart!" : 
               item.in_stock ? "Add to Cart" : "Out of Stock"}
            </button>
          </div>

          {/* Main item details */}
          <ProductDetails product={item} />
        </div>
      </div>

      {/* Sub-items for combos/kits */}
      {subItems && subItems.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-6">
            Included Items ({subItems.length})
          </h2>
          
          {subItems.length > 1 && (
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {subItems.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentItemIndex(index)}
                  className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                    index === currentItemIndex
                      ? 'bg-makmex-orange text-black'
                      : 'bg-makmex-border text-makmex-text hover:bg-makmex-surface'
                  }`}
                >
                  Item {index + 1}
                </button>
              ))}
            </div>
          )}
          
          {currentSubItem && (
            <ProductDetails 
              product={{
                ...currentSubItem.products,
                quantity: currentSubItem.quantity,
                role: currentSubItem.role
              }} 
              isSubItem={true} 
            />
          )}
        </div>
      )}
    </div>
  );
}