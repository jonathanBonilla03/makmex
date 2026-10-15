# MakMex - Power Tools E-commerce Store

A modern e-commerce web application for power tools built with React, Vite, and Supabase.

## Tech Stack

- **Frontend**: React 19 + Vite
- **Styling**: TailwindCSS
- **Database**: Supabase
- **Routing**: React Router DOM

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- A Supabase account and project

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd makmex
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Supabase**
   - Create a new project at [supabase.com](https://supabase.com)
   - Go to your project's Settings > API
   - Copy the project URL and anon/public key

4. **Configure environment variables**
   Copy `.env.example` to `.env` and add your Supabase credentials
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Test your Supabase connection**
   - Open your browser to `http://localhost:5173`
   - Navigate to `/test-supabase` to verify your database connection
   - This page will show connection status and allow you to test queries

### Development Workflow

1. **Test Database Connection**: Visit `/test-supabase` to ensure Supabase is properly connected
2. **Set up Tables**: Create your product tables in Supabase (see Database Schema below)
3. **Test Queries**: Use the test page to verify your table structure and data
4. **Replace Mock Data**: Update `CategoryPage.jsx` to use real Supabase queries

### Database Schema

> The full, current schema, views, and security rules are documented in [`/database`](database/README.md). The snippet below is the original early schema.

#### Your Current Schema:
```sql
-- Products table
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text,
  sku character varying(50) NOT NULL,
  image_url text,
  condition_id text,
  product_type_id integer,
  brand_id integer,
  power_source text,
  specs text
);

-- Inventory table (tracks stock levels and locations)
CREATE TABLE inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES products(id),
  quantity integer DEFAULT 0,
  warehouse_location text REFERENCES warehouse(id),
  last_updated timestamp DEFAULT now()
);

-- Warehouse table (store locations)  
CREATE TABLE warehouse (
  id text PRIMARY KEY,
  address character varying,
  name text
);

-- Conditions table
CREATE TABLE conditions (
  id text PRIMARY KEY,
  general_condition text NOT NULL,
  full_description text NOT NULL
);

-- Brands table  
CREATE TABLE brands (
  id integer PRIMARY KEY,
  name text NOT NULL
);
```

#### Key Features:
- **Stock-based Display**: Only products with `inventory.quantity > 0` are shown to customers
- **Location Filtering**: Customers can filter by warehouse location
- **Customer SKU Format**: Displays as "[SKU]+[CONDITION]" (e.g., "SKU-001+NEW")
- **Detailed Info**: Shows description, brand, condition, power source, specs, and location
- **No Internal IDs**: Customers see friendly names, not database IDs

#### Sample Query (Customer View):
```sql
-- Get available products with all customer-relevant info
SELECT 
  p.description,
  p.sku,
  p.specs,
  p.power_source,
  b.name as brand_name,
  c.general_condition,
  c.full_description as condition_description,
  i.quantity,
  w.name as warehouse_name,
  CONCAT(p.sku, '+', UPPER(c.general_condition)) as display_sku
FROM products p
INNER JOIN inventory i ON p.id = i.product_id
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN conditions c ON p.condition_id = c.id
LEFT JOIN warehouse w ON i.warehouse_location = w.id
WHERE i.quantity > 0
ORDER BY p.description;
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Key Features

- **Product Catalog**: Browse power tools by category
- **Filtering & Search**: Filter by brand, condition, stock status
- **Responsive Design**: Mobile-first responsive layout
- **Real-time Database**: Connected to Supabase for live data

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ProductCard.jsx
│   └── StorefrontShell.jsx
├── pages/              # Page components
│   ├── CategoryPage.jsx
│   └── SupabaseTestPage.jsx
├── lib/               # Utilities and configurations
│   └── supabase.js    # Supabase client setup
└── App.jsx           # Main app with routing
```

### Testing Supabase Connection

1. Make sure your `.env` file has the correct Supabase URL and key
2. Visit `http://localhost:5173/test-supabase`
3. Check the connection status indicators
4. Test sample queries to verify your database setup

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
