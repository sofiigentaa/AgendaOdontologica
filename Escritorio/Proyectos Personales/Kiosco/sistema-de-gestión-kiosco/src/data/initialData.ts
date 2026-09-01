import { Product, Sale, StockMovement, CashRegisterShift } from '../types';

export const INITIAL_CATEGORIES = [
  'Golosinas & Chocolates',
  'Bebidas & Aguas',
  'Cigarrillos & Tabacos',
  'Galletitas & Snacks',
  'Lácteos & Fiambrería',
  'Helados & Postres',
  'Almacén & Despensa',
  'Librería & Bazar',
  'Higiene & Limpieza',
  'Recargas & Varios',
] as const;

// Helper to get dates relative to now
const today = new Date();
const formatDate = (daysOffset: number = 0, hour: number = 12, min: number = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

const formatExpiryDate = (daysOffset: number = 0) => {
  const d = new Date(today);
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
};

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-001',
    barcode: '7790895000450',
    name: 'Coca Cola 500ml',
    category: 'Bebidas & Aguas',
    costPrice: 900,
    salePrice: 1500,
    stock: 24,
    minStock: 10,
    expirationDate: formatExpiryDate(120),
    unit: 'u.',
    supplier: 'Coca-Cola FEMSA',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-002',
    barcode: '7790895000467',
    name: 'Coca Cola Zero 500ml',
    category: 'Bebidas & Aguas',
    costPrice: 900,
    salePrice: 1500,
    stock: 6, // Low stock alert! (min 10)
    minStock: 10,
    expirationDate: formatExpiryDate(90),
    unit: 'u.',
    supplier: 'Coca-Cola FEMSA',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-003',
    barcode: '7790070411802',
    name: 'Alfajor Havanna 70% Cacao',
    category: 'Golosinas & Chocolates',
    costPrice: 1300,
    salePrice: 2200,
    stock: 15,
    minStock: 8,
    expirationDate: formatExpiryDate(45),
    unit: 'u.',
    supplier: 'Havanna Directo',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-004',
    barcode: '7790580123456',
    name: 'Alfajor Guaymallén Chocolate',
    category: 'Golosinas & Chocolates',
    costPrice: 280,
    salePrice: 500,
    stock: 3, // Very low stock! (min 15)
    minStock: 15,
    expirationDate: formatExpiryDate(60),
    unit: 'u.',
    supplier: 'Distribuidora San Juan',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-005',
    barcode: '7790040112233',
    name: 'Chicles Beldent Menta Fuerte',
    category: 'Golosinas & Chocolates',
    costPrice: 350,
    salePrice: 700,
    stock: 32,
    minStock: 12,
    expirationDate: formatExpiryDate(180),
    unit: 'u.',
    supplier: 'Mondelez',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-006',
    barcode: '7790040998877',
    name: 'Chocolate Block Cofler 110g',
    category: 'Golosinas & Chocolates',
    costPrice: 1400,
    salePrice: 2400,
    stock: 8,
    minStock: 5,
    expirationDate: formatExpiryDate(80),
    unit: 'u.',
    supplier: 'Arcor S.A.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-007',
    barcode: '7791234567890',
    name: 'Papas Fritas Lays Clásicas 85g',
    category: 'Galletitas & Snacks',
    costPrice: 1100,
    salePrice: 1900,
    stock: 14,
    minStock: 8,
    expirationDate: formatExpiryDate(35),
    unit: 'u.',
    supplier: 'Pepsico Snacks',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-008',
    barcode: '7791234567891',
    name: 'Doritos Mega Queso 90g',
    category: 'Galletitas & Snacks',
    costPrice: 1250,
    salePrice: 2100,
    stock: 4, // Low stock (min 6)
    minStock: 6,
    expirationDate: formatExpiryDate(4), // Expiring in 4 days! Alert!
    unit: 'u.',
    supplier: 'Pepsico Snacks',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-009',
    barcode: '7790060012345',
    name: 'Galletitas Chocolinas 170g',
    category: 'Galletitas & Snacks',
    costPrice: 850,
    salePrice: 1400,
    stock: 18,
    minStock: 10,
    expirationDate: formatExpiryDate(90),
    unit: 'u.',
    supplier: 'Bagley / Arcor',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-010',
    barcode: '7790060054321',
    name: 'Galletitas Oreo 118g',
    category: 'Galletitas & Snacks',
    costPrice: 950,
    salePrice: 1600,
    stock: 22,
    minStock: 10,
    expirationDate: formatExpiryDate(110),
    unit: 'u.',
    supplier: 'Mondelez',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-011',
    barcode: '7798000111222',
    name: 'Cigarrillos Marlboro Box 20',
    category: 'Cigarrillos & Tabacos',
    costPrice: 3200,
    salePrice: 3600,
    stock: 35,
    minStock: 15,
    expirationDate: undefined,
    unit: 'u.',
    supplier: 'Massalin Particulares',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-012',
    barcode: '7798000333444',
    name: 'Cigarrillos Philip Morris Box 20',
    category: 'Cigarrillos & Tabacos',
    costPrice: 2800,
    salePrice: 3200,
    stock: 28,
    minStock: 15,
    expirationDate: undefined,
    unit: 'u.',
    supplier: 'Massalin Particulares',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-013',
    barcode: '7790895000999',
    name: 'Agua Mineral Villavicencio 500ml',
    category: 'Bebidas & Aguas',
    costPrice: 550,
    salePrice: 1000,
    stock: 30,
    minStock: 12,
    expirationDate: formatExpiryDate(150),
    unit: 'u.',
    supplier: 'Aguas Danone',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-014',
    barcode: '7790895000888',
    name: 'Monster Energy Drink 473ml',
    category: 'Bebidas & Aguas',
    costPrice: 1600,
    salePrice: 2600,
    stock: 12,
    minStock: 8,
    expirationDate: formatExpiryDate(200),
    unit: 'u.',
    supplier: 'Coca-Cola FEMSA',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-015',
    barcode: '7790070001111',
    name: 'Yogur La Serenísima Frutilla 190g',
    category: 'Lácteos & Fiambrería',
    costPrice: 700,
    salePrice: 1200,
    stock: 5, // Near expiry alert!
    minStock: 4,
    expirationDate: formatExpiryDate(2), // Expiring in 2 days!
    unit: 'u.',
    supplier: 'Mastellone Hnos',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-016',
    barcode: '7790070002222',
    name: 'Sándwich de Miga Jamón y Queso (Triple)',
    category: 'Lácteos & Fiambrería',
    costPrice: 1200,
    salePrice: 2200,
    stock: 6,
    minStock: 4,
    expirationDate: formatExpiryDate(1), // Expiring tomorrow!
    unit: 'u.',
    supplier: 'Panificadora Del Sol',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-017',
    barcode: '7790080003333',
    name: 'Encendedor Bic Maxi',
    category: 'Librería & Bazar',
    costPrice: 850,
    salePrice: 1500,
    stock: 0, // OUT OF STOCK!
    minStock: 5,
    unit: 'u.',
    supplier: 'Bic Argentina',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-018',
    barcode: '7790090004444',
    name: 'Caramelos Sugus Confitados 50g',
    category: 'Golosinas & Chocolates',
    costPrice: 320,
    salePrice: 650,
    stock: 25,
    minStock: 10,
    expirationDate: formatExpiryDate(100),
    unit: 'u.',
    supplier: 'Arcor S.A.',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-019',
    barcode: '7790100005555',
    name: 'Cerveza Quilmes Clásica Lata 473ml',
    category: 'Bebidas & Aguas',
    costPrice: 1100,
    salePrice: 1800,
    stock: 20,
    minStock: 10,
    expirationDate: formatExpiryDate(120),
    unit: 'u.',
    supplier: 'Cervecería Quilmes',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'prod-020',
    barcode: '7790110006666',
    name: 'Pañuelos Elite Pocket x6',
    category: 'Higiene & Limpieza',
    costPrice: 400,
    salePrice: 800,
    stock: 16,
    minStock: 6,
    unit: 'u.',
    supplier: 'Papelera del Plata',
    updatedAt: new Date().toISOString(),
  },
];

