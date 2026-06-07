import { apiClient } from "../api-client";
import type {
  DashboardMetricsResponse,
  SearchResponse,
} from "@/types/api";

// ==========================================
// 0. AUTHENTICATION
// ==========================================
export const AuthAPI = {
  login: (data: any) => apiClient.post("/auth/login", data).then(res => res.data),
  logout: () => apiClient.post("/auth/logout").then(res => res.data),
};

// ==========================================
// 1. MASTER DATA
// ==========================================
export const MasterAPI = {
  getProducts: () => apiClient.get("/master/products").then(res => res.data),
  createProduct: (data: any) => apiClient.post("/master/products", data).then(res => res.data),
};

// ==========================================
// 2. TRANSAKSI POS (KASIR)
// ==========================================
export const PosAPI = {
  checkout: (data: {
    cashier_id: number;
    patient_id?: number;
    payment_method: string;
    total: number;
    amount_tendered: number;
    discount: number;
    tax: number;
    items: { product_id: number; qty: number; price: number }[];
  }) => apiClient.post("/pos/checkout", data).then(res => res.data),
  
  getHistory: () => apiClient.get("/pos/history").then(res => res.data),

  holdTransaction: (data: any) => apiClient.post("/pos/hold", data).then(res => res.data),
  
  voidTransaction: (data: {
    transaction_no: string;
    authorizer_id: number;
    void_reason: string;
  }) => apiClient.post("/pos/void", data).then(res => res.data),

  salesReturn: (data: {
    transaction_no: string;
    user_id: number;
    reason: string;
    items: {
      product_id: number;
      product_batch_id: number;
      qty: number;
      condition: "Layak Jual" | "Karantina" | "Rusak";
    }[];
  }) => apiClient.post("/pos/returns", data).then(res => res.data),
};

// ==========================================
// 3. PELAYANAN KEFARMASIAN
// ==========================================
export const PharmacyAPI = {
  validatePrescription: (id: number, data: { apj_id: number; status: string }) => 
    apiClient.put(`/pharmacy/prescriptions/${id}/validate`, data).then(res => res.data),
    
  compoundPrescription: (data: any) => 
    apiClient.post("/pharmacy/compounds", data).then(res => res.data),
};

// ==========================================
// 4. INVENTORY GUDANG
// ==========================================
export const InventoryAPI = {
  submitStockOpname: (data: any) => apiClient.post("/inventory/stock-opname", data).then(res => res.data),
  approveStockOpname: (id: number, data: { approver_id: number; status: string }) => 
    apiClient.put(`/inventory/stock-opname/${id}/approve`, data).then(res => res.data),
};

// ==========================================
// 5. PROCUREMENT (PENGADAAN)
// ==========================================
export const ProcurementAPI = {
  createPurchaseRequest: (data: any) => 
    apiClient.post("/procurement/purchase-requests", data).then(res => res.data),
  
  receiveGoods: (data: any) => 
    apiClient.post("/procurement/receive-goods", data).then(res => res.data),
};

// ==========================================
// 6. DASHBOARD METRICS
// GET /api/dashboard/metrics
// ==========================================
export const DashboardAPI = {
  getMetrics: (): Promise<DashboardMetricsResponse> =>
    apiClient.get("/dashboard/metrics").then(res => res.data),
};

// ==========================================
// 7. GLOBAL SEARCH
// GET /api/search?q=keyword&limit=5
// ==========================================
export const SearchAPI = {
  global: (q: string, limit = 5): Promise<SearchResponse> =>
    apiClient
      .get("/search", { params: { q, limit } })
      .then(res => res.data),
};
