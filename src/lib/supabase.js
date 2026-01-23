import { createClient } from '@supabase/supabase-js'

// These should be stored in environment variables in a production app
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Get all products with their related data (brands, conditions, product types, inventory)
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getProducts() {
  try {
    console.log('🔍 Fetching products from Supabase...')
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        description,
        sku,
        image_url,
        condition_id,
        product_type_id,
        brand_id,
        power_source,
        specs,
        brands!brand_id (
          id,
          name
        ),
        conditions!condition_id (
          id,
          general_condition,
          full_description
        ),
        product_types!product_type_id (
          id,
          name
        ),
        inventory (
          id,
          quantity,
          warehouse_location,
          last_updated,
          warehouse!warehouse_location (
            id,
            name,
            address
          )
        )
      `)

    console.log('📊 Products query result:', { data, error })

    if (error) {
      console.error('❌ Products query error:', error)
      return { success: false, error: error.message }
    }

    // Transform the data to include calculated fields
    const transformedData = data.map(product => {
      // Sum up inventory quantities across all warehouses
      const totalQuantity = product.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0
      
      // Get primary warehouse (first one with stock, or first one if none have stock)
      const primaryInventory = product.inventory?.find(inv => inv.quantity > 0) || product.inventory?.[0]
      
      // Create condition suffix mapping based on actual condition IDs
      const conditionSuffixes = {
        'A': 'A',            // New without a box
        'AA': 'AA',          // New in Box  
        'B': 'B',            // Pre-owned (minimal defects)
        'C': 'C',            // Pre-owned (moderate wear)
        'D': 'D',            // Used
        'E': 'E',            // Used (notable touches)
        'F': 'F'             // Very Used
      }
      
      // Generate SKU with condition suffix only if SKU doesn't already have one
      let displaySku = product.sku;
      if (product.sku && product.condition_id) {
        const conditionSuffix = conditionSuffixes[product.condition_id];
        if (conditionSuffix) {
          // Check if SKU already ends with a condition pattern (like -AA, -B, etc.)
          const hasConditionSuffix = /-[A-F]{1,2}$/.test(product.sku);
          if (!hasConditionSuffix) {
            displaySku = `${product.sku}-${conditionSuffix}`;
          }
          // If it already has a suffix, use the original SKU as-is
        }
      }
      
      return {
        ...product,
        // Flatten related data for easier use
        brand_name: product.brands?.name || 'Unknown Brand',
        condition_name: product.conditions?.general_condition || 'New',
        condition_description: product.conditions?.full_description || '',
        product_type_name: product.product_types?.name || 'Tool',
        
        // Enhanced SKU with condition suffix
        display_sku: displaySku,
        
        // Inventory info
        quantity: totalQuantity,
        in_stock: totalQuantity > 0,
        warehouse_location: primaryInventory?.warehouse_location || null,
        warehouse_name: primaryInventory?.warehouse?.name || null,
        warehouse_address: primaryInventory?.warehouse?.address || null,
        
        // Add a mock price (you can add a price column to your products table later)
        price: Math.floor(Math.random() * 300 + 50) + 0.99
      }
    })

    // Only return products that are in stock
    const inStockProducts = transformedData.filter(product => product.in_stock)

    return { success: true, data: inStockProducts }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get all brands
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getBrands() {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name')
      .order('name')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get all conditions
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getConditions() {
  try {
    const { data, error } = await supabase
      .from('conditions')
      .select('id, general_condition, full_description')
      .order('general_condition')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get all product types
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getProductTypes() {
  try {
    const { data, error } = await supabase
      .from('product_types')
      .select('id, name')
      .order('name')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get all warehouses
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getWarehouses() {
  try {
    const { data, error } = await supabase
      .from('warehouse')
      .select('id, name, address')
      .order('name')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get unique power sources from products
 * @returns {Promise<{success: boolean, data?: string[], error?: string}>}
 */
export async function getPowerSources() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('power_source')

    if (error) {
      return { success: false, error: error.message }
    }

    // Get unique power sources, filter out null/undefined, and map display names
    const uniquePowerSources = [...new Set(data.map(p => p.power_source).filter(Boolean))]
    
    // Map power sources to display names
    const powerSourcesWithDisplay = uniquePowerSources.map(ps => ({
      value: ps,
      display: ps === 'none' ? 'No Power Source' : 
               ps === 'cable' ? 'Cable' : 
               ps // Default: use as-is
    }))

    // Custom sort: No Power Source first, then Cable, then voltage patterns (M_, _V), then alphabetical
    powerSourcesWithDisplay.sort((a, b) => {
      const aVal = a.value;
      const bVal = b.value;
      
      // Priority order: none, cable, M_ patterns, _V patterns, then alphabetical
      if (aVal === 'none') return -1;
      if (bVal === 'none') return 1;
      if (aVal === 'cable') return -1;
      if (bVal === 'cable') return 1;
      
      // Check for M_ patterns (like M12, M18)
      const aIsM = /^M\d+/.test(aVal);
      const bIsM = /^M\d+/.test(bVal);
      
      // Check for _V patterns (like 12V, 18V, 20V)
      const aIsV = /^\d+V?$/.test(aVal);
      const bIsV = /^\d+V?$/.test(bVal);
      
      // Both are M_ patterns - sort by number
      if (aIsM && bIsM) {
        const aNum = parseInt(aVal.match(/\d+/)[0]);
        const bNum = parseInt(bVal.match(/\d+/)[0]);
        return aNum - bNum;
      }
      
      // Both are _V patterns - sort by voltage number
      if (aIsV && bIsV) {
        const aNum = parseInt(aVal.match(/\d+/)[0]);
        const bNum = parseInt(bVal.match(/\d+/)[0]);
        return aNum - bNum;
      }
      
      // M_ patterns come before _V patterns
      if (aIsM && !bIsM) return -1;
      if (!aIsM && bIsM) return 1;
      if (aIsV && !bIsV && !bIsM) return -1;
      if (!aIsV && bIsV && !aIsM) return 1;
      
      // Default alphabetical sort
      return aVal.localeCompare(bVal);
    });

    return { success: true, data: powerSourcesWithDisplay }
  } catch (err) {
    return { success: false, error: err.message }
  }
}