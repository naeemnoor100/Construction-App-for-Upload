import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  Package, Search, X, Trash2, Pencil, Plus, History, Layers, Truck, TrendingDown, Scale, Lock, Link
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Material, MaterialUnit, StockHistoryEntry } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;

const ITEMS_PER_PAGE = 50;

// Memoized Row Component to prevent unnecessary re-renders of the whole table
const MaterialRow = React.memo(({ mat, projectFilter, projects, updateMaterial, deleteMaterial, setHistoryMaterial, handleOpenUsageModal, handleOpenEditModal }: any) => {
  const remaining = mat.siteBalance;
  const isProjectFiltered = projectFilter !== 'All';
  const filterProj = projects.find((p: any) => p.id === projectFilter);
  
  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
      <td className="px-8 py-5">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg group-hover:scale-110 transition-transform ${isProjectFiltered && filterProj?.isGodown ? 'bg-slate-900 text-white' : 'bg-blue-50 dark:bg-slate-700 text-blue-600 dark:text-blue-300'}`}>
             {mat.name.charAt(0)}
          </div>
          <div>
            <p className="font-black text-sm text-slate-900 dark:text-slate-100 uppercase tracking-tight">{mat.name}</p>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Unit: {mat.unit}</p>
          </div>
        </div>
      </td>
      <td className="px-8 py-5 text-xs font-black text-slate-600 dark:text-slate-400">{formatCurrency(mat.stockValue)}</td>
      <td className="px-8 py-5">
         <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${remaining < 10 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            {remaining.toLocaleString()} {mat.unit}s {isProjectFiltered ? (filterProj?.isGodown ? 'in Godown' : 'on Site') : ''}
         </span>
      </td>
      <td className="px-8 py-5 text-right">
         <div className="flex justify-end gap-2 items-center">
           <button onClick={() => handleOpenUsageModal(mat.id, isProjectFiltered ? projectFilter : undefined)} className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shadow-sm flex items-center gap-2 ${isProjectFiltered && !filterProj?.isGodown ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 hover:bg-blue-600 hover:text-white'}`}>
             {isProjectFiltered && filterProj?.isGodown ? <><Truck size={14} /> Dispatch</> : <><TrendingDown size={14} /> Use</>}
           </button>
           <button onClick={() => setHistoryMaterial(mat)} className="p-3 text-slate-400 bg-slate-50 dark:bg-slate-700/50 rounded-2xl hover:text-slate-900 dark:hover:text-white shadow-sm transition-all"><History size={20} /></button>
           <button onClick={() => handleOpenEditModal(mat)} className="p-3 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
           <button onClick={() => { if(confirm(`Delete ${mat.name}?`)) deleteMaterial(mat.id); }} className="p-3 text-slate-300 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
         </div>
      </td>
    </tr>
  );
});

export const Inventory: React.FC = () => {
  const { materials, projects, vendors, stockingUnits, payments, expenses, updateMaterial, addMaterial, deleteMaterial, addExpense, deleteExpense, updateExpense, allowDecimalStock } = useApp();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [projectFilter, setProjectFilter] = useState('All');
  const [vendorFilter, setVendorFilter] = useState('All');
  const [inventorySort, setInventorySort] = useState('name');
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  // Modals state
  const [showProcureModal, setShowProcureModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [historyMaterial, setHistoryMaterial] = useState<Material | null>(null);

  const filteredMaterials = useMemo(() => {
    let result = materials.map(mat => {
      let siteBalance = mat.totalPurchased - mat.totalUsed;
      let stockValue = 0;
      let hasProjectLink = true;
      const history = mat.history || [];
      if (projectFilter === 'All') {
        stockValue = history.reduce((sum, h) => sum + (h.quantity * (h.unitPrice || mat.costPerUnit)), 0);
      } else {
        const siteEntries = history.filter(h => h.projectId === projectFilter);
        siteBalance = siteEntries.reduce((sum, h) => sum + h.quantity, 0);
        stockValue = siteEntries.reduce((sum, h) => sum + (h.quantity * (h.unitPrice || mat.costPerUnit)), 0);
        hasProjectLink = siteEntries.some(h => h.quantity > 0);
      }
      return { ...mat, siteBalance, stockValue, hasProjectLink };
    });

    result = result.filter(mat => {
      const ms = mat.name.toLowerCase().includes(searchTerm.toLowerCase());
      const mp = projectFilter === 'All' || mat.hasProjectLink;
      const mv = vendorFilter === 'All' || mat.history?.some(h => h.vendorId === vendorFilter);
      return ms && mp && mv;
    });

    return result.sort((a, b) => {
      if (inventorySort === 'name') return a.name.localeCompare(b.name);
      if (inventorySort === 'stock-low') return a.siteBalance - b.siteBalance;
      if (inventorySort === 'stock-high') return b.siteBalance - a.siteBalance;
      if (inventorySort === 'cost') return b.costPerUnit - a.costPerUnit;
      return 0;
    });
  }, [materials, searchTerm, projectFilter, vendorFilter, inventorySort]);

  const pagedMaterials = useMemo(() => filteredMaterials.slice(0, visibleCount), [filteredMaterials, visibleCount]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Inventory Ledger</h2></div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => setShowBulkModal(true)} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl"><Layers size={18} /> Bulk Inward</button>
          <button onClick={() => setShowProcureModal(true)} className="bg-slate-900 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-xl"><Plus size={18} /> Hub Procure</button>
          <button onClick={() => setShowUsageModal(true)} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg"><TrendingDown size={18} /> Record Use</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search asset..." className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900 border rounded-2xl text-sm dark:text-white font-bold" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }} />
        </div>
        <select className="px-4 py-3.5 bg-slate-50 dark:bg-slate-900 border rounded-2xl text-[10px] font-black uppercase outline-none dark:text-white" value={projectFilter} onChange={(e) => { setProjectFilter(e.target.value); setVisibleCount(ITEMS_PER_PAGE); }}>
           <option value="All">Hub Filter: All</option>
           {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-8 py-5">Material Asset</th>
                <th className="px-8 py-5">Value</th>
                <th className="px-8 py-5">Availability</th>
                <th className="px-8 py-5 text-right">Control</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagedMaterials.map((mat) => (
                <MaterialRow 
                  key={mat.id} 
                  mat={mat} 
                  projectFilter={projectFilter} 
                  projects={projects} 
                  updateMaterial={updateMaterial} 
                  deleteMaterial={deleteMaterial}
                  setHistoryMaterial={setHistoryMaterial}
                  handleOpenUsageModal={(m: string, p: string) => {}}
                  handleOpenEditModal={(m: any) => { setEditingMaterial(m); setShowEditModal(true); }}
                />
              ))}
            </tbody>
          </table>
        </div>
        {visibleCount < filteredMaterials.length && (
          <div className="p-8 text-center bg-slate-50/30">
            <button onClick={() => setVisibleCount(p => p + ITEMS_PER_PAGE)} className="px-10 py-3 bg-white dark:bg-slate-700 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all">Load More Asset Records ({filteredMaterials.length - visibleCount} remaining)</button>
          </div>
        )}
      </div>
    </div>
  );
};