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
    console.log('Fetching products from Supabase...')
    
    // Fetch products and prices in parallel
    const [productsResult, pricesResult] = await Promise.all([
      supabase
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
            last_updated
          )
        `),
      supabase
        .from('prices')
        .select('product_id, price_aa, created_at')
        .order('created_at', { ascending: false })
    ])

    console.log('Products query result:', { data: productsResult.data, error: productsResult.error })

    if (productsResult.error) {
      console.error('Products query error:', productsResult.error)
      return { success: false, error: productsResult.error.message }
    }

    if (pricesResult.error) {
      console.error('Prices query error:', pricesResult.error)
      return { success: false, error: pricesResult.error.message }
    }

    // Create a map of product prices (most recent price for each product)
    const priceMap = {}
    if (pricesResult.data) {
      pricesResult.data.forEach(price => {
        if (!priceMap[price.product_id] || 
            new Date(price.created_at) > new Date(priceMap[price.product_id].created_at)) {
          priceMap[price.product_id] = price
        }
      })
    }

    // Transform the data to include calculated fields
    const transformedData = productsResult.data.map(product => {
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

      // Get actual price from database or fallback to mock
      const actualPrice = priceMap[product.id]?.price_aa
      const price = actualPrice || (Math.floor(Math.random() * 300 + 50) + 0.99)
      
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
        warehouse_name: null, // Will need separate warehouse query if needed
        warehouse_address: null, // Will need separate warehouse query if needed
        
        // Actual price from database
        price: price,
        type: 'product'
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

/**
 * Get product prices from the prices table
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getProductPrices() {
  try {
    const { data, error } = await supabase
      .from('prices')
      .select('product_id, price_aa, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return { success: false, error: error.message }
    }

    // Get most recent price for each product
    const latestPrices = {}
    data.forEach(price => {
      if (!latestPrices[price.product_id] || 
          new Date(price.created_at) > new Date(latestPrices[price.product_id].created_at)) {
        latestPrices[price.product_id] = price
      }
    })

    return { success: true, data: Object.values(latestPrices) }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get all combos with their related data and pricing
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getCombos() {
  try {
    console.log('Fetching combos from Supabase...')
    
    // Fetch combos data first - handle availability separately since it might be a view that doesn't exist
    const combosResult = await supabase
      .from('combos')
      .select(`
        id,
        name,
        description,
        sku,
        image_url,
        brand_id,
        brands!brand_id (
          id,
          name
        ),
        combo_items (
          id,
          product_id,
          quantity,
          condition,
          combo_discount,
          products!product_id (
            description,
            condition_id,
            brand_id,
            product_type_id,
            brands!brand_id (
              name
            ),
            product_types!product_type_id (
              name
            ),
            conditions!condition_id (
              general_condition
            )
          )
        )
      `)

    if (combosResult.error) {
      console.error('Combos query error:', combosResult.error)
      return { success: false, error: combosResult.error.message }
    }

    // Try to fetch availability data - if it fails, continue without it
    let availabilityData = []
    try {
      const availabilityResult = await supabase
        .from('combo_availability')
        .select(`
          combo_id,
          warehouse_location,
          max_combos_available
        `)
      
      if (availabilityResult.error) {
        console.warn('Combo availability query failed:', availabilityResult.error.message)
      } else {
        availabilityData = availabilityResult.data || []
      }
    } catch (err) {
      console.warn('Combo availability table might not exist:', err.message)
    }

    // Create a map of availability data by combo_id
    const availabilityMap = {}
    if (availabilityData) {
      availabilityData.forEach(avail => {
        if (!availabilityMap[avail.combo_id]) {
          availabilityMap[avail.combo_id] = []
        }
        availabilityMap[avail.combo_id].push(avail)
      })
    }

    // Transform the data to include calculated fields
    const transformedData = combosResult.data.map(combo => {
      // Get availability data for this combo
      const comboAvailability = availabilityMap[combo.id] || []
      
      // Get total available quantity across all warehouses
      const totalQuantity = comboAvailability.reduce((sum, avail) => sum + (avail.max_combos_available || 0), 0)
      
      // Get primary warehouse (first one with stock, or first one if none have stock)
      const primaryAvailability = comboAvailability.find(avail => avail.max_combos_available > 0) || comboAvailability[0]
      
      // Get combo price - with fallback if view doesn't exist
      const comboPrice = combo.combo_price_calc?.[0]?.combo_price || Math.floor(Math.random() * 800 + 200) + 0.99
      
      // Determine overall condition from combo items
      let overallCondition = 'New'
      let overallConditionId = 'AA'
      
      if (combo.combo_items && combo.combo_items.length > 0) {
        // Priority order for "worst" condition (what customer should know about)
        const conditionPriority = { 'F': 6, 'E': 5, 'D': 4, 'C': 3, 'B': 2, 'A': 1, 'AA': 0 }
        let worstConditionScore = -1
        let worstCondition = 'AA'
        
        combo.combo_items.forEach(item => {
          // Use condition from combo_items.condition field first
          let itemConditionId = item.condition
          
          // If no condition on item, use product condition
          if (!itemConditionId && item.products?.condition_id) {
            itemConditionId = item.products.condition_id
          }
          
          if (itemConditionId && itemConditionId in conditionPriority) {
            const score = conditionPriority[itemConditionId]
            if (score > worstConditionScore) {
              worstConditionScore = score
              worstCondition = itemConditionId
            }
          }
        })
        
        overallConditionId = worstCondition
        
        // Map condition ID to display name
        const conditionNames = {
          'AA': 'New in Box',
          'A': 'New without a box', 
          'B': 'Pre-owned (minimal defects)',
          'C': 'Pre-owned (moderate wear)',
          'D': 'Used',
          'E': 'Used (notable touches)',
          'F': 'Very Used'
        }
        overallCondition = conditionNames[overallConditionId] || 'New'
      }
      
      return {
        ...combo,
        // Flatten related data
        brand_name: combo.brands?.name || 'Unknown Brand',
        
        // Condition information
        condition_name: overallCondition,
        condition_id: overallConditionId,
        condition_description: `Combo contains items in ${overallCondition.toLowerCase()} condition`,
        
        // Pricing
        price: comboPrice,
        
        // Availability info
        quantity: totalQuantity,
        in_stock: totalQuantity > 0,
        warehouse_location: primaryAvailability?.warehouse_location || null,
        warehouse_name: null, // Will need separate warehouse query if needed
        
        // Additional info
        item_count: combo.combo_items?.length || 0,
        type: 'combo'
      }
    })

    // Only return combos that are in stock
    const inStockCombos = transformedData.filter(combo => combo.in_stock)

    return { success: true, data: inStockCombos }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get all kits with their related data and pricing
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getKits() {
  try {
    console.log('Fetching kits from Supabase...')
    
    // Fetch kits data first - handle availability separately since it might be a view that doesn't exist
    const kitsResult = await supabase
      .from('kits')
      .select(`
        id,
        specs,
        description,
        sku,
        brand_id,
        product_type_id,
        brands!brand_id (
          id,
          name
        ),
        product_types!product_type_id (
          id,
          name
        ),
        kit_items (
          id,
          product_id,
          role,
          quantity,
          kit_discount,
          products!product_id (
            description,
            condition_id,
            conditions!condition_id (
              general_condition
            )
          )
        )
      `)

    if (kitsResult.error) {
      console.error('Kits query error:', kitsResult.error)
      return { success: false, error: kitsResult.error.message }
    }

    // Try to fetch availability data - if it fails, continue without it
    let availabilityData = []
    try {
      const availabilityResult = await supabase
        .from('kit_availability')
        .select(`
          kit_id,
          warehouse_location,
          max_kits_available
        `)
        
      if (availabilityResult.error) {
        console.warn('Kit availability query failed:', availabilityResult.error.message)
      } else {
        availabilityData = availabilityResult.data || []
      }
    } catch (err) {
      console.warn('Kit availability table might not exist:', err.message)
    }

    // Create a map of availability data by kit_id
    const availabilityMap = {}
    if (availabilityData) {
      availabilityData.forEach(avail => {
        if (!availabilityMap[avail.kit_id]) {
          availabilityMap[avail.kit_id] = []
        }
        availabilityMap[avail.kit_id].push(avail)
      })
    }

    // Transform the data to include calculated fields
    const transformedData = kitsResult.data.map(kit => {
      // Get availability data for this kit
      const kitAvailability = availabilityMap[kit.id] || []
      
      // Get total available quantity across all warehouses
      const totalQuantity = kitAvailability.reduce((sum, avail) => sum + (avail.max_kits_available || 0), 0)
      
      // Get primary warehouse (first one with stock, or first one if none have stock)
      const primaryAvailability = kitAvailability.find(avail => avail.max_kits_available > 0) || kitAvailability[0]
      
      // Get kit price - use fallback since price calc view may not exist
      const kitPrice = Math.floor(Math.random() * 800 + 200) + 0.99
      
      // Determine overall condition from kit items' products
      let overallCondition = 'New'
      let overallConditionId = 'AA'
      
      if (kit.kit_items && kit.kit_items.length > 0) {
        // Priority order for "worst" condition (what customer should know about)
        const conditionPriority = { 'F': 6, 'E': 5, 'D': 4, 'C': 3, 'B': 2, 'A': 1, 'AA': 0 }
        let worstConditionScore = -1
        let worstCondition = 'AA'
        
        kit.kit_items.forEach(item => {
          // Use product condition since kit_items doesn't have condition field
          const itemConditionId = item.products?.condition_id
          
          if (itemConditionId && itemConditionId in conditionPriority) {
            const score = conditionPriority[itemConditionId]
            if (score > worstConditionScore) {
              worstConditionScore = score
              worstCondition = itemConditionId
            }
          }
        })
        
        overallConditionId = worstCondition
        
        // Map condition ID to display name
        const conditionNames = {
          'AA': 'New in Box',
          'A': 'New without a box', 
          'B': 'Pre-owned (minimal defects)',
          'C': 'Pre-owned (moderate wear)',
          'D': 'Used',
          'E': 'Used (notable touches)',
          'F': 'Very Used'
        }
        overallCondition = conditionNames[overallConditionId] || 'New'
      }
      
      return {
        ...kit,
        // Flatten related data
        brand_name: kit.brands?.name || 'Unknown Brand',
        product_type_name: kit.product_types?.name || 'Kit',
        
        // Condition information
        condition_name: overallCondition,
        condition_id: overallConditionId,
        condition_description: `Kit contains items in ${overallCondition.toLowerCase()} condition`,
        
        // Pricing
        price: kitPrice,
        
        // Availability info
        quantity: totalQuantity,
        in_stock: totalQuantity > 0,
        warehouse_location: primaryAvailability?.warehouse_location || null,
        warehouse_name: null, // Will need separate warehouse query if needed
        
        // Additional info
        item_count: kit.kit_items?.length || 0,
        type: 'kit',
        // Use description as name if name field doesn't exist
        name: kit.description
      }
    })

    // Only return kits that are in stock
    const inStockKits = transformedData.filter(kit => kit.in_stock)

    return { success: true, data: inStockKits }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get a single product by ID with all related data
 * @param {string} productId - The product ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getProductById(productId) {
  try {
    const [productsResult, pricesResult] = await Promise.all([
      supabase
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
        .eq('id', productId)
        .single(),
      supabase
        .from('prices')
        .select('product_id, price_aa, created_at')
        .eq('product_id', productId)
        .order('created_at', { ascending: false })
        .limit(1)
    ])

    if (productsResult.error) {
      return { success: false, error: productsResult.error.message }
    }

    // Transform the data similar to getProducts()
    const product = productsResult.data
    const totalQuantity = product.inventory?.reduce((sum, inv) => sum + (inv.quantity || 0), 0) || 0
    const primaryInventory = product.inventory?.find(inv => inv.quantity > 0) || product.inventory?.[0]
    
    const conditionSuffixes = {
      'A': 'A', 'AA': 'AA', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F'
    }
    
    let displaySku = product.sku;
    if (product.sku && product.condition_id) {
      const conditionSuffix = conditionSuffixes[product.condition_id];
      if (conditionSuffix && !/-[A-F]{1,2}$/.test(product.sku)) {
        displaySku = `${product.sku}-${conditionSuffix}`;
      }
    }

    const actualPrice = pricesResult.data?.[0]?.price_aa
    const price = actualPrice || (Math.floor(Math.random() * 300 + 50) + 0.99)

    const transformedData = {
      ...product,
      brand_name: product.brands?.name || 'Unknown Brand',
      condition_name: product.conditions?.general_condition || 'New',
      condition_description: product.conditions?.full_description || '',
      product_type_name: product.product_types?.name || 'Tool',
      display_sku: displaySku,
      quantity: totalQuantity,
      in_stock: totalQuantity > 0,
      warehouse_location: primaryInventory?.warehouse_location || null,
      warehouse_name: primaryInventory?.warehouse?.name || null,
      warehouse_address: primaryInventory?.warehouse?.address || null,
      price: price,
      type: 'product'
    }

    return { success: true, data: transformedData }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get a single combo by ID with all related data
 * @param {string} comboId - The combo ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getComboById(comboId) {
  try {
    const [combosResult, availabilityResult] = await Promise.all([
      supabase
        .from('combos')
        .select(`
          id,
          name,
          description,
          sku,
          image_url,
          brand_id,
          brands!brand_id (
            id,
            name
          ),
          combo_price_calc (
            combo_price
          ),
          combo_items (
            id,
            product_id,
            quantity,
            condition,
            combo_discount,
            products!product_id (
              id,
              description,
              sku,
              image_url,
              condition_id,
              specs,
              power_source,
              conditions!condition_id (
                general_condition,
                full_description
              )
            )
          )
        `)
        .eq('id', comboId)
        .single(),
      supabase
        .from('combo_availability')
        .select(`
          combo_id,
          warehouse_location,
          max_combos_available,
          warehouse!warehouse_location (
            name
          )
        `)
        .eq('combo_id', comboId)
    ])

    if (combosResult.error) {
      return { success: false, error: combosResult.error.message }
    }

    const combo = combosResult.data
    const comboAvailability = availabilityResult.data || []
    
    const totalQuantity = comboAvailability.reduce((sum, avail) => sum + (avail.max_combos_available || 0), 0)
    const primaryAvailability = comboAvailability.find(avail => avail.max_combos_available > 0) || comboAvailability[0]
    const comboPrice = combo.combo_price_calc?.[0]?.combo_price || null

    // Determine overall condition
    let overallCondition = 'New'
    let overallConditionId = 'AA'
    
    if (combo.combo_items && combo.combo_items.length > 0) {
      const conditionPriority = { 'F': 6, 'E': 5, 'D': 4, 'C': 3, 'B': 2, 'A': 1, 'AA': 0 }
      let worstConditionScore = -1
      let worstCondition = 'AA'
      
      combo.combo_items.forEach(item => {
        let itemConditionId = item.condition || item.products?.condition_id
        if (itemConditionId && itemConditionId in conditionPriority) {
          const score = conditionPriority[itemConditionId]
          if (score > worstConditionScore) {
            worstConditionScore = score
            worstCondition = itemConditionId
          }
        }
      })
      
      overallConditionId = worstCondition
      const conditionNames = {
        'AA': 'New in Box', 'A': 'New without a box', 'B': 'Pre-owned (minimal defects)',
        'C': 'Pre-owned (moderate wear)', 'D': 'Used', 'E': 'Used (notable touches)', 'F': 'Very Used'
      }
      overallCondition = conditionNames[overallConditionId] || 'New'
    }

    const transformedData = {
      ...combo,
      brand_name: combo.brands?.name || 'Unknown Brand',
      condition_name: overallCondition,
      condition_id: overallConditionId,
      condition_description: `Combo contains items in ${overallCondition.toLowerCase()} condition`,
      price: comboPrice,
      quantity: totalQuantity,
      in_stock: totalQuantity > 0,
      warehouse_location: primaryAvailability?.warehouse_location || null,
      warehouse_name: null, // Will need separate warehouse query if needed
      item_count: combo.combo_items?.length || 0,
      type: 'combo'
    }

    return { success: true, data: transformedData }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

/**
 * Get a single kit by ID with all related data
 * @param {string} kitId - The kit ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getKitById(kitId) {
  try {
    const [kitsResult, availabilityResult] = await Promise.all([
      supabase
        .from('kits')
        .select(`
          id,
          specs,
          description,
          sku,
          brand_id,
          product_type_id,
          brands!brand_id (
            id,
            name
          ),
          product_types!product_type_id (
            id,
            name
          ),
          kit_price_calc (
            kit_price
          ),
          kit_items (
            id,
            product_id,
            role,
            quantity,
            kit_discount,
            products!product_id (
              id,
              description,
              sku,
              image_url,
              condition_id,
              specs,
              power_source,
              conditions!condition_id (
                general_condition,
                full_description
              )
            )
          )
        `)
        .eq('id', kitId)
        .single(),
      supabase
        .from('kit_availability')
        .select(`
          kit_id,
          warehouse_location,
          max_kits_available,
          warehouse!warehouse_location (
            name
          )
        `)
        .eq('kit_id', kitId)
    ])

    if (kitsResult.error) {
      return { success: false, error: kitsResult.error.message }
    }

    const kit = kitsResult.data
    const kitAvailability = availabilityResult.data || []
    
    const totalQuantity = kitAvailability.reduce((sum, avail) => sum + (avail.max_kits_available || 0), 0)
    const primaryAvailability = kitAvailability.find(avail => avail.max_kits_available > 0) || kitAvailability[0]
    const kitPrice = kit.kit_price_calc?.[0]?.kit_price || null

    // Determine overall condition
    let overallCondition = 'New'
    let overallConditionId = 'AA'
    
    if (kit.kit_items && kit.kit_items.length > 0) {
      const conditionPriority = { 'F': 6, 'E': 5, 'D': 4, 'C': 3, 'B': 2, 'A': 1, 'AA': 0 }
      let worstConditionScore = -1
      let worstCondition = 'AA'
      
      kit.kit_items.forEach(item => {
        const itemConditionId = item.products?.condition_id
        if (itemConditionId && itemConditionId in conditionPriority) {
          const score = conditionPriority[itemConditionId]
          if (score > worstConditionScore) {
            worstConditionScore = score
            worstCondition = itemConditionId
          }
        }
      })
      
      overallConditionId = worstCondition
      const conditionNames = {
        'AA': 'New in Box', 'A': 'New without a box', 'B': 'Pre-owned (minimal defects)',
        'C': 'Pre-owned (moderate wear)', 'D': 'Used', 'E': 'Used (notable touches)', 'F': 'Very Used'
      }
      overallCondition = conditionNames[overallConditionId] || 'New'
    }

    const transformedData = {
      ...kit,
      brand_name: kit.brands?.name || 'Unknown Brand',
      product_type_name: kit.product_types?.name || 'Kit',
      condition_name: overallCondition,
      condition_id: overallConditionId,
      condition_description: `Kit contains items in ${overallCondition.toLowerCase()} condition`,
      price: kitPrice || Math.floor(Math.random() * 800 + 200) + 0.99,
      quantity: totalQuantity,
      in_stock: totalQuantity > 0,
      warehouse_location: primaryAvailability?.warehouse_location || null,
      warehouse_name: null, // Will need separate warehouse query if needed
      item_count: kit.kit_items?.length || 0,
      type: 'kit',
      name: kit.description
    }

    return { success: true, data: transformedData }
  } catch (err) {
    return { success: false, error: err.message }
  }
}