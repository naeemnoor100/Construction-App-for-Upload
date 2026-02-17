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

// Helper to generate a random date within the last 12 months
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

  // 1. Generate 500 Projects
  for (let i = 1; i <= 500; i++) {
    const isGodown = i > 450;
    projects.push({
      id: `p-${i}`,
      name: isGodown ? `Storage Hub ${i - 450}` : `Construction Site ${i}`,
      client: isGodown ? 'Internal' : `Client ${Math.ceil(i / 10)}`,
      location: `Zone ${Math.ceil(i / 50)}, Sector ${i % 10}`,
      startDate: randomDate(new Date(2023, 0, 1), new Date()),
      endDate: '',
      budget: isGodown ? 0 : Math.floor(Math.random() * 50000000) + 5000000,
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
      balance: 0
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
      date: randomDate(new Date(2023, 6, 1), new Date(2024, 0, 1)),
      amount: Math.floor(Math.random() * 2000000) + 500000,
      description: `Phase ${Math.ceil(i / 20)} Construction Milestone`,
      status: 'Sent',
      dueDate: randomDate(new Date(), new Date(2025, 11, 31))
    });
  }

  // 5. Generate 500 Transactions (Expenses)
  for (let i = 1; i <= 500; i++) {
    const isMaterial = Math.random() > 0.3;
    const projId = projects[Math.floor(Math.random() * projects.length)].id;
    const vendorId = vendors[Math.floor(Math.random() * vendors.length)].id;
    const matId = isMaterial ? materials[Math.floor(Math.random() * materials.length)].id : undefined;
    const qty = isMaterial ? Math.floor(Math.random() * 100) + 1 : undefined;
    const amount = isMaterial ? (qty! * materials.find(m => m.id === matId)?.costPerUnit!) : (Math.floor(Math.random() * 10000) + 500);

    expenses.push({
      id: `e-${i}`,
      date: randomDate(new Date(2023, 6, 1), new Date()),
      projectId: projId,
      vendorId: vendorId,
      materialId: matId,
      materialQuantity: qty,
      amount: amount,
      paymentMethod: 'Bank',
      notes: `Record #${i}: Automatic transaction logging`,
      category: isMaterial ? 'Material' : tradeCategories[Math.floor(Math.random() * tradeCategories.length)],
      inventoryAction: isMaterial ? 'Purchase' : undefined
    });

    const vendor = vendors.find(v => v.id === vendorId);
    if (vendor) vendor.balance += amount;

    if (matId && isMaterial) {
      const material = materials.find(m => m.id === matId);
      if (material) {
        material.totalPurchased += qty!;
        material.history = material.history || [];
        material.history.push({
          id: `sh-e-${i}`,
          date: randomDate(new Date(2023, 6, 1), new Date()),
          type: 'Purchase',
          quantity: qty!,
          projectId: projId,
          vendorId: vendorId,
          unitPrice: material.costPerUnit,
          note: `Auto-generated inward`
        });
      }
    }
  }

  // 6. Generate 5000 Income (Revenue Ledger) entries
  for (let i = 1; i <= 5000; i++) {
    const projIndex = Math.floor(Math.random() * 450); // Sites only
    const project = projects[projIndex];
    const projectInvoices = invoices.filter(inv => inv.projectId === project.id);
    const invoiceId = projectInvoices.length > 0 ? projectInvoices[Math.floor(Math.random() * projectInvoices.length)].id : undefined;
    
    incomes.push({
      id: `inc-${i}`,
      projectId: project.id,
      date: randomDate(new Date(2023, 8, 1), new Date()),
      amount: Math.floor(Math.random() * 50000) + 5000,
      description: `Payment Receipt ${i} against Phase Milestone`,
      method: ['Bank', 'Cash', 'Online'][Math.floor(Math.random() * 3)] as any,
      invoiceId: invoiceId
    });
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
  incomes: dummy.incomes || [],
  invoices: dummy.invoices || [],
  tradeCategories: tradeCategories,
  stockingUnits: stockingUnits,
  siteStatuses: siteStatuses,
  allowDecimalStock: true
};
