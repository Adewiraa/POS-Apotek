// ============================================================
// API Contract Types — Dashboard & Global Search
// ============================================================

// ── Dashboard Metrics ────────────────────────────────────────

export interface DashboardOmset {
  value: number;
  yesterday: number;
  percentage: number;
  trend: "up" | "down";
  label: string;
}

export interface DashboardTransaksi {
  value: number;
  otc: number;
  resep: number;
  label: string;
}

export interface DashboardStokKritis {
  value: number;
  high_priority: number;
  label: string;
}

export interface DashboardEdKurang90 {
  value: number;
  butuh_fefo: number;
  label: string;
}

export interface DashboardSalesTrendItem {
  day: string;
  date: string;
  total: number;
}

export interface DashboardActivity {
  id: string;
  title: string;
  description: string;
  type: "danger" | "warning" | "info" | "success";
}

export interface DashboardMetricsData {
  omset_hari_ini: DashboardOmset;
  transaksi_hari_ini: DashboardTransaksi;
  stok_kritis: DashboardStokKritis;
  ed_kurang_90_hari: DashboardEdKurang90;
  sales_trend: DashboardSalesTrendItem[];
  activities: DashboardActivity[];
}

export interface DashboardMetricsResponse {
  status: "success" | "error";
  data: DashboardMetricsData;
}

// ── Global Search ────────────────────────────────────────────

export interface SearchResultItem {
  id: number;
  label: string;
  sub_label: string;
  meta: string;
  type: "produk" | "pasien" | "resep";
  url: string;
  raw: Record<string, unknown>;
}

export interface SearchData {
  produk: SearchResultItem[];
  pasien: SearchResultItem[];
  resep: SearchResultItem[];
}

export interface SearchResponse {
  status: "success" | "error";
  query: string;
  total: number;
  data: SearchData;
}
