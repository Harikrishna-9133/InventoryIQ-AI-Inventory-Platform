export const customers = [
  { id: 'C001', name: 'Arjun Mehta', company: 'FreshMart Retail', products: 84, value: 248500, lowStock: 6, status: 'Active', lastActivity: '2 hours ago', avatar: 'AM' },
  { id: 'C002', name: 'Priya Sharma', company: 'QuickGrocer Ltd.', products: 62, value: 189200, lowStock: 3, status: 'Active', lastActivity: '5 hours ago', avatar: 'PS' },
  { id: 'C003', name: 'Rohit Verma', company: 'NovaMart Chain', products: 127, value: 412800, lowStock: 11, status: 'Active', lastActivity: '1 day ago', avatar: 'RV' },
  { id: 'C004', name: 'Sneha Patel', company: 'Sunrise Foods', products: 45, value: 97600, lowStock: 0, status: 'Active', lastActivity: '3 days ago', avatar: 'SP' },
  { id: 'C005', name: 'Vikram Singh', company: 'Urban Bazaar', products: 98, value: 315000, lowStock: 8, status: 'Inactive', lastActivity: '12 days ago', avatar: 'VS' },
]

export const suppliers = [
  { id: 'S001', name: 'AgriPrime Wholesale', contact: 'contact@agriprime.in', products: 34, leadTime: '3 days', pendingOrders: 4, score: 94, status: 'Active' },
  { id: 'S002', name: 'Metro Distributors', contact: 'orders@metroDist.com', products: 28, leadTime: '5 days', pendingOrders: 2, score: 87, status: 'Active' },
  { id: 'S003', name: 'Sunrise FMCG', contact: 'supply@sunrisefmcg.in', products: 52, leadTime: '2 days', pendingOrders: 7, score: 96, status: 'Active' },
  { id: 'S004', name: 'IndoTrade Co.', contact: 'hello@indotrade.io', products: 19, leadTime: '7 days', pendingOrders: 1, score: 72, status: 'Review' },
  { id: 'S005', name: 'BestPack Essentials', contact: 'bulk@bestpack.in', products: 41, leadTime: '4 days', pendingOrders: 3, score: 89, status: 'Active' },
]

export const inventoryProducts = [
  { id: 'PRD-001', name: 'Basmati Rice 25kg', category: 'Grains', customer: 'FreshMart Retail', warehouse: 'WH-Mumbai', stock: 340, reserved: 80, predicted: 420, reorder: 150, status: 'In Stock' },
  { id: 'PRD-002', name: 'Sunflower Oil 5L', category: 'Edible Oil', customer: 'QuickGrocer Ltd.', warehouse: 'WH-Delhi', stock: 42, reserved: 15, predicted: 180, reorder: 60, status: 'Low Stock' },
  { id: 'PRD-003', name: 'Toor Dal 10kg', category: 'Pulses', customer: 'NovaMart Chain', warehouse: 'WH-Bangalore', stock: 8, reserved: 8, predicted: 95, reorder: 40, status: 'Critical' },
  { id: 'PRD-004', name: 'Sugar 50kg', category: 'Sweeteners', customer: 'FreshMart Retail', warehouse: 'WH-Mumbai', stock: 620, reserved: 40, predicted: 250, reorder: 100, status: 'Overstock' },
  { id: 'PRD-005', name: 'Atta Wheat Flour 10kg', category: 'Flour', customer: 'Sunrise Foods', warehouse: 'WH-Pune', stock: 0, reserved: 0, predicted: 120, reorder: 50, status: 'Out of Stock' },
  { id: 'PRD-006', name: 'Mustard Oil 1L', category: 'Edible Oil', customer: 'QuickGrocer Ltd.', warehouse: 'WH-Delhi', stock: 185, reserved: 30, predicted: 210, reorder: 75, status: 'In Stock' },
  { id: 'PRD-007', name: 'Chana Dal 5kg', category: 'Pulses', customer: 'Urban Bazaar', warehouse: 'WH-Hyderabad', stock: 27, reserved: 12, predicted: 88, reorder: 35, status: 'Low Stock' },
  { id: 'PRD-008', name: 'Salt Iodized 1kg', category: 'Condiments', customer: 'NovaMart Chain', warehouse: 'WH-Bangalore', stock: 510, reserved: 60, predicted: 340, reorder: 120, status: 'Overstock' },
  { id: 'PRD-009', name: 'Green Tea 100pk', category: 'Beverages', customer: 'FreshMart Retail', warehouse: 'WH-Mumbai', stock: 92, reserved: 20, predicted: 145, reorder: 55, status: 'In Stock' },
  { id: 'PRD-010', name: 'Ghee 500ml', category: 'Dairy', customer: 'Sunrise Foods', warehouse: 'WH-Pune', stock: 14, reserved: 10, predicted: 67, reorder: 30, status: 'Critical' },
]

