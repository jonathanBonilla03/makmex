# MakMex Features - John R. H.

This document explains the major user-facing features and how they work internally, with emphasis on Shopping, Cart, Search Bar, and Brands.

## 1) High-Level Architecture

### App Composition
- `src/App.jsx` wires providers and routes.
- Provider order is important:
  - `LanguageProvider` for translations and formatting.
  - `CartProvider` for global cart state + persistence.
  - `LocationProvider` for global warehouse-location filters.
- `StorefrontShell` wraps all pages and provides shared header/nav/search/cart UI.

### Unified Catalog Model
The shopping experience is intentionally unified:
- Products, combos, and kits are fetched separately.
- They are merged into one `items` array in `CategoryPage`.
- Filters, sorting, search relevance, and pagination all run on that single merged list.

This keeps behavior consistent across item types.

---

## 2) Shopping Page (`src/pages/CategoryPage.jsx`)

### What It Does
`CategoryPage` is the core catalog engine. It:
1. Loads data from Supabase (`getProducts`, `getCombos`, `getKits`, `getConditions`, `getPowerSources`).
2. Merges item types into one list.
3. Builds dynamic filter options from current in-stock inventory.
4. Applies filters + search + sorting.
5. Paginates the final result list.
6. Renders cards in compact or standard mode.

### Important Helpers
To support nested item structures (combos/kits), these helpers extract normalized values:
- `getSubItems(item)`
- `getItemBrands(item)`
- `getItemConditions(item)`
- `getItemProductTypes(item)`
- `getItemPowerSources(item)`
- `hasItemImage(item)`

Why this matters:
- A combo can include many child products with different brands/conditions.
- The page treats nested data as first-class searchable/filterable content.

### Filter Pipeline (Order)
The page applies filters in a deterministic sequence:
1. Price range (`priceInputs`)
2. Item type (product/combo/kit)
3. Brand
4. Condition
5. Power source
6. Location (from `LocationContext`)
7. Product type
8. With-image toggle
9. Search relevance gating (if `q` exists)
10. Sort (relevance, price asc/desc, newest)

The result is memoized with `useMemo` for performance.

### Sorting + Pagination
- Sort options:
  - `relevance`
  - `price_asc`
  - `price_desc`
  - `newest`
- Pagination supports top and bottom controls and auto-resets to page 1 when filters/sort/query change.

### URL-Driven Behavior
`CategoryPage` reads search params via `useSearchParams`:
- `brand`: auto-selects a brand filter (used by Brands page CTA).
- `q`: drives global search relevance behavior.

That makes links sharable and stateful (`/shopping?brand=...`, `/shopping?q=...`).

---

## 3) Search Bar + Relevance (`src/components/StorefrontShell.jsx` + `src/pages/CategoryPage.jsx`)

### Search Bar Behavior
In `StorefrontShell`:
- Search input is a real `<form>` submit, not local-only state.
- Submit navigates to `/shopping` with URL param `q`.
- If already on `/shopping`, it preserves other existing query params.
- Input state syncs from URL on route/query changes.

This gives:
- Deep-linkable searches
- Back/forward browser compatibility
- A single source of truth (URL)

### Relevance Engine
In `CategoryPage`:
- `normalizeSearchText` removes accents/diacritics and lowercases text.
- `buildSearchBlob` composes searchable strings from:
  - root item fields (name, description, sku, model, brand, etc.)
  - nested combo/kit product fields
- `calculateRelevanceScore` applies weighted scoring:
  - exact/contains title matches are highest
  - SKU and brand matches are boosted
  - base and nested token matches add incremental score

Behavior notes:
- With `q`, items with score `0` are filtered out.
- When `sort === relevance`, results are ordered by score descending.
- Non-relevance sorts still honor the search filter first.

This is efficient because:
- Work is inside `useMemo`.
- It avoids extra backend schema/search infrastructure.
- It still supports nested-composition items.

---

## 4) Filter Sidebar (`src/components/FilterSidebar.jsx`)

### Role
`FilterSidebar` is a controlled UI component. It receives all filter state and handlers from `CategoryPage`.

