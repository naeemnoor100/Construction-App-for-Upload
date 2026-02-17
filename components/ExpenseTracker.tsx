import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Receipt, X, Pencil, Trash2, DollarSign, Briefcase, Info, ShoppingCart, Package
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Expense, PaymentMethod, Payment } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;
const EXPENSES_PER_PAGE = 50;

const ExpenseRow = React.memo(({ exp, projects, materials, vendors, payments, openEdit, handleDelete, handleInitiatePay }: any) => {
  const mat = exp.materialId ? materials.find((m: any) => m.id === exp.materialId) : null;
  const vendor = exp.vendorId ? vendors.find((v: any) => v.id === exp.vendorId) : null;
  const isMaterialPurchase = exp.category === 'Material' && exp.vendorId;
  const totalPaidForExp = payments.filter((p: any) => p.materialBatchId === 'sh-exp-' + exp.id).reduce((sum: number, p: any) => sum + p.amount, 0);
  const isFullyPaid = isMaterialPurchase && totalPaidForExp >= (exp.amount - 0.01);

  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors group">
      <td className="px-8 py-5 text-xs font-bold text-slate-500 dark:text-slate-400">{new Date(exp.date).toLocaleDateString()}</td>
      <td className="px-8 py-5">
        <div className="flex flex-col">
          <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
            {mat ? `${mat.name} (${mat.unit})` : exp.category}
          </p>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
            Supplier: {vendor?.name || 'Self / Direct Site Cost'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter truncate max-w-[120px] flex items-center gap-1">
              <Briefcase size={10} className="text-blue-500" />
              {projects.find((p: any) => p.id === exp.projectId)?.name || 'General'}
            </span>
          </div>
        </div>
      </td>
      <td className="px-8 py-5 text-center">
         {exp.materialQuantity ? (
           <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${exp.inventoryAction === 'Purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
             {exp.materialQuantity.toLocaleString()} {mat?.unit || ''}
           </span>
         ) : <span className="text-slate-300">--</span>}
      </td>
      <td className="px-8 py-5">
        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-[9px] font-black uppercase text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600">
          {exp.category}
        </span>
      </td>
      <td className="px-8 py-5 text-right">
        <p className="text-sm font-black text-red-600">{formatCurrency(exp.amount)}</p>
        {isMaterialPurchase && (
          <p className={`text-[8px] font-black uppercase mt-0.5 ${isFullyPaid ? 'text-emerald-500' : 'text-amber-500'}`}>
            {isFullyPaid ? 'Fully Settled' : `Paid: ${formatCurrency(totalPaidForExp)}`}
          </p>
        )}
      </td>
      <td className="px-8 py-5 text-right">
        <div className="flex justify-end gap-1 items-center">
          {isMaterialPurchase && !isFullyPaid && (
            <button onClick={() => handleInitiatePay(exp)} className="bg-emerald-50 text-emerald-600 p-2.5 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><DollarSign size={16} /></button>
          )}
          <button onClick={() => openEdit(exp)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Pencil size={18} /></button>
          <button onClick={() => handleDelete(exp.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={18} /></button>
        </div>
      </td>
    </tr>
  );
});

export const ExpenseTracker: React.FC = () => {
  const { expenses, projects, vendors, materials, tradeCategories, addExpense, updateExpense, deleteExpense, addPayment, payments } = useApp();
  const [visibleCount, setVisibleCount] = useState(EXPENSES_PER_PAGE);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const sortedExpenses = useMemo(() => [...expenses].slice().reverse(), [expenses]);
  const pagedExpenses = useMemo(() => sortedExpenses.slice(0, visibleCount), [sortedExpenses, visibleCount]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h2 className="text-2xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">Financial Ledger</h2></div>
        <button onClick={() => { setEditingExpense(null); setShowModal(true); }} className="bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg active:scale-95 transition-all"><Plus size={20} /> Record Expense</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border overflow-hidden shadow-sm">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-[1000px]">
            <thead className="bg-slate-50 dark:bg-slate-900 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr><th className="px-8 py-5">Value Date</th><th className="px-8 py-5">Entry Details</th><th className="px-8 py-5 text-center">Quantity</th><th className="px-8 py-5">Category</th><th className="px-8 py-5 text-right">Amount</th><th className="px-8 py-5 text-right">Actions</th></tr>
            </thead>
            <tbody className="divide-y">
              {pagedExpenses.map((exp) => (
                <ExpenseRow 
                  key={exp.id} 
                  exp={exp} 
                  projects={projects} 
                  materials={materials} 
                  vendors={vendors} 
                  payments={payments} 
                  openEdit={(e: any) => { setEditingExpense(e); setShowModal(true); }} 
                  handleDelete={deleteExpense} 
                  handleInitiatePay={(e: any) => {}}
                />
              ))}
            </tbody>
          </table>
        </div>
        {visibleCount < expenses.length && (
          <div className="p-8 text-center bg-slate-50/30">
            <button onClick={() => setVisibleCount(p => p + EXPENSES_PER_PAGE)} className="px-10 py-3 bg-white dark:bg-slate-700 border border-slate-200 rounded-2xl text-xs font-black uppercase shadow-sm">Load More Financial Records ({expenses.length - visibleCount} remaining)</button>
          </div>
        )}
      </div>
    </div>
  );
};