export const reorderRecommendations = [
  { id: 'PRD-003', name: 'Toor Dal 10kg', stock: 8, predicted: 95, leadTime: '3 days', safety: 20, recommended: 110, stockout: '2 days', priority: 'HIGH', supplier: 'AgriPrime Wholesale' },
  { id: 'PRD-010', name: 'Ghee 500ml', stock: 14, predicted: 67, leadTime: '2 days', safety: 15, recommended: 68, stockout: '4 days', priority: 'HIGH', supplier: 'Sunrise FMCG' },
  { id: 'PRD-005', name: 'Atta Wheat Flour 10kg', stock: 0, predicted: 120, leadTime: '3 days', safety: 25, recommended: 145, stockout: 'Now', priority: 'CRITICAL', supplier: 'Metro Distributors' },
  { id: 'PRD-002', name: 'Sunflower Oil 5L', stock: 42, predicted: 180, leadTime: '5 days', safety: 30, recommended: 170, stockout: '6 days', priority: 'HIGH', supplier: 'BestPack Essentials' },
  { id: 'PRD-007', name: 'Chana Dal 5kg', stock: 27, predicted: 88, leadTime: '4 days', safety: 18, recommended: 80, stockout: '9 days', priority: 'MEDIUM', supplier: 'AgriPrime Wholesale' },
]

export const emailLogs = [
  { id: 'E001', recipient: 'arjun@freshmart.in', type: 'Low Stock Alert', product: 'Sunflower Oil 5L', date: 'Aug 13, 09:14', status: 'Sent' },
  { id: 'E002', recipient: 'ops@novamart.in', type: 'Stockout Warning', product: 'Atta Wheat Flour 10kg', date: 'Aug 13, 08:00', status: 'Sent' },
  { id: 'E003', recipient: 'priya@quickgrocer.com', type: 'Reorder Notification', product: 'Toor Dal 10kg', date: 'Aug 13, 10:30', status: 'Scheduled' },
  { id: 'E004', recipient: 'sneha@sunrisefoods.in', type: 'Weekly Report', product: 'All Products', date: 'Aug 12, 17:00', status: 'Sent' },
  { id: 'E005', recipient: 'vikram@urbanbazaar.in', type: 'Supplier Notification', product: 'Chana Dal 5kg', date: 'Aug 12, 14:20', status: 'Failed' },
  { id: 'E006', recipient: 'arjun@freshmart.in', type: 'Low Stock Alert', product: 'Ghee 500ml', date: 'Aug 13, 11:00', status: 'Scheduled' },
]

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
export const salesForecastData = months.map((m, i) => ({
  month: m,
  actual: [310, 290, 340, 370, 320, 410, 445, 480][i],
  forecast: [315, 295, 335, 380, 330, 415, 440, 510][i],
  confidence_high: [340, 320, 365, 410, 360, 450, 480, 555][i],
  confidence_low: [285, 265, 305, 350, 300, 380, 400, 465][i],
}))

