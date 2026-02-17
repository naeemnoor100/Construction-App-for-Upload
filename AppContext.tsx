import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState, Project, Vendor, Material, Expense, Payment, Income, User, StockHistoryEntry, Invoice } from './types';
import { INITIAL_STATE } from './constants';

const API_URL = '/api.php'; 

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
  forceSync: () => Promise<void>;
  enableCloudSync: (id: string) => Promise<void>;
  disableCloudSync: () => void;
  addTradeCategory: (cat: string) => void;
  removeTradeCategory: (cat: string) => void;
  addStockingUnit: (unit: string) => void;
  removeStockingUnit: (unit: string) => void;
  addSiteStatus: (status: string) => void;
  removeSiteStatus: (status: string) => void;
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

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(INITIAL_STATE);
  const [history, setHistory] = useState<AppState[]>([]);
  const [redoStack, setRedoStack] = useState<AppState[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState(false);
  const [lastSynced, setLastSynced] = useState(new Date());
  
  const syncTimeoutRef = useRef<number | null>(null);

  const loadFromLocal = useCallback(() => {
    const saved = localStorage.getItem('buildtrack_pro_state_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setState(prev => ({ ...INITIAL_STATE, ...parsed }));
      } catch (e) {
        console.error("Local storage corrupted", e);
      }
    }
    setIsLoading(false);
  }, []);

  const fetchAllData = useCallback(async (customSyncId?: string) => {
    setIsLoading(true);
    const targetSyncId = customSyncId || state.syncId;
    try {
      const url = targetSyncId ? `${API_URL}?action=sync&syncId=${targetSyncId}` : `${API_URL}?action=sync`;
      const response = await fetch(url);
      if (!response.ok) { loadFromLocal(); return; }
      const text = await response.text();
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const cloudData = JSON.parse(text.substring(firstBrace, lastBrace + 1));
        if (cloudData && !cloudData.error && cloudData.status !== 'empty') {
          setState(prev => ({ ...INITIAL_STATE, ...cloudData, syncId: targetSyncId || prev.syncId }));
          setSyncError(false);
        } else { loadFromLocal(); }
      } else { loadFromLocal(); }
    } catch (e) { setSyncError(true); loadFromLocal(); } finally {
      setIsLoading(false);
      setLastSynced(new Date());
    }
  }, [state.syncId, loadFromLocal]);

  useEffect(() => {
    const saved = localStorage.getItem('buildtrack_pro_state_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.syncId) { fetchAllData(parsed.syncId); return; }
      } catch (e) {}
    }
    fetchAllData();
  }, []);

  // Performance Fix: Debounce pushState to avoid blocking UI during heavy data serialization
  const pushStateDebounced = useCallback((nextState: AppState) => {
    if (syncTimeoutRef.current) window.clearTimeout(syncTimeoutRef.current);
    
    syncTimeoutRef.current = window.setTimeout(async () => {
      setIsSyncing(true);
      try {
        const serialized = JSON.stringify(nextState);
        localStorage.setItem('buildtrack_pro_state_v2', serialized);
        if (nextState.syncId) {
          await fetch(`${API_URL}?action=save_state`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: serialized
          });
        }
        setSyncError(false);
      } catch (e) {
        setSyncError(true);
      } finally {
        setIsSyncing(false);
        setLastSynced(new Date());
      }
    }, 1000); // 1 second debounce
  }, []);

  const updateStateAndPush = useCallback((updater: (prev: AppState) => AppState) => {
    setState(prev => {
      const next = updater(prev);
      setHistory(h => [...h, prev].slice(-20));
      setRedoStack([]);
      pushStateDebounced(next);
      return next;
    });
  }, [pushStateDebounced]);

  // UI context updates (no debounce needed for theme)
  const setTheme = (theme: 'light' | 'dark') => setState(prev => {
    const next = { ...prev, theme };
    localStorage.setItem('buildtrack_pro_state_v2', JSON.stringify(next));
    return next;
  });

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const prev = history[history.length - 1];
    setRedoStack(r => [state, ...r]);
    setHistory(h => h.slice(0, -1));
    setState(prev);
    pushStateDebounced(prev);
  }, [history, state, pushStateDebounced]);

  const redo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory(h => [...h, state]);
    setRedoStack(r => r.slice(1));
    setState(next);
    pushStateDebounced(next);
  }, [redoStack, state, pushStateDebounced]);

  const updateUser = (u: User) => updateStateAndPush(prev => ({ ...prev, currentUser: u }));
  const setAllowDecimalStock = (val: boolean) => updateStateAndPush(prev => ({ ...prev, allowDecimalStock: val }));
  const enableCloudSync = async (id: string) => { updateStateAndPush(prev => ({ ...prev, syncId: id })); fetchAllData(id); };
  const disableCloudSync = () => updateStateAndPush(prev => ({ ...prev, syncId: undefined }));
  const forceSync = async () => fetchAllData();

  const addProject = async (p: Project) => updateStateAndPush(prev => ({ ...prev, projects: [...prev.projects, p] }));
  const updateProject = async (p: Project) => updateStateAndPush(prev => ({ ...prev, projects: prev.projects.map(proj => proj.id === p.id ? p : proj) }));
  const deleteProject = async (id: string) => updateStateAndPush(prev => ({ ...prev, projects: prev.projects.filter(p => p.id !== id) }));
  const addVendor = async (v: Vendor) => updateStateAndPush(prev => ({ ...prev, vendors: [...prev.vendors, v] }));
  const updateVendor = async (v: Vendor) => updateStateAndPush(prev => ({ ...prev, vendors: prev.vendors.map(vend => vend.id === v.id ? v : vend) }));
  const deleteVendor = async (id: string) => updateStateAndPush(prev => ({ ...prev, vendors: prev.vendors.filter(v => v.id !== id) }));
  const addMaterial = async (m: Material) => updateStateAndPush(prev => ({ ...prev, materials: [...prev.materials, m] }));
  const updateMaterial = async (m: Material) => updateStateAndPush(prev => ({ ...prev, materials: prev.materials.map(item => item.id === m.id ? m : item) }));
  const deleteMaterial = async (id: string) => updateStateAndPush(prev => ({ ...prev, materials: prev.materials.filter(m => m.id !== id) }));

  const addExpense = async (e: Expense) => updateStateAndPush(prev => {
    const next = { ...prev, expenses: [...prev.expenses, e] };
    if (e.vendorId && e.inventoryAction === 'Purchase') {
      next.vendors = next.vendors.map(v => v.id === e.vendorId ? { ...v, balance: v.balance + e.amount } : v);
    }
    if (e.materialId) {
      next.materials = next.materials.map(m => {
        if (m.id === e.materialId) {
          const hist = [...(m.history || []), { id: 'sh-exp-'+e.id, date: e.date, type: e.inventoryAction || 'Purchase', quantity: e.materialQuantity || 0, projectId: e.projectId, vendorId: e.vendorId, note: e.notes, unitPrice: e.unitPrice, parentPurchaseId: e.parentPurchaseId }];
          return { ...m, history: hist, totalPurchased: hist.filter(h => h.type === 'Purchase').reduce((s, h) => s + h.quantity, 0), totalUsed: Math.abs(hist.filter(h => h.type === 'Usage').reduce((s, h) => s + h.quantity, 0)) };
        }
        return m;
      });
    }
    return next;
  });

  const updateExpense = async (e: Expense) => updateStateAndPush(prev => ({ ...prev, expenses: prev.expenses.map(item => item.id === e.id ? e : item) }));
  const deleteExpense = async (id: string) => updateStateAndPush(prev => {
    const exp = prev.expenses.find(e => e.id === id);
    if (!exp) return prev;
    const next = { ...prev, expenses: prev.expenses.filter(e => e.id !== id) };
    if (exp.vendorId && exp.inventoryAction === 'Purchase') { next.vendors = next.vendors.map(v => v.id === exp.vendorId ? { ...v, balance: v.balance - exp.amount } : v); }
    if (exp.materialId) { next.materials = next.materials.map(m => m.id === exp.materialId ? { ...m, history: (m.history || []).filter(h => h.id !== 'sh-exp-' + exp.id) } : m); }
    return next;
  });

  const addPayment = async (p: Payment) => updateStateAndPush(prev => ({ ...prev, payments: [...prev.payments, p], vendors: prev.vendors.map(v => v.id === p.vendorId ? { ...v, balance: v.balance - p.amount } : v) }));
  const updatePayment = async (p: Payment) => updateStateAndPush(prev => ({ ...prev, payments: prev.payments.map(item => item.id === p.id ? p : item) }));
  const deletePayment = async (id: string) => updateStateAndPush(prev => {
    const pay = prev.payments.find(p => p.id === id);
    if (!pay) return prev;
    return { ...prev, payments: prev.payments.filter(p => p.id !== id), vendors: prev.vendors.map(v => v.id === pay.vendorId ? { ...v, balance: v.balance + pay.amount } : v) };
  });

  const addIncome = async (i: Income) => updateStateAndPush(prev => ({ ...prev, incomes: [...prev.incomes, i] }));
  const updateIncome = async (i: Income) => updateStateAndPush(prev => ({ ...prev, incomes: prev.incomes.map(item => item.id === i.id ? i : item) }));
  const deleteIncome = async (id: string) => updateStateAndPush(prev => ({ ...prev, incomes: prev.incomes.filter(inc => inc.id !== id) }));
  const addInvoice = async (inv: Invoice) => updateStateAndPush(prev => ({ ...prev, invoices: [...prev.invoices, inv] }));
  const updateInvoice = async (inv: Invoice) => updateStateAndPush(prev => ({ ...prev, invoices: prev.invoices.map(item => item.id === inv.id ? inv : item) }));
  const deleteInvoice = async (id: string) => updateStateAndPush(prev => ({ ...prev, invoices: prev.invoices.filter(item => item.id !== id) }));

  const addTradeCategory = (c: string) => updateStateAndPush(prev => ({ ...prev, tradeCategories: [...prev.tradeCategories, c] }));
  const removeTradeCategory = (c: string) => updateStateAndPush(prev => ({ ...prev, tradeCategories: prev.tradeCategories.filter(item => item !== c) }));
  const addStockingUnit = (u: string) => updateStateAndPush(prev => ({ ...prev, stockingUnits: [...prev.stockingUnits, u] }));
  const removeStockingUnit = (u: string) => updateStateAndPush(prev => ({ ...prev, stockingUnits: prev.stockingUnits.filter(item => item !== u) }));
  const addSiteStatus = (s: string) => updateStateAndPush(prev => ({ ...prev, siteStatuses: [...prev.siteStatuses, s] }));
  const removeSiteStatus = (s: string) => updateStateAndPush(prev => ({ ...prev, siteStatuses: prev.siteStatuses.filter(item => item !== s) }));

  const value = {
    ...state, updateUser, setTheme, setAllowDecimalStock,
    addProject, updateProject, deleteProject, addVendor, updateVendor, deleteVendor,
    addMaterial, updateMaterial, deleteMaterial, addExpense, updateExpense, deleteExpense,
    addPayment, updatePayment, deletePayment, addIncome, updateIncome, deleteIncome,
    addInvoice, updateInvoice, deleteInvoice, forceSync, enableCloudSync, disableCloudSync,
    addTradeCategory, removeTradeCategory, addStockingUnit, removeStockingUnit, addSiteStatus, removeSiteStatus,
    isLoading, isSyncing, syncError, lastSynced, undo, redo, canUndo: history.length > 0, canRedo: redoStack.length > 0, lastActionName: ''
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};