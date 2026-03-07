import { createClient } from '@supabase/supabase-js'

// These should be stored in environment variables in a production app
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Get signed URLs for product images
 * @param {Array} productImages - Array of product images with path and bucket
 * @returns {Promise<Array>} Array of images with signed URLs
 */
async function getProductImageUrls(productImages) {
  if (!productImages || productImages.length === 0) {
    return []
  }

  const imagesWithUrls = await Promise.all(
    productImages.map(async (image) => {
      try {
        const { data: signedUrl, error } = await supabase.storage
          .from(image.bucket || 'product-images')
          .createSignedUrl(image.path, 3600) // 1 hour expiry

        if (error) {
          console.error('Error creating signed URL for image:', error)
          return null
        }

        return {
          ...image,
          signed_url: signedUrl.signedUrl
        }
      } catch (err) {
        console.error('Error processing image:', err)
        return null
      }
    })
  )

  // Filter out any failed images and sort by sort_order
  return imagesWithUrls
    .filter(image => image !== null)
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
}

/**
 * Get all products with their related data (brands, conditions, product types, inventory)
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getProducts() {
  try {
    console.log('Fetching products from Supabase...')
    
    // Fetch products, prices, and images in parallel
    const [productsResult, pricesResult, imagesResult] = await Promise.all([
      supabase
        .from('products')
        .select(`
          id,
          description,
          sku,
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
        .order('created_at', { ascending: false }),
      supabase
        .from('product_images')
        .select('id, product_id, bucket, path, sort_order, is_primary')
        .order('sort_order')
    ])

    if (productsResult.error) {
      console.error('Products query error:', productsResult.error)
      return { success: false, error: productsResult.error.message }
    }

    if (pricesResult.error) {
      console.error('Prices query error:', pricesResult.error)
      return { success: false, error: pricesResult.error.message }
    }

    if (imagesResult.error) {
      console.error('Images query error:', imagesResult.error)
      // Continue without images rather than failing completely
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

    // Create a map of product images
    const imageMap = {}
    if (imagesResult.data) {
      imagesResult.data.forEach(image => {
        if (!imageMap[image.product_id]) {
          imageMap[image.product_id] = []
        }
        imageMap[image.product_id].push(image)
      })
    }

    // Process signed URLs for all images
    const processedImageMap = {}
    for (const [productId, images] of Object.entries(imageMap)) {
      processedImageMap[productId] = await getProductImageUrls(images)
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
        }
      }

      // Get actual price from database or fallback to mock
      const actualPrice = priceMap[product.id]?.price_aa
      const price = actualPrice || (Math.floor(Math.random() * 300 + 50) + 0.99)
      
      // Get product images
      const productImages = processedImageMap[product.id] || []
      const primaryImage = productImages.find(img => img.is_primary) || productImages[0]
      
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
        warehouse_name: null,
        warehouse_address: null,
        
        // Actual price from database
        price: price,
        type: 'product',
        
        // Product images
        images: productImages,
        primary_image: primaryImage,
        image_url: primaryImage?.signed_url || null // For backward compatibility
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
 * Get all combos with their related data and pricing
 * NOW WITH PROPER IMAGE LOADING FROM product_images TABLE
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getCombos() {
  try {
    console.log('Fetching combos from Supabase...')
    
    // Fetch combos data
    const combosResult = await supabase
      .from('combos')
      .select(`
        id,
        name,
        description,
        sku,
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

    // Try to fetch availability data
    let availabilityData = []
    try {
      const availabilityResult = await supabase
        .from('combo_availability')
        .select(`
          combo_id,
          warehouse_location,
          max_combos_available
        `)
      
      if (!availabilityResult.error) {
        availabilityData = availabilityResult.data || []
      }
    } catch (err) {
      console.warn('Combo availability table might not exist:', err.message)
    }

    // Create a map of availability data by combo_id
    const availabilityMap = {}
    availabilityData.forEach(avail => {
      if (!availabilityMap[avail.combo_id]) {
        availabilityMap[avail.combo_id] = []
      }
      availabilityMap[avail.combo_id].push(avail)
    })

    // Collect the FIRST product ID from each combo (requested card image source).
    const firstProductIds = new Set()
    combosResult.data.forEach(combo => {
      const firstItem = combo.combo_items?.[0]
      if (firstItem?.product_id) {
        firstProductIds.add(firstItem.product_id)
      }
    })

    // Fetch product images only for first combo item products.
    let productImagesMap = {}
    if (firstProductIds.size > 0) {
      const imagesResult = await supabase
        .from('product_images')
        .select('id, product_id, bucket, path, sort_order, is_primary')
        .in('product_id', Array.from(firstProductIds))
        .order('sort_order')

      if (imagesResult.data) {
        const imageMap = {}
        imagesResult.data.forEach(image => {
          if (!imageMap[image.product_id]) {
            imageMap[image.product_id] = []
          }
          imageMap[image.product_id].push(image)
        })

        // Process signed URLs for all images
        for (const [productId, images] of Object.entries(imageMap)) {
          productImagesMap[productId] = await getProductImageUrls(images)
        }
      }
    }

    // Transform the data to include calculated fields
    const transformedData = combosResult.data.map(combo => {
      // Get availability data for this combo
      const comboAvailability = availabilityMap[combo.id] || []
      
      // Get total available quantity across all warehouses
      const totalQuantity = comboAvailability.reduce((sum, avail) => sum + (avail.max_combos_available || 0), 0)
      
      // Get primary warehouse
      const primaryAvailability = comboAvailability.find(avail => avail.max_combos_available > 0) || comboAvailability[0]
      
      // Get combo price
      const comboPrice = Math.floor(Math.random() * 800 + 200) + 0.99
      
      // Determine overall condition from combo items
      let overallCondition = 'New'
      let overallConditionId = 'AA'
      
      if (combo.combo_items && combo.combo_items.length > 0) {
        // Priority order for "worst" condition
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

      // Transform combo_items and only attach images to the first item's product.
      const transformedComboItems = combo.combo_items?.map(item => {
        const firstProductId = combo.combo_items?.[0]?.product_id
        const images = item.product_id === firstProductId ? (productImagesMap[item.product_id] || []) : []
        const primary_image = images.find(img => img.is_primary) || images[0]
        
        return {
          ...item,
          products: {
            ...item.products,
            images: images,
            primary_image: primary_image
          }
        }
      }) || []

      // Use the first combo item's product image for the card.
      let comboPrimaryImage = null
      const firstComboProductId = combo.combo_items?.[0]?.product_id
      const firstComboProductImages = firstComboProductId ? (productImagesMap[firstComboProductId] || []) : []
      const comboImage = firstComboProductImages.find(img => img.is_primary) || firstComboProductImages[0]
      const comboImageUrl = comboImage?.signed_url || null
      
      if (comboImageUrl) {
        comboPrimaryImage = comboImage
      }
      
      return {
        ...combo,
        combo_items: transformedComboItems,
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
        warehouse_name: null,
        
        // Additional info
        item_count: transformedComboItems.length,
        type: 'combo',

    // FIXED: Use signed URLs for images - set both for card compatibility
        primary_image: comboPrimaryImage,
        image_url: comboImageUrl,
        has_images: Boolean(comboImageUrl)
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
 * NOW WITH PROPER IMAGE LOADING FROM product_images TABLE
 * @returns {Promise<{success: boolean, data?: any[], error?: string}>}
 */
