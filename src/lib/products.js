import { supabase } from './supabase'

/**
 * Fetch products with related brand, condition, and product type data
 * Only returns products that are in stock (inventory quantity > 0)
 * @param {Object} filters - Filter options
 * @param {string[]} filters.brands - Array of brand IDs to filter by  
 * @param {string[]} filters.conditions - Array of condition IDs to filter by
 * @param {string[]} filters.powerSources - Array of power sources to filter by
 * @param {string[]} filters.locations - Array of warehouse locations to filter by
 * @param {string} filters.sortBy - Sort order: 'newest', 'oldest', 'name_asc', 'name_desc', 'price_asc', 'price_desc'
 * @param {number} filters.limit - Maximum number of results
 * @returns {Promise<{data: Array, error: string|null, count: number}>}
 */
export async function fetchProducts(filters = {}) {
  try {
    let query = supabase
      .from('products')
      .select(`
        *,
        brands(id, name),
        product_types(id, name),
        conditions(id, general_condition, full_description),
        inventory!inner(
          quantity,
          warehouse_location,
          warehouse:warehouse_location(
            name,
            address
          )
        )
      `)
      // Only show products with inventory quantity > 0
      .gt('inventory.quantity', 0)

    // Apply filters
    if (filters.brands && filters.brands.length > 0) {
      query = query.in('brand_id', filters.brands)
    }
    
    if (filters.conditions && filters.conditions.length > 0) {
      query = query.in('condition_id', filters.conditions)
    }
    
    if (filters.powerSources && filters.powerSources.length > 0) {
      query = query.in('power_source', filters.powerSources)
    }

    if (filters.locations && filters.locations.length > 0) {
      query = query.in('inventory.warehouse_location', filters.locations)
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'newest':
        query = query.order('id', { ascending: false })
        break
      case 'oldest':
        query = query.order('id', { ascending: true })
        break
      case 'name_asc':
        query = query.order('description', { ascending: true })
        break
      case 'name_desc':
        query = query.order('description', { ascending: false })
        break
      case 'price_asc':
        // You'll need to add a price column or calculate it
        query = query.order('description', { ascending: true })
        break
      case 'price_desc':
        // You'll need to add a price column or calculate it
        query = query.order('description', { ascending: false })
        break
      default:
        query = query.order('id', { ascending: false })
    }

    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    const { data, error, count } = await query

    if (error) {
      return { data: [], error: error.message, count: 0 }
    }

    // Transform the data to match the expected format
    const transformedData = data.map(product => ({
      ...product,
      // Extract nested data for easier use in components
      brand_name: product.brands?.name || 'Unknown Brand',
      product_type_name: product.product_types?.name || 'Unknown Type',
      condition_name: product.conditions?.general_condition || 'New',
      condition_description: product.conditions?.full_description || '',
      // Inventory data
      quantity: product.inventory?.quantity || 0,
      warehouse_location: product.inventory?.warehouse_location,
      warehouse_name: product.inventory?.warehouse?.name || 'Unknown Location',
      warehouse_address: product.inventory?.warehouse?.address,
      // Customer sees this as "in stock" since we only show items with quantity > 0
      in_stock: true,
      // SKU + condition format for customer display
      display_sku: product.sku ? `${product.sku}+${product.conditions?.general_condition || 'NEW'}` : null,
      // Mock price - you should add a price column to your products table
      price: Math.floor(Math.random() * 300 + 50) + 0.99,
    }))

    return { data: transformedData, error: null, count: count || data.length }
  } catch (err) {
    return { data: [], error: err.message, count: 0 }
  }
}

/**
 * Get all unique brands from the brands table
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function fetchBrands() {
  try {
    const { data, error } = await supabase
      .from('brands')
      .select('id, name')
      .order('name')

    if (error) {
      return { data: [], error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

/**
 * Get all unique conditions from the conditions table
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function fetchConditions() {
  try {
    const { data, error } = await supabase
      .from('conditions')
      .select('id, general_condition, full_description')
      .order('general_condition')

    if (error) {
      return { data: [], error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

/**
 * Get all unique power sources from products
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function fetchPowerSources() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('power_source')
      .not('power_source', 'is', null)

    if (error) {
      return { data: [], error: error.message }
    }

    // Get unique power sources
    const uniquePowerSources = [...new Set(data.map(p => p.power_source))]
      .filter(Boolean)
      .sort()

    return { data: uniquePowerSources, error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

/**
 * Get all warehouse locations that have inventory
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function fetchWarehouseLocations() {
  try {
    const { data, error } = await supabase
      .from('warehouse')
      .select('id, name, address')
      .order('name')

    if (error) {
      return { data: [], error: error.message }
    }

    return { data, error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}

/**
 * Search products by description
 * @param {string} searchTerm - Search term
 * @param {number} limit - Maximum results
 * @returns {Promise<{data: Array, error: string|null}>}
 */
export async function searchProducts(searchTerm, limit = 20) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        brands(name),
        product_types(name), 
        conditions(general_condition, full_description)
      `)
      .ilike('description', `%${searchTerm}%`)
      .limit(limit)

    if (error) {
      return { data: [], error: error.message }
    }

    // Transform data
    const transformedData = data.map(product => ({
      ...product,
      brand_name: product.brands?.name || 'Unknown Brand',
      product_type_name: product.product_types?.name || 'Unknown Type', 
      condition_name: product.conditions?.general_condition || 'New',
      condition_description: product.conditions?.full_description || '',
      display_sku: product.sku ? `${product.sku}+${product.conditions?.general_condition || 'NEW'}` : null,
      price: Math.random() * 300 + 100, // Replace with actual price
      in_stock: Math.random() > 0.2, // Replace with actual stock logic
    }))

    return { data: transformedData, error: null }
  } catch (err) {
    return { data: [], error: err.message }
  }
}