const days30 = Array.from({ length: 30 }, (_, i) => `D${i + 1}`)
export const forecastData30 = days30.map((d, i) => ({
  day: d,
  historical: i < 20 ? Math.round(80 + Math.sin(i * 0.5) * 20 + Math.random() * 15) : undefined,
  predicted: i >= 18 ? Math.round(95 + Math.sin((i + 2) * 0.5) * 22 + i * 0.8) : undefined,
  actual: i < 20 ? Math.round(83 + Math.sin(i * 0.5) * 18 + Math.random() * 12) : undefined,
  ci_high: i >= 18 ? Math.round(108 + Math.sin((i + 2) * 0.5) * 25 + i * 0.9) : undefined,
  ci_low: i >= 18 ? Math.round(82 + Math.sin((i + 2) * 0.5) * 19 + i * 0.7) : undefined,
}))

export const inventoryTrendData = months.map((m, i) => ({
  month: m,
  inStock: [1840, 1920, 1780, 2010, 1950, 2180, 2240, 2310][i],
  lowStock: [120, 95, 140, 110, 130, 105, 88, 74][i],
  outOfStock: [22, 18, 26, 14, 20, 16, 12, 8][i],
}))

export const categoryData = [
  { category: 'Grains', value: 38, fill: '#3b82f6' },
  { category: 'Edible Oil', value: 22, fill: '#06b6d4' },
  { category: 'Pulses', value: 18, fill: '#8b5cf6' },
  { category: 'Dairy', value: 12, fill: '#10b981' },
  { category: 'Beverages', value: 6, fill: '#f59e0b' },
  { category: 'Others', value: 4, fill: '#64748b' },
]

export const topProducts = [
  { name: 'Basmati Rice 25kg', sales: 1240, growth: 12.4 },
  { name: 'Sunflower Oil 5L', sales: 980, growth: 8.1 },
  { name: 'Toor Dal 10kg', sales: 875, growth: -3.2 },
  { name: 'Sugar 50kg', sales: 762, growth: 5.7 },
  { name: 'Atta Wheat Flour 10kg', sales: 641, growth: 18.9 },
]

export const revenueAnalyticsData = months.map((m, i) => ({
  month: m,
  revenue: [820, 754, 910, 985, 871, 1120, 1240, 1380][i] * 1000,
  cost: [580, 520, 640, 690, 600, 780, 860, 950][i] * 1000,
  profit: [240, 234, 270, 295, 271, 340, 380, 430][i] * 1000,
}))

export const warehouseData = [
  { name: 'WH-Mumbai', utilization: 78, capacity: 5000, used: 3900 },
  { name: 'WH-Delhi', utilization: 62, capacity: 4200, used: 2600 },
  { name: 'WH-Bangalore', utilization: 91, capacity: 3800, used: 3460 },
  { name: 'WH-Pune', utilization: 45, capacity: 2800, used: 1260 },
  { name: 'WH-Hyderabad', utilization: 67, capacity: 3200, used: 2140 },
]

export const notificationsData = [
  { id: 1, type: 'critical', title: 'Stockout Detected', desc: 'Atta Wheat Flour 10kg at WH-Pune is out of stock.', time: '8 min ago', read: false },
  { id: 2, type: 'warning', title: 'Low Stock Alert', desc: 'Ghee 500ml has dropped below reorder threshold (14 units).', time: '41 min ago', read: false },
  { id: 3, type: 'warning', title: 'Low Stock Alert', desc: 'Toor Dal 10kg at WH-Bangalore — only 8 units remaining.', time: '1 hr ago', read: false },
  { id: 4, type: 'ai', title: 'Forecast Updated', desc: 'LSTM model retrained. Accuracy improved to 94.2% MAPE.', time: '3 hrs ago', read: true },
  { id: 5, type: 'info', title: 'Purchase Order #PO-2241 Confirmed', desc: 'AgriPrime Wholesale confirmed delivery for Aug 16.', time: '5 hrs ago', read: true },
  { id: 6, type: 'ai', title: 'Demand Spike Predicted', desc: 'Rice demand expected +28% in WH-Mumbai next 7 days.', time: '8 hrs ago', read: true },
  { id: 7, type: 'info', title: 'New Customer Onboarded', desc: 'Vikram Singh from Urban Bazaar account activated.', time: '1 day ago', read: true },
  { id: 8, type: 'critical', title: 'Supplier Delay', desc: 'Metro Distributors reported 2-day delay on order #PO-2238.', time: '1 day ago', read: true },
]