export async function getKits() {
  try {
    console.log('Fetching kits from Supabase...')
    
    // Fetch kits data
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
            brand_id,
            brands!brand_id (
              name
            ),
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

    // Try to fetch availability data
    let availabilityData = []
    try {
      const availabilityResult = await supabase
        .from('kit_availability')
        .select(`
          kit_id,
          warehouse_location,
          max_kits_available
        `)
        
      if (!availabilityResult.error) {
        availabilityData = availabilityResult.data || []
      }
    } catch (err) {
      console.warn('Kit availability table might not exist:', err.message)
    }

    // Create a map of availability data by kit_id
    const availabilityMap = {}
    availabilityData.forEach(avail => {
      if (!availabilityMap[avail.kit_id]) {
        availabilityMap[avail.kit_id] = []
      }
      availabilityMap[avail.kit_id].push(avail)
    })

    // Collect the FIRST product ID from each kit (requested card image source).
    const firstProductIds = new Set()
    kitsResult.data.forEach(kit => {
      const firstItem = kit.kit_items?.[0]
      if (firstItem?.product_id) {
        firstProductIds.add(firstItem.product_id)
      }
    })

    // Fetch product images only for first kit item products.
    let productImagesMap = {}
    if (firstProductIds.size > 0) {
      const imagesResult = await supabase
        .from('product_images')
        .select('id, product_id, bucket, path, sort_order, is_primary')
        .in('product_id', Array.from(firstProductIds))
        .order('sort_order')

      if (imagesResult.data) {
        const imageMap = {}
        imagesResult.data.forEach(image => {
          if (!imageMap[image.product_id]) {
            imageMap[image.product_id] = []
          }
          imageMap[image.product_id].push(image)
        })

        // Process signed URLs for all images
        for (const [productId, images] of Object.entries(imageMap)) {
          productImagesMap[productId] = await getProductImageUrls(images)
        }
      }
    }

    // Transform the data to include calculated fields
    const transformedData = kitsResult.data.map(kit => {
      // Get availability data for this kit
      const kitAvailability = availabilityMap[kit.id] || []
      
      // Get total available quantity across all warehouses
      const totalQuantity = kitAvailability.reduce((sum, avail) => sum + (avail.max_kits_available || 0), 0)
      
      // Get primary warehouse
      const primaryAvailability = kitAvailability.find(avail => avail.max_kits_available > 0) || kitAvailability[0]
      
      // Get kit price
      const kitPrice = Math.floor(Math.random() * 800 + 200) + 0.99
      
      // Determine overall condition from kit items' products
      let overallCondition = 'New'
      let overallConditionId = 'AA'
      
      if (kit.kit_items && kit.kit_items.length > 0) {
        // Priority order for "worst" condition
        const conditionPriority = { 'F': 6, 'E': 5, 'D': 4, 'C': 3, 'B': 2, 'A': 1, 'AA': 0 }
        let worstConditionScore = -1
        let worstCondition = 'AA'
        
        kit.kit_items.forEach(item => {
          // Use product condition
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

      // Transform kit_items and only attach images to the first item's product.
      const transformedKitItems = kit.kit_items?.map(item => {
        const firstProductId = kit.kit_items?.[0]?.product_id
        const images = item.product_id === firstProductId ? (productImagesMap[item.product_id] || []) : []
        const primary_image = images.find(img => img.is_primary) || images[0]
        
        return {
          ...item,
          products: {
            ...item.products,
            images: images,
            primary_image: primary_image
          }
        }
      }) || []

      // Use the first kit item's product image for the card.
      let kitPrimaryImage = null
      const firstKitProductId = kit.kit_items?.[0]?.product_id
      const firstKitProductImages = firstKitProductId ? (productImagesMap[firstKitProductId] || []) : []
      const kitImage = firstKitProductImages.find(img => img.is_primary) || firstKitProductImages[0]
      const kitImageUrl = kitImage?.signed_url || null
      
      if (kitImageUrl) {
        kitPrimaryImage = kitImage
      }
      
      return {
        ...kit,
        kit_items: transformedKitItems,
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
        warehouse_name: null,
        
        // Additional info
        item_count: transformedKitItems.length,
        type: 'kit',
        // Use description as name
        name: kit.description,

    // FIXED: Use signed URLs for images - set both for card compatibility
        primary_image: kitPrimaryImage,
        image_url: kitImageUrl,
        has_images: Boolean(kitImageUrl)
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
 * Get a single product by ID with all related data
 * @param {string} productId - The product ID
 * @returns {Promise<{success: boolean, data?: any, error?: string}>}
 */
export async function getProductById(productId) {
  try {
    const [productsResult, pricesResult, imagesResult] = await Promise.all([
      supabase
        .from('products')
        .select(`
          id,
          description,
          sku,
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
        .limit(1),
      supabase
        .from('product_images')
        .select('id, product_id, bucket, path, sort_order, is_primary')
        .eq('product_id', productId)
        .order('sort_order')
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

    // Process product images with signed URLs
    const productImages = imagesResult.data ? await getProductImageUrls(imagesResult.data) : []
    const primaryImage = productImages.find(img => img.is_primary) || productImages[0]

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
      type: 'product',
      // Product images
      images: productImages,
      primary_image: primaryImage,
      image_url: primaryImage?.signed_url || null // For backward compatibility
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
    
    // Fetch images for all products in the combo
    let productImages = {}
    if (combo.combo_items && combo.combo_items.length > 0) {
      const productIds = combo.combo_items.map(item => item.product_id)
      const imagesResult = await supabase
        .from('product_images')
        .select('id, product_id, bucket, path, sort_order, is_primary')
        .in('product_id', productIds)
        .order('sort_order')

      if (imagesResult.data) {
        const imageMap = {}
        imagesResult.data.forEach(image => {
          if (!imageMap[image.product_id]) {
            imageMap[image.product_id] = []
          }
          imageMap[image.product_id].push(image)
        })

        // Process signed URLs for all images
        for (const [productId, images] of Object.entries(imageMap)) {
          productImages[productId] = await getProductImageUrls(images)
        }
      }
    }
    
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

    // Add images to combo_items products
    if (combo.combo_items) {
      combo.combo_items.forEach(item => {
        if (item.products && productImages[item.product_id]) {
          item.products.images = productImages[item.product_id]
          item.products.primary_image = productImages[item.product_id].find(img => img.is_primary) || productImages[item.product_id][0]
        }
      })
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
      warehouse_name: null,
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
    
    // Fetch images for all products in the kit
    let productImages = {}
    if (kit.kit_items && kit.kit_items.length > 0) {
      const productIds = kit.kit_items.map(item => item.product_id)
      const imagesResult = await supabase
        .from('product_images')
        .select('id, product_id, bucket, path, sort_order, is_primary')
        .in('product_id', productIds)
        .order('sort_order')

      if (imagesResult.data) {
        const imageMap = {}
        imagesResult.data.forEach(image => {
          if (!imageMap[image.product_id]) {
            imageMap[image.product_id] = []
          }
          imageMap[image.product_id].push(image)
        })

        // Process signed URLs for all images
        for (const [productId, images] of Object.entries(imageMap)) {
          productImages[productId] = await getProductImageUrls(images)
        }
      }
    }
    
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

    // Add images to kit_items products
    if (kit.kit_items) {
      kit.kit_items.forEach(item => {
        if (item.products && productImages[item.product_id]) {
          item.products.images = productImages[item.product_id]
          item.products.primary_image = productImages[item.product_id].find(img => img.is_primary) || productImages[item.product_id][0]
        }
      })
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
      warehouse_name: null,
      item_count: kit.kit_items?.length || 0,
      type: 'kit',
      name: kit.description
    }

    return { success: true, data: transformedData }
  } catch (err) {
    return { success: false, error: err.message }
  }
}
