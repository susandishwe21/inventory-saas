export type Category = {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
};

export type CategoryWithCount = Category & {
  product_count: number;
};

// Where products come from. Everything except the name is optional.
export type Supplier = {
  id: string;
  org_id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export type SupplierWithCount = Supplier & {
  product_count: number;
};

export type SupplierInput = Pick<Supplier, 'name' | 'contact_name' | 'email' | 'phone'>;

// Calculated by the database: out = 0, low = at or below low_stock_level, otherwise in
export type StockStatus = 'in' | 'low' | 'out';

// Define the Product type
export type Product = {
  id: string;
  org_id: string; // the shop it belongs to
  name: string;
  sku: string;
  price: number; // selling price
  cost_price: number; // what the shop paid
  stock_quantity: number; // read only: changes through stock movements (database trigger)
  low_stock_level: number; // status is "low" at or below this
  status: StockStatus; // read only: generated column
  category_id: string | null;
  category: Pick<Category, 'id' | 'name'> | null; // joined from categories when listing
  supplier_id: string | null;
  supplier: Pick<Supplier, 'id' | 'name'> | null; // joined from suppliers when listing
  image_path: string | null; // file path in the "product-images" storage bucket
  created_at: string;
};

// What the product form wants to do with the image when saving
export type ImageChange =
  | { type: 'keep' }
  | { type: 'set'; image: Blob } // already resized
  | { type: 'remove' };

export type ProductInput = {
  name: string;
  sku: string;
  price: number;
  cost_price: number;
  low_stock_level: number;
  category_id: string | null;
  supplier_id: string | null;
};

export type MovementType = 'in' | 'out' | 'adjustment';

export type StockMovement = {
  id: string;
  org_id: string;
  product_id: string;
  type: MovementType;
  quantity: number;
  note: string | null;
  created_by: string | null; // user id of who recorded it
  created_at: string;
};

export type StockMovementInput = {
  product_id: string;
  type: MovementType;
  quantity: number;
  note?: string;
};
export type Role = 'owner' | 'staff';

// A shop. Every user belongs to at most one.
export type Organization = {
  id: string;
  name: string;
  created_at: string;
};

export type Membership = {
  user_id: string;
  org_id: string;
  role: Role;
  email: string;
  created_at: string;
};

// The signed-in user's shop and their role in it
export type MyShop = {
  role: Role;
  organization: Pick<Organization, 'id' | 'name'>;
};

// A row in the Settings → Members list
export type Member = Pick<Membership, 'user_id' | 'role' | 'email' | 'created_at'>;

// A single-use code that lets someone join a shop as staff (valid 7 days)
export type OrgInvite = {
  code: string; // 8 characters, shown as XXXX-XXXX
  org_id: string;
  created_by: string | null;
  created_at: string;
  expires_at: string;
  used_by: string | null;
  used_at: string | null; // null = not used yet
};

// One row from dashboard_summary(): the whole shop at a glance
export type DashboardSummary = {
  stock_value: number; // sum of cost_price × stock_quantity
  total_products: number;
  in_stock: number;
  low_stock: number;
  out_of_stock: number;
};
