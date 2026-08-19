export type ProductStatus = 'active' | 'inactive' | 'draft';
export type ProductUnit = 'pcs' | 'kg' | 'g' | 'l' | 'ml' | 'box' | 'pack' | 'dozen' | 'pair' | 'set';

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

export const TAX_RATES = [
  { label: '0% (Exempt)', value: 0 },
  { label: '5% GST', value: 5 },
  { label: '12% GST', value: 12 },
  { label: '18% GST', value: 18 },
  { label: '28% GST', value: 28 },
];
