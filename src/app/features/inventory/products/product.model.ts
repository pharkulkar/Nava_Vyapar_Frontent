export type ProductStatus = 'active' | 'inactive' | 'draft';
export type ProductUnit = 'pcs' | 'kg' | 'g' | 'l' | 'ml' | 'box' | 'pack' | 'dozen' | 'pair' | 'set';

// Shape expected by POST /api/products (array body)
export interface ApiProductRequest {
  productCode: string;  // maps to sku
  name: string;
  category: string;
  price: number;        // maps to sellingPrice
  uom: string;          // unit of measure, maps to unit
  gstRate: number;      // maps to taxRate
  purchasePrice?: number;
  description?:string;
}

// Shape returned by GET /api/products
export interface ApiProduct {
  id: number;
  productCode: string;
  name: string;
  category: string;
  price: string;        // comes as string from API
  uom: string;
  gstRate: string;      // comes as string from API
  purchasePrice?:number;
  description?:string;
  currentStock?:number;
}

export interface ApiProductsResponse {
  status: string;
  statusMessage: string;
  displayMessage: string;
  products: ApiProduct[];
}

// Shape expected by PUT /api/products/?businessId= (array body)
export interface ApiProductUpdateRequest {
  id: number;
  name?: string;
  category?: string;
  price?: number;
  uom?: string;
  gstRate?: number;
  purchasePrice?: number;
  description?:string;
}

// Shape expected by DELETE /api/products/?businessId= (array body)
export interface ApiProductDeleteRequest {
  id: number;
}

// Shape expected by POST /api/inventory (array body)
export interface ApiInventoryRequest {
  productId: string;          // maps to productCode / SKU
  businessId: number;
  quantity: number;
  lowStockThreshold: number;
  uom: string;
  note?: string;
}

export interface ApiInventoryResponse {
  status: string;
  statusMessage?: string;
  displayMessage?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit: ProductUnit;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: ProductStatus;
  description?: string;
  barcode?: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  sku: string;
  category: string;
  unit: ProductUnit;
  purchasePrice: number;
  sellingPrice: number;
  taxRate: number;
  stockQuantity: number;
  lowStockThreshold: number;
  status: ProductStatus;
  description?: string;
  barcode?: string;
}

export interface UpdateProductRequest extends Partial<CreateProductRequest> {
  id: string;
}

export interface ProductFilters {
  search?: string;
  category?: string;
  status?: ProductStatus;
  lowStock?: boolean;
}

export interface BulkUploadResult {
  total: number;
  success: number;
  failed: number;
  errors: BulkUploadError[];
}

export interface BulkUploadError {
  row: number;
  field: string;
  message: string;
}

export const PRODUCT_UNITS: { label: string; value: ProductUnit }[] = [
  { label: 'Pieces', value: 'pcs' },
  { label: 'Kilograms', value: 'kg' },
  { label: 'Grams', value: 'g' },
  { label: 'Litres', value: 'l' },
  { label: 'Millilitres', value: 'ml' },
  { label: 'Box', value: 'box' },
  { label: 'Pack', value: 'pack' },
  { label: 'Dozen', value: 'dozen' },
  { label: 'Pair', value: 'pair' },
  { label: 'Set', value: 'set' },
];

export const PRODUCT_CATEGORIES = [
  'Electronics', 'Clothing', 'Food & Beverages', 'Furniture',
  'Stationery', 'Hardware', 'Cosmetics', 'Medicines', 'Toys', 'Other',
];

export const PRODUCT_STATUS_CONFIG: Record<ProductStatus, { label: string; color: string; icon: string }> = {
  active:   { label: 'Active',   color: 'green',  icon: 'check_circle' },
  inactive: { label: 'Inactive', color: 'red',    icon: 'remove_circle' },
  draft:    { label: 'Draft',    color: 'amber',  icon: 'edit_note' },
};

export const TAX_RATES = [
  { label: '0% (Exempt)', value: 0 },
  { label: '5% GST', value: 5 },
  { label: '12% GST', value: 12 },
  { label: '18% GST', value: 18 },
  { label: '28% GST', value: 28 },
];