### Key UX Details
- Item type section is always visible at top.
- Other groups are collapsible (`Price`, `Brands`, `Conditions`, `Power Sources`, etc.).
- Selected counts are shown in badges per section.
- Condition labels use translation helpers from `LanguageContext`.
- Includes clear-all integration.

Because filtering logic stays in `CategoryPage`, `FilterSidebar` remains reusable and presentation-focused.

---

## 5) Item Cards (`src/components/ItemCard.jsx`)

### Dual Layout System
`ItemCard` supports:
- `compact` layout (grid-friendly)
- `standard` layout (Amazon-style row with richer details)

User selection is persisted in local storage key:
- `makmex-shopping-view-mode`

### Type-Aware Rendering
The card adapts by item type:
- Product: shows specs panel (standard layout).
- Combo/Kit: shows included products list in right panel.
- Type badge + count (`Items`) shown when relevant.

### Cart Hooks on Card
Each card:
- builds a cart-safe payload (`id`, `type`, availability, etc.)
- uses `canAddToCart` to enforce stock constraints
- uses `getItemQuantityInCart` to show cart state
- dispatches `addToCart` via `CartContext`

---

## 6) Cart System (`src/context/CartContext.jsx` + shell sidebar)

### State Management
`CartContext` uses `useReducer` with actions:
- `ADD_TO_CART`
- `REMOVE_FROM_CART`
- `UPDATE_QUANTITY`
- `CLEAR_CART`

### Business Rules
- Items are uniquely keyed by `(id, type)`.
- Add/quantity updates are capped by available inventory.
- Quantity <= 0 removes item.

### Persistence
- Loads from `localStorage` (`makmex-cart`) at boot.
- Auto-saves on every cart state change.

### Shared Cart UI
In `StorefrontShell`:
- `CartIcon` shows item-count badge + total.
- Right-side `CartSidebar` handles quantity controls, remove, clear cart, and checkout CTA.

---

## 7) Brands Page (`src/pages/BrandsPage.jsx`)

### What It Does
`BrandsPage` provides discovery by brand and bridges into Shopping.

### Data Flow
- Loads brand list from `brands` table.
- Loads in-stock products/combos/kits through existing catalog getters.
- Uses nested-brand logic (`getItemBrands`) to count brand availability consistently with Shopping filter semantics.

### Ranking + CTA
- Brands are sorted by `inStockCount` desc, then alphabetically.
- Top 3 are highlighted in hero chips.
- Brand cards with inventory link to `/shopping?brand=<name>`.
- Zero-stock brands are visually disabled with an out-of-stock CTA.

This ensures brand totals and Shopping brand filtering stay aligned.

---

## 8) Location Filter Integration (`src/context/LocationContext.jsx`)

### Why It Exists
Location selection is global (header control), but filtering is local to Shopping.

### How It Works
- `LocationProvider` stores:
  - `selectedLocations` (Set)
  - `availableLocations` (array)
- `CategoryPage` computes available locations from in-stock items and calls `updateAvailableLocations`.
- `StorefrontShell` renders the location dropdown and toggles selections.
- `CategoryPage` consumes `selectedLocations` as part of filter pipeline.

This creates a clean separation:
- Header owns selection UI.
- Shopping owns inventory-derived options + filtering.

---

## 9) End-to-End User Flows

### A) Search → Shopping Results
1. User submits top search bar.
2. App navigates to `/shopping?q=term`.
3. `CategoryPage` reads `q`, computes scores, removes non-matches.
4. If sort is relevance, highest-confidence matches appear first.

### B) Brands → Shopping Filter
1. User opens Brands page.
2. Clicks “Shop with <brand>”.
3. App opens `/shopping?brand=<brand>`.
4. `CategoryPage` auto-selects that brand and resets to page 1.

### C) Card → Cart → Checkout
1. User adds from card (stock-aware).
2. Cart icon updates count + total globally.
3. Sidebar allows quantity edits and clear/remove.
4. User proceeds to `/checkout`.

---