// Generate past sales for analytics
export const generateSampleSales = (): Sale[] => {
  const sales: Sale[] = [];
  const paymentMethods = ['Efectivo', 'Tarjeta de Débito', 'Transferencia / MP', 'Tarjeta de Crédito'] as const;

  // Generate sales over the past 14 days
  for (let dayOffset = -13; dayOffset <= 0; dayOffset++) {
    const salesCountThisDay = Math.floor(Math.random() * 5) + 6; // 6 to 10 sales per day
    for (let s = 0; s < salesCountThisDay; s++) {
      const hour = 9 + Math.floor(Math.random() * 13); // 9:00 to 22:00
      const min = Math.floor(Math.random() * 60);
      const date = formatDate(dayOffset, hour, min);

      // Random 1 to 4 items
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedProds = [...INITIAL_PRODUCTS].sort(() => 0.5 - Math.random()).slice(0, numItems);

      let subtotal = 0;
      let totalCost = 0;

      const items = selectedProds.map((prod) => {
        const qty = Math.floor(Math.random() * 2) + 1;
        const total = prod.salePrice * qty;
        const cost = prod.costPrice * qty;
        const profit = total - cost;
        subtotal += total;
        totalCost += cost;
        return {
          productId: prod.id,
          productName: prod.name,
          category: prod.category,
          quantity: qty,
          unitCost: prod.costPrice,
          unitPrice: prod.salePrice,
          total,
          profit,
        };
      });

      const totalProfit = subtotal - totalCost;
      const method = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];

      sales.push({
        id: `sale-${Math.abs(dayOffset)}-${s}-${Math.random().toString(36).substring(2, 6)}`,
        date,
        items,
        subtotal,
        discount: 0,
        total: subtotal,
        totalCost,
        totalProfit,
        paymentMethod: method,
        status: 'completada',
        cashReceived: method === 'Efectivo' ? Math.ceil(subtotal / 1000) * 1000 : undefined,
        change: method === 'Efectivo' ? Math.max(0, Math.ceil(subtotal / 1000) * 1000 - subtotal) : 0,
      });
    }
  }

  return sales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const INITIAL_SHIFTS: CashRegisterShift[] = [
  {
    id: 'shift-current',
    openedAt: new Date(new Date().setHours(8, 0, 0, 0)).toISOString(),
    initialCash: 15000,
    isOpen: true,
  },
];
