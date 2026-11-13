const API_BASE_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('inventory_token');
  const headers: any = {
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
    ...(options.headers || {}),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const fullUrl = url.startsWith('http') ? url : `${API_BASE_URL}${url}`;

  const response = await fetch(fullUrl, {
    ...options,
    cache: "no-store",
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('inventory_token');
    localStorage.removeItem('inventory_user');
    window.location.href = '/';
  }

  if (!response.ok) {
    let detail = response.statusText;
    try {
      const errJson = await response.json();
      detail = errJson.detail || errJson.message || detail;
    } catch (e) {}
    throw new Error(detail);
  }

  return response.json();
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const getAnalyticsOverview = () => apiFetch('/analytics/overview');
export const getAdvancedAnalytics = () => apiFetch('/advanced-analytics/overview');
export const getBusinessInsights = () => apiFetch('/ai/business-insights');

// ─── Products ─────────────────────────────────────────────────────────────────
export const getProducts = () => apiFetch('/products/');
export const createProduct = (data: any) => apiFetch('/products/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateProduct = (id: number, data: any) => apiFetch(`/products/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteProduct = (id: number) => apiFetch(`/products/${id}`, { method: 'DELETE' });

// ─── Inventory ────────────────────────────────────────────────────────────────
export const getInventory = () => apiFetch('/inventory/');
export const createInventory = (data: any) => apiFetch('/inventory/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateInventory = (id: number, data: any) => apiFetch(`/inventory/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteInventory = (id: number) => apiFetch(`/inventory/${id}`, { method: 'DELETE' });

// ─── Customers ────────────────────────────────────────────────────────────────
export const getCustomers = () => apiFetch('/customers/');
export const createCustomer = (data: any) => apiFetch('/customers/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateCustomer = (id: number, data: any) => apiFetch(`/customers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteCustomer = (id: number) => apiFetch(`/customers/${id}`, { method: 'DELETE' });

// ─── Suppliers ────────────────────────────────────────────────────────────────
export const getSuppliers = () => apiFetch('/suppliers/');
export const createSupplier = (data: any) => apiFetch('/suppliers/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updateSupplier = (id: number, data: any) => apiFetch(`/suppliers/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deleteSupplier = (id: number) => apiFetch(`/suppliers/${id}`, { method: 'DELETE' });

// ─── Warehouses ───────────────────────────────────────────────────────────────
export const getWarehouses = () => apiFetch('/warehouses/');
export const createWarehouse = (data: any) => apiFetch('/warehouses/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

// ─── Sales ────────────────────────────────────────────────────────────────────
export const getSales = () => apiFetch('/sales/');
export const createSale = (data: any) => apiFetch('/sales/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });

// ─── Purchase Orders ──────────────────────────────────────────────────────────
export const getPurchaseOrders = () => apiFetch('/purchase-orders/');
export const createPurchaseOrder = (data: any) => apiFetch('/purchase-orders/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const updatePurchaseOrder = (id: number, data: any) => apiFetch(`/purchase-orders/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
export const deletePurchaseOrder = (id: number) => apiFetch(`/purchase-orders/${id}`, { method: 'DELETE' });

// ─── AI Endpoints ─────────────────────────────────────────────────────────────
export const getAIForecast = () => apiFetch('/ai/forecast');
export const getAIAlerts = () => apiFetch('/ai/alerts');
export const getAIDecisions = () => apiFetch('/ai/decisions');
export const getAIDashboard = () => apiFetch('/ai/dashboard');

export const createAIPurchaseOrder = (productId: number) =>
  apiFetch(`/ai/create-purchase-order/${productId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' } });
export const getAIPurchaseOrders = () => apiFetch('/ai/purchase-orders');
export const getAIPurchaseDraft = () => apiFetch('/ai/purchase-draft');

// ─── Admin ────────────────────────────────────────────────────────────────────
export const getAdminUsers = () => apiFetch('/admin/users');
export const updateUserStatus = (id: number, status: string) =>
  apiFetch(`/admin/users/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
export const updateUserRole = (id: number, role: string) =>
  apiFetch(`/admin/users/${id}/role`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) });
export const deleteAdminUser = (id: number) => apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
