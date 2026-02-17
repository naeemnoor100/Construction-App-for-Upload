import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import { AppState, Project, Vendor, Material, Expense, Payment, Income, User, StockHistoryEntry, Invoice } from './types';
import { INITIAL_STATE } from './constants';

interface AppContextType extends AppState {
  updateUser: (u: User) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setAllowDecimalStock: (val: boolean) => void;
  addProject: (p: Project) => Promise<void>;
  updateProject: (p: Project) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  addVendor: (v: Vendor) => Promise<void>;
  updateVendor: (v: Vendor) => Promise<void>;
  deleteVendor: (id: string) => Promise<void>;
  addMaterial: (m: Material) => Promise<void>;
  updateMaterial: (m: Material) => Promise<void>;
  deleteMaterial: (id: string) => Promise<void>;
  addExpense: (e: Expense) => Promise<void>;
  updateExpense: (e: Expense) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  addPayment: (p: Payment) => Promise<void>;
  updatePayment: (p: Payment) => Promise<void>;
  deletePayment: (id: string) => Promise<void>;
  addIncome: (i: Income) => Promise<void>;
  updateIncome: (i: Income) => Promise<void>;
  deleteIncome: (id: string) => Promise<void>;
  addInvoice: (inv: Invoice) => Promise<void>;
  updateInvoice: (inv: Invoice) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  enableCloudSync: (key: string) => Promise<void>;
  disableCloudSync: () => void;
  forceSync: () => Promise<void>;
  addTradeCategory: (cat: string) => void;
  removeTradeCategory: (cat: string) => void;
  addStockingUnit: (unit: string) => void;
  removeStockingUnit: (unit: string) => void;
  addSiteStatus: (status: string) => void;
  removeSiteStatus: (status: string) => void;
  importState: (newState: AppState) => Promise<void>;
  isLoading: boolean;
  isSyncing: boolean;
  syncError: boolean;
  lastSynced: Date;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  lastActionName: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date());

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800)); 
      const saved = localStorage.getItem('buildtrack_pro_state_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        setState(prev => ({
          ...INITIAL_STATE,
          ...parsed,
          currentUser: parsed.currentUser || INITIAL_STATE.currentUser,
          siteStatuses: parsed.siteStatuses || INITIAL_STATE.siteStatuses,
          tradeCategories: parsed.tradeCategories || INITIAL_STATE.tradeCategories,
          stockingUnits: parsed.stockingUnits || INITIAL_STATE.stockingUnits,
          invoices: parsed.invoices || [],
          allowDecimalStock: parsed.allowDecimalStock ?? true
        }));
      }
      setSyncError(false);
    } catch (e) {
      console.error("Database connection failed", e);
      setSyncError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    localStorage.setItem('buildtrack_pro_state_v2', JSON.stringify(state));
    if (state.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [state]);

  const apiRequest = async (method: string, endpoint: string, body?: any) => {
    setIsSyncing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 400));
      setLastSynced(new Date());
      setSyncError(false);
    } catch (e) {
      setSyncError(true);
      throw e;
    } finally {
      setIsSyncing(false);
    }
  };

  const updateUser = (u: User) => setState(prev => ({ ...prev, currentUser: u }));
  const setTheme = (theme: 'light' | 'dark') => setState(prev => ({ ...prev, theme }));
  const setAllowDecimalStock = (val: boolean) => setState(prev => ({ ...prev, allowDecimalStock: val }));

  const importState = async (newState: AppState) => {
    setState(newState);
    localStorage.setItem('buildtrack_pro_state_v2', JSON.stringify(newState));
  };

  const addProject = async (p: Project) => {
    await apiRequest('POST', '/projects', p);
    setState(prev => ({ ...prev, projects: [...prev.projects, p] }));
  };

  const updateProject = async (p: Project) => {
    await apiRequest('PUT', `/projects/${p.id}`, p);
    setState(prev => ({ ...prev, projects: prev.projects.map(proj => proj.id === p.id ? p : proj) }));
  };

  const deleteProject = async (id: string) => {
    await apiRequest('DELETE', `/projects/${id}`);
    setState(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  };

  const addVendor = async (v: Vendor) => {
    await apiRequest('POST', '/vendors', v);
    setState(prev => ({ ...prev, vendors: [...prev.vendors, v] }));
  };

  const updateVendor = async (v: Vendor) => {
    await apiRequest('PUT', `/vendors/${v.id}`, v);
    setState(prev => ({ ...prev, vendors: prev.vendors.map(vend => vend.id === v.id ? v : vend) }));
  };

  const deleteVendor = async (id: string) => {
    await apiRequest('DELETE', `/vendors/${id}`);
    setState(prev => ({ ...prev, vendors: prev.vendors.filter(v => v.id !== id) }));
  };

  const addMaterial = async (m: Material) => {
    await apiRequest('POST', '/materials', m);
    setState(prev => ({ ...prev, materials: [...prev.materials, m] }));
  };

  const updateMaterial = async (m: Material) => {
    await apiRequest('PUT', `/materials/${m.id}`, m);
    setState(prev => ({ ...prev, materials: prev.materials.map(mat => mat.id === m.id ? m : mat) }));
  };

  const deleteMaterial = async (id: string) => {
    await apiRequest('DELETE', `/materials/${id}`);
    setState(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));
  };

  const addExpense = async (e: Expense) => {
    await apiRequest('POST', '/expenses', e);
    setState(prev => {
      let newVendors = [...prev.vendors];
      if (e.vendorId) {
        newVendors = newVendors.map(v => v.id === e.vendorId ? { ...v, balance: v.balance + e.amount } : v);
      }

      let newMaterials = [...prev.materials];
      if (e.materialId && e.materialQuantity) {
        const isPurchase = e.inventoryAction === 'Purchase' || (!e.inventoryAction && !!e.vendorId);
        newMaterials = newMaterials.map(m => {
          if (m.id === e.materialId) {
            let targetUnitPrice = isPurchase ? (e.amount / e.materialQuantity!) : m.costPerUnit;
            let batchId = isPurchase ? undefined : e.parentPurchaseId;

            if (!isPurchase && !batchId && e.vendorId) {
               const streamPurchases = (m.history || [])
                  .filter(h => h.type === 'Purchase' && h.vendorId === e.vendorId)
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
               
               if (streamPurchases.length > 0) {
                 targetUnitPrice = streamPurchases[0].unitPrice || m.costPerUnit;
                 batchId = streamPurchases[0].id.replace('sh-exp-', '');
               }
            }

            const historyItem: StockHistoryEntry = { 
              id: 'sh-exp-' + e.id, 
              date: e.date, 
              type: isPurchase ? 'Purchase' : 'Usage', 
              quantity: e.materialQuantity!, 
              projectId: e.projectId, 
              vendorId: e.vendorId, 
              note: e.notes, 
              unitPrice: targetUnitPrice,
              parentPurchaseId: batchId
            };

            e.parentPurchaseId = batchId;
            if (!isPurchase && targetUnitPrice > 0) {
              e.amount = (e.materialQuantity || 0) * targetUnitPrice;
            }

            return {
              ...m,
              costPerUnit: isPurchase ? targetUnitPrice : m.costPerUnit,
              totalPurchased: isPurchase ? m.totalPurchased + e.materialQuantity! : m.totalPurchased,
              totalUsed: !isPurchase ? m.totalUsed + e.materialQuantity! : m.totalUsed,
              history: [...(m.history || []), historyItem]
            };
          }
          return m;
        });
      }
      return { ...prev, expenses: [...prev.expenses, e], vendors: newVendors, materials: newMaterials };
    });
  };

  const updateExpense = async (e: Expense) => {
    await apiRequest('PUT', `/expenses/${e.id}`, e);
    setState(prev => {
      const oldExp = prev.expenses.find(x => x.id === e.id);
      
      let nextVendors = [...prev.vendors];
      if (oldExp && oldExp.vendorId) {
        nextVendors = nextVendors.map(v => v.id === oldExp.vendorId ? { ...v, balance: Math.max(0, v.balance - oldExp.amount) } : v);
      }
      if (e.vendorId) {
        nextVendors = nextVendors.map(v => v.id === e.vendorId ? { ...v, balance: v.balance + e.amount } : v);
      }
      
      let nextMaterials = [...prev.materials];
      let updatedPurchaseUnitPrice = 0;
      const isPurchase = e.inventoryAction === 'Purchase' || (!e.inventoryAction && !!e.vendorId);

      if (oldExp && oldExp.materialId && oldExp.materialQuantity) {
        const wasPurchase = oldExp.inventoryAction === 'Purchase' || (!oldExp.inventoryAction && !!oldExp.vendorId);
        nextMaterials = nextMaterials.map(m => {
          if (m.id === oldExp.materialId) {
            return {
              ...m,
              totalPurchased: wasPurchase ? Math.max(0, m.totalPurchased - oldExp.materialQuantity!) : m.totalPurchased,
              totalUsed: !wasPurchase ? Math.max(0, m.totalUsed - oldExp.materialQuantity!) : m.totalUsed,
              history: (m.history || []).filter(h => h.id !== 'sh-exp-' + oldExp.id)
            };
          }
          return m;
        });
      }

      if (e.materialId && e.materialQuantity) {
        if (isPurchase) updatedPurchaseUnitPrice = e.amount / e.materialQuantity;
        
        nextMaterials = nextMaterials.map(m => {
          if (m.id === e.materialId) {
            let targetUnitPrice = isPurchase ? updatedPurchaseUnitPrice : (e.unitPrice || m.costPerUnit);
            
            const newHistoryItem: StockHistoryEntry = {
              id: 'sh-exp-' + e.id,
              date: e.date,
              type: isPurchase ? 'Purchase' : 'Usage',
              quantity: e.materialQuantity!,
              projectId: e.projectId,
              vendorId: e.vendorId,
              note: e.notes,
              unitPrice: targetUnitPrice,
              parentPurchaseId: isPurchase ? undefined : e.parentPurchaseId
            };
            
            return {
              ...m,
              costPerUnit: isPurchase ? targetUnitPrice : m.costPerUnit,
              totalPurchased: isPurchase ? m.totalPurchased + e.materialQuantity! : m.totalPurchased,
              totalUsed: !isPurchase ? m.totalUsed + e.materialQuantity! : m.totalUsed,
              history: [...(m.history || []), newHistoryItem]
            };
          }
          return m;
        });
      }

      let nextExpenses = prev.expenses.map(x => x.id === e.id ? e : x);
      if (isPurchase && updatedPurchaseUnitPrice > 0) {
        nextExpenses = nextExpenses.map(exp => {
          if (exp.inventoryAction === 'Usage' && exp.parentPurchaseId === e.id) {
            return { ...exp, amount: (exp.materialQuantity || 0) * updatedPurchaseUnitPrice };
          }
          return exp;
        });
        
        nextMaterials = nextMaterials.map(m => {
          if (m.id === e.materialId) {
            return {
              ...m,
              history: (m.history || []).map(h => {
                if (h.type === 'Usage' && h.parentPurchaseId === e.id) {
                  return { ...h, unitPrice: updatedPurchaseUnitPrice };
                }
                return h;
              })
            };
          }
          return m;
        });
      }
      
      return {
        ...prev,
        expenses: nextExpenses,
        vendors: nextVendors,
        materials: nextMaterials
      };
    });
  };

  const deleteExpense = async (id: string) => {
    await apiRequest('DELETE', `/expenses/${id}`);
    setState(prev => {
      const oldExp = prev.expenses.find(x => x.id === id);

      let nextVendors = [...prev.vendors];
      if (oldExp && oldExp.vendorId) {
        nextVendors = nextVendors.map(v => v.id === oldExp.vendorId ? { ...v, balance: Math.max(0, v.balance - oldExp.amount) } : v);
      }
      
      let nextMaterials = [...prev.materials];
      if (oldExp && oldExp.materialId && oldExp.materialQuantity) {
        const wasPurchase = oldExp.inventoryAction === 'Purchase' || (!oldExp.inventoryAction && !!oldExp.vendorId);
        nextMaterials = nextMaterials.map(m => {
          if (m.id === oldExp.materialId) {
            return {
              ...m,
              totalPurchased: wasPurchase ? Math.max(0, m.totalPurchased - oldExp.materialQuantity!) : m.totalPurchased,
              totalUsed: !wasPurchase ? Math.max(0, m.totalUsed - oldExp.materialQuantity!) : m.totalUsed,
              history: (m.history || []).filter(h => h.id !== 'sh-exp-' + oldExp.id)
            };
          }
          return m;
        });
      }

      return {
        ...prev,
        expenses: prev.expenses.filter(x => x.id !== id),
        vendors: nextVendors,
        materials: nextMaterials
      };
    });
  };

  const addPayment = async (p: Payment) => {
    await apiRequest('POST', '/payments', p);
    setState(prev => {
      const newVendors = prev.vendors.map(v => v.id === p.vendorId ? { ...v, balance: Math.max(0, v.balance - p.amount) } : v);
      return { ...prev, payments: [...prev.payments, p], vendors: newVendors };
    });
  };

  const updatePayment = async (p: Payment) => {
    await apiRequest('PUT', `/payments/${p.id}`, p);
    setState(prev => {
      const oldPay = prev.payments.find(x => x.id === p.id);
      let nextVendors = [...prev.vendors];
      if (oldPay) {
        nextVendors = nextVendors.map(v => v.id === oldPay.vendorId ? { ...v, balance: v.balance + oldPay.amount } : v);
      }
      nextVendors = nextVendors.map(v => v.id === p.vendorId ? { ...v, balance: Math.max(0, v.balance - p.amount) } : v);
      return { ...prev, payments: prev.payments.map(x => x.id === p.id ? p : x), vendors: nextVendors };
    });
  };

  const deletePayment = async (id: string) => {
    await apiRequest('DELETE', `/payments/${id}`);
    setState(prev => {
      const oldPay = prev.payments.find(x => x.id === id);
      let nextVendors = [...prev.vendors];
      if (oldPay) {
        nextVendors = nextVendors.map(v => v.id === oldPay.vendorId ? { ...v, balance: v.balance + oldPay.amount } : v);
      }
      return { ...prev, payments: prev.payments.filter(x => x.id !== id), vendors: nextVendors };
    });
  };

  const addIncome = async (i: Income) => {
    await apiRequest('POST', '/income', i);
    setState(prev => {
      const nextInvoices = prev.invoices.map(inv => {
        if (i.invoiceId && inv.id === i.invoiceId) {
          // If a payment is linked, check if it fully covers it
          const totalAfterThis = prev.incomes
            .filter(inc => inc.invoiceId === inv.id)
            .reduce((sum, inc) => sum + inc.amount, 0) + i.amount;
          return { ...inv, status: (totalAfterThis >= inv.amount - 0.01 ? 'Paid' : 'Sent') as Invoice['status'] };
        }
        return inv;
      });
      return { ...prev, incomes: [...prev.incomes, i], invoices: nextInvoices };
    });
  };

  const updateIncome = async (i: Income) => {
    await apiRequest('PUT', `/income/${i.id}`, i);
    setState(prev => ({ ...prev, incomes: prev.incomes.map(inc => inc.id === i.id ? i : inc) }));
  };

  const deleteIncome = async (id: string) => {
    await apiRequest('DELETE', `/income/${id}`);
    setState(prev => {
      const oldInc = prev.incomes.find(i => i.id === id);
      let nextInvoices = [...prev.invoices];
      if (oldInc && oldInc.invoiceId) {
        nextInvoices = nextInvoices.map(inv => {
          if (inv.id === oldInc.invoiceId) {
            // Re-calculate remaining if income deleted
            const remainingIncomes = prev.incomes
              .filter(inc => inc.invoiceId === inv.id && inc.id !== id)
              .reduce((sum, inc) => sum + inc.amount, 0);
            return { ...inv, status: (remainingIncomes >= inv.amount - 0.01 ? 'Paid' : 'Sent') as Invoice['status'] };
          }
          return inv;
        });
      }
      return { ...prev, incomes: prev.incomes.filter(i => i.id !== id), invoices: nextInvoices };
    });
  };

  const addInvoice = async (inv: Invoice) => {
    await apiRequest('POST', '/invoices', inv);
    setState(prev => ({ ...prev, invoices: [...prev.invoices, inv] }));
  };

  const updateInvoice = async (inv: Invoice) => {
    await apiRequest('PUT', `/invoices/${inv.id}`, inv);
    setState(prev => ({ ...prev, invoices: prev.invoices.map(i => i.id === inv.id ? i : i) }));
  };

  const deleteInvoice = async (id: string) => {
    await apiRequest('DELETE', `/invoices/${id}`);
    setState(prev => ({ ...prev, invoices: prev.invoices.filter(i => i.id !== id) }));
  };

  const enableCloudSync = async (key: string) => {
    await apiRequest('POST', '/sync/enable', { key });
    setState(prev => ({ ...prev, syncId: key }));
  };

  const disableCloudSync = () => setState(prev => ({ ...prev, syncId: undefined }));
  const forceSync = async () => fetchAllData();

  const addTradeCategory = (cat: string) => setState(prev => ({ ...prev, tradeCategories: [...prev.tradeCategories, cat] }));
  const removeTradeCategory = (cat: string) => setState(prev => ({ ...prev, tradeCategories: prev.tradeCategories.filter(c => c !== cat) }));
  const addStockingUnit = (unit: string) => setState(prev => ({ ...prev, stockingUnits: [...prev.stockingUnits, unit] }));
  const removeStockingUnit = (unit: string) => setState(prev => ({ ...prev, stockingUnits: prev.stockingUnits.filter(u => u !== unit) }));
  const addSiteStatus = (status: string) => setState(prev => ({ ...prev, siteStatuses: [...prev.siteStatuses, status] }));
  const removeSiteStatus = (status: string) => setState(prev => ({ ...prev, siteStatuses: prev.siteStatuses.filter(s => s !== status) }));

  const value = useMemo(() => ({
    ...state,
    updateUser, setTheme, setAllowDecimalStock,
    addProject, updateProject, deleteProject,
    addVendor, updateVendor, deleteVendor,
    addMaterial, updateMaterial, deleteMaterial,
    addExpense, updateExpense, deleteExpense,
    addPayment, updatePayment, deletePayment,
    addIncome, updateIncome, deleteIncome,
    addInvoice, updateInvoice, deleteInvoice,
    enableCloudSync, disableCloudSync, forceSync,
    addTradeCategory, removeTradeCategory,
    addStockingUnit, removeStockingUnit,
    addSiteStatus, removeSiteStatus,
    importState,
    isLoading, isSyncing, syncError, lastSynced,
    undo: () => {}, redo: () => {}, canUndo: false, canRedo: false, lastActionName: ''
  }), [state, isLoading, isSyncing, syncError, lastSynced]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};