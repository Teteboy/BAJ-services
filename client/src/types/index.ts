export type UserRole = 'ADMIN' | 'CLIENT';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  companyName?: string;
  clientId?: string;
  client?: Client;
}

export interface Product {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryLocation {
  id: string;
  clientId: string;
  name?: string;
  address: string;
  createdAt: string;
}

export interface ClientProductPrice {
  id: string;
  clientId: string;
  productId: string;
  pricePerLiter: number;
  product?: Product;
}

export interface Client {
  id: string;
  userId: string;
  user: {
    id: string;
    email: string;
    name: string;
    isActive: boolean;
  };
  companyName: string;
  phone?: string;
  paymentTerms?: PaymentTerms;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deliveryLocations: DeliveryLocation[];
  productPrices: ClientProductPrice[];
}

export type OrderStatus = 'PENDING' | 'VALIDATED' | 'MODIFIED' | 'REJECTED' | 'DELIVERED';
export type PaymentTerms = 'IMMEDIATE' | 'DAYS_10' | 'DAYS_15' | 'DAYS_30';
export type PaymentMethod = 'VIREMENT' | 'CHEQUE';
export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
export type Unit = 'LITERS' | 'M3';

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  product: Product;
  quantity: number;
  unit: Unit;
  pricePerUnit: number;
}

export interface Delivery {
  id: string;
  orderId: string;
  deliveredAt?: string;
  confirmedAt: string;
  confirmedById?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  clientId: string;
  client: Client;
  deliveryLocationId?: string;
  deliveryLocation?: DeliveryLocation;
  status: OrderStatus;
  requestedDeliveryDate: string;
  contactPerson?: string;
  contactPhone?: string;
  notes?: string;
  rejectionReason?: string;
  modificationNote?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  delivery?: Delivery | null;
  invoice?: Invoice | null;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  product?: Product;
  quantity: number;
  unit: Unit;
  pricePerUnit: number;
  totalAmount: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  order: Order;
  clientId: string;
  client?: Client;
  status: InvoiceStatus;
  totalAmount: number;
  paymentDeadline: string;
  pdfUrl?: string;
  issuedAt: string;
  paymentMethod?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
  items?: InvoiceItem[];
  payments?: Payment[];
}

export interface Payment {
  id: string;
  invoiceId: string;
  invoice: Invoice;
  amount: number;
  method: string;
  reference?: string;
  paidAt?: string;
  createdAt: string;
}

export interface StockEntry {
  id: string;
  productId: string;
  product: Product;
  weekStartDate: string;
  weekEndDate: string;
  initialStock: number;
  totalDelivered: number;
  remainingStock: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WeeklyReport {
  id: string;
  weekStartDate: string;
  weekEndDate: string;
  totalAmountSold: number;
  paymentsReceived: number;
  paymentsPending: number;
  paymentsOverdue: number;
  totalOrdersCount: number;
  totalDeliveriesCount: number;
  generatedAt: string;
  emailSentAt?: string;
  salesByProduct?: any[];
  stockSummary?: any[];
  createdAt: string;
}

export interface DashboardAdmin {
  totalOrders: number;
  totalClients: number;
  totalRevenue: number;
  pendingDeliveries: number;
  recentOrders: Order[];
}

export interface DashboardClient {
  totalOrders: number;
  totalSpent: number;
  pendingOrders: number;
  recentOrders: Order[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiResponse<T> {
  data: T;
}
