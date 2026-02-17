import { AppState, User, Project, Vendor, Material, Expense, Income, Invoice, StockHistoryEntry } from './types';

export const MOCK_USER: User = {
  id: 'u1',
  name: 'Ahmed Khan',
  email: 'ahmed@buildtrack.pro',
  role: 'Admin',
  avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop'
};

const tradeCategories = ['Material', 'Labor', 'Equipment', 'Overhead', 'Permit', 'Fuel', 'Security'];
const stockingUnits = ['Bag', 'Ton', 'KG', 'Piece', 'Cubic Meter', 'Litre', 'Feet'];
const siteStatuses = ['Upcoming', 'Active', 'On Hold', 'Completed', 'Cancelled'];

// Helper to generate a random date within the last 6 months
const randomDate = (start: Date, end: Date) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString().split('T')[0];
};

const generateDummyData = (): Partial<AppState> => {
  const projects: Project[] = [];
  const vendors: Vendor[] = [];
  const materials: Material[] = [];
  const expenses: Expense[] = [];
  const invoices: Invoice[] = [];
  const incomes: Income[] = [];

  // 1. Generate 500 Projects (450 sites, 50 godowns)
  for (let i = 1; i <= 500; i++) {
    const isGodown = i > 450;
    projects.push({
      id: `p-${i}`,
      name: isGodown ? `Storage Hub ${i - 450}` : `Construction Site ${i}`,
      client: isGodown ? 'Internal' : `Client ${Math.ceil(i / 10)}`,
      location: `Zone ${Math.ceil(i / 50)}, Sector ${i % 10}`,
      startDate: randomDate(new Date(2023, 0, 1), new Date()),
      endDate: '',
      budget: isGodown ? 0 : Math.floor(Math.random() * 9000000) + 1000000,
      status: isGodown ? 'Active' : siteStatuses[Math.floor(Math.random() * siteStatuses.length)],
      description: `Description for ${isGodown ? 'Godown' : 'Site'} ${i}`,
      contactNumber: `+91 90000 ${10000 + i}`,
      isGodown
    });
  }

  // 2. Generate 500 Suppliers
  for (let i = 1; i <= 500; i++) {
    vendors.push({
      id: `v-${i}`,
      name: `Supplier ${i} Enterprise`,
      phone: `+91 80000 ${20000 + i}`,
      address: `Industrial Area Phase ${Math.ceil(i / 100)}, Block ${i % 20}`,
      category: tradeCategories[Math.floor(Math.random() * tradeCategories.length)],
      email: `contact@supplier${i}.com`,
      balance: 0 // Will be updated by transactions
    });
  }

  // 3. Generate 1000 Inventory Items
  for (let i = 1; i <= 1000; i++) {
    materials.push({
      id: `m-${i}`,
      name: `Resource Item ${i}`,
      unit: stockingUnits[Math.floor(Math.random() * stockingUnits.length)],
      costPerUnit: Math.floor(Math.random() * 500) + 50,
      totalPurchased: 0,
      totalUsed: 0,
      history: []
    });
  }

  // 4. Generate 100 Invoices
  for (let i = 1; i <= 100; i++) {
    const projId = `p-${Math.floor(Math.random() * 450) + 1}`;
    invoices.push({
      id: `inv-${i}`,
      projectId: projId,
      date: randomDate(new Date(2024, 0, 1), new Date()),
      amount: Math.floor(Math.random() * 500000) + 50000,
      description: `Milestone Billing ${Math.ceil(i / 10)}`,
      status: 'Sent',
      dueDate: randomDate(new Date(), new Date(2025, 11, 31))
    });
  }

  // 5. Generate 500 Transactions (Expenses/Stock Inwards)
  for (let i = 1; i <= 500; i++) {
    const isMaterial = Math.random() > 0.3;
    const projId = projects[Math.floor(Math.random() * projects.length)].id;
    const vendorId = vendors[Math.floor(Math.random() * vendors.length)].id;
    const matId = isMaterial ? materials[Math.floor(Math.random() * materials.length)].id : undefined;
    const qty = isMaterial ? Math.floor(Math.random() * 100) + 1 : undefined;
    const amount = isMaterial ? (qty! * materials.find(m => m.id === matId)?.costPerUnit!) : (Math.floor(Math.random() * 10000) + 500);

    const expense: Expense = {
      id: `e-${i}`,
      date: randomDate(new Date(2024, 0, 1), new Date()),
      projectId: projId,
      vendorId: vendorId,
      materialId: matId,
      materialQuantity: qty,
      amount: amount,
      paymentMethod: 'Bank',
      notes: `Bulk generated transaction record ${i}`,
      category: isMaterial ? 'Material' : tradeCategories[Math.floor(Math.random() * tradeCategories.length)],
      inventoryAction: isMaterial ? 'Purchase' : undefined
    };

    expenses.push(expense);

    // Update Vendor Balance if it's a purchase
    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) vendor.balance += amount;

    // Update Material History and Totals
    if (matId && isMaterial) {
      const material = materials.find(m => m.id === matId);
      if (material) {
        material.totalPurchased += qty!;
        material.history = material.history || [];
        material.history.push({
          id: `sh-e-${i}`,
          date: expense.date,
          type: 'Purchase',
          quantity: qty!,
          projectId: projId,
          vendorId: vendorId,
          unitPrice: material.costPerUnit,
          note: expense.notes
        });
      }
    }
  }

  return { projects, vendors, materials, expenses, invoices, incomes };
};

const dummy = generateDummyData();

export const INITIAL_STATE: AppState = {
  currentUser: MOCK_USER,
  theme: 'light',
  projects: dummy.projects || [],
  vendors: dummy.vendors || [],
  materials: dummy.materials || [],
  expenses: dummy.expenses || [],
  payments: [],
  incomes: [],
  invoices: dummy.invoices || [],
  tradeCategories: tradeCategories,
  stockingUnits: stockingUnits,
  siteStatuses: siteStatuses,
  allowDecimalStock: true
};
