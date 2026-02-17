import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { 
  ArrowUpCircle, 
  Plus, 
  DollarSign, 
  Briefcase, 
  Calendar, 
  CreditCard, 
  X, 
  Search, 
  ChevronRight, 
  Pencil, 
  Trash2,
  TrendingUp,
  Receipt,
  Filter,
  ArrowRight,
  Info,
  Wallet,
  FileText,
  ArrowDownCircle,
  Activity,
  Target,
  Clock,
  LayoutGrid,
  TrendingDown
} from 'lucide-react';
import { useApp } from '../AppContext';
import { Income, PaymentMethod, Project, Invoice } from '../types';

const formatCurrency = (val: number) => `Rs. ${val.toLocaleString('en-IN')}`;
const PROJECTS_PER_PAGE = 10;

export const ProjectIncome: React.FC = () => {
  const { projects, incomes, expenses, invoices, addIncome, updateIncome, deleteIncome, updateInvoice } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleProjects, setVisibleProjects] = useState(PROJECTS_PER_PAGE);
  
  const [formData, setFormData] = useState({
    projectId: projects[0]?.id || '', 
    amount: '', 
    description: '', 
    date: new Date().toISOString().split('T')[0], 
    method: 'Bank' as PaymentMethod,
    invoiceId: ''
  });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowModal(false);
        setEditingIncome(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  const getInvoiceMetrics = useCallback((inv: Invoice) => {
    const collected = incomes
      .filter(i => i.invoiceId === inv.id && (editingIncome ? i.id !== editingIncome.id : true))
      .reduce((sum, i) => sum + i.amount, 0);
    const remaining = Math.max(0, inv.amount - collected);
    return { collected, remaining };
  }, [incomes, editingIncome]);

  const handleCreateOrUpdateIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(formData.amount) || 0;

    if (formData.invoiceId) {
      const inv = invoices.find(v => v.id === formData.invoiceId);
      if (inv) {
        const { remaining } = getInvoiceMetrics(inv);
        const limit = remaining + (editingIncome?.amount || 0);
        if (amountNum > limit + 0.01) {
          alert(`Validation Error: Collection amount exceeds invoice balance.`);
          return;
        }
      }
    } else {
        alert("Action Required: Link to an invoice.");
        return;
    }

    const incData: Income = {
      id: editingIncome ? editingIncome.id : 'inc' + Date.now(),
      projectId: formData.projectId,
      amount: amountNum,
      description: formData.description,
      date: formData.date,
      method: formData.method,
      invoiceId: formData.invoiceId
    };

    if (editingIncome) await updateIncome(incData);
    else await addIncome(incData);

    setShowModal(false);
    setEditingIncome(null);
  };

  const projectIncomesGrouped = useMemo(() => {
    const grouped: Record<string, { project: Project; items: Income[]; total: number }> = {};
    
    incomes.forEach(inc => {
      const project = projects.find(p => p.id === inc.projectId);
      if (!project) return;
      
      const matchesSearch = 
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        inc.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (!matchesSearch && searchTerm) return;

      if (!grouped[inc.projectId]) {
        grouped[inc.projectId] = { project, items: [], total: 0 };
      }
      grouped[inc.projectId].items.push(inc);
      grouped[inc.projectId].total += inc.amount;
    });

    return Object.values(grouped).sort((a, b) => b.total - a.total);
  }, [projects, incomes, searchTerm]);

  const pagedGroups = useMemo(() => projectIncomesGrouped.slice(0, visibleProjects), [projectIncomesGrouped, visibleProjects]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight uppercase">Revenue Ledger</h2><p className="text-slate-500 dark:text-slate-400 text-sm">Track {incomes.length.toLocaleString()} project receipts.</p></div>
        <button onClick={() => { setEditingIncome(null); setShowModal(true); }} className="bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg"><Plus size={20} /> Record Collection</button>
      </div>

      <div className="relative"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" placeholder="Deep Search Revenue..." className="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold outline-none" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setVisibleProjects(PROJECTS_PER_PAGE); }} /></div>

      <div className="space-y-8">
        {pagedGroups.map((group) => (
          <div key={group.project.id} className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in duration-300">
            <div className="p-6 bg-slate-50/50 dark:bg-slate-900/30 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-900 dark:text-white"><Briefcase size={16} className="text-blue-500" /> {group.project.name}</h3>
              <p className="text-emerald-600 font-black text-sm">Total: {formatCurrency(group.total)}</p>
            </div>
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left min-w-[800px]">
                <thead className="bg-white dark:bg-slate-800 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 dark:border-slate-700">
                  <tr><th className="px-8 py-4">Date</th><th className="px-8 py-4">Milestone</th><th className="px-8 py-4">Method</th><th className="px-8 py-4 text-right">Amount</th><th className="px-8 py-4 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                  {group.items.slice(0, 10).map((inc) => (
                    <tr key={inc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                      <td className="px-8 py-5 text-[11px] font-bold text-slate-500">{new Date(inc.date).toLocaleDateString()}</td>
                      <td className="px-8 py-5">
                         <p className="text-[13px] font-black text-slate-800 dark:text-slate-100 uppercase leading-none">{inc.description}</p>
                         <span className="text-[8px] font-black text-indigo-500 uppercase flex items-center gap-1 mt-1"><Receipt size={10} /> Link: #{inc.invoiceId?.slice(-6).toUpperCase() || 'MANUAL'}</span>
                      </td>
                      <td className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase">{inc.method}</td>
                      <td className="px-8 py-5 text-right font-black text-emerald-600 text-sm">{formatCurrency(inc.amount)}</td>
                      <td className="px-8 py-5 text-right">
                         <div className="flex justify-end gap-1">
                            <button onClick={() => { setEditingIncome(inc); setFormData({ projectId: inc.projectId, amount: inc.amount.toString(), description: inc.description, date: inc.date, method: inc.method, invoiceId: inc.invoiceId || '' }); setShowModal(true); }} className="p-2 text-slate-400 hover:text-blue-600"><Pencil size={18} /></button>
                            <button onClick={() => deleteIncome(inc.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 size={18} /></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                  {group.items.length > 10 && (
                    <tr>
                      <td colSpan={5} className="px-8 py-3 text-center text-[10px] font-bold text-slate-400 uppercase bg-slate-50/20">
                        + {group.items.length - 10} more receipts in this project
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}

        {visibleProjects < projectIncomesGrouped.length && (
          <div className="py-8 text-center">
             <button 
              onClick={() => setVisibleProjects(p => p + PROJECTS_PER_PAGE)}
              className="px-10 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 transition-all"
             >
               Load More Project Ledgers ({projectIncomesGrouped.length - visibleProjects} groups remaining)
             </button>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden">
            <div className="p-8 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-emerald-50/30">
              <div className="flex items-center gap-3">
                 <div className="p-3 bg-emerald-600 text-white rounded-2xl"><ArrowUpCircle size={24} /></div>
                 <h2 className="text-xl font-black uppercase">Authorize Collection</h2>
              </div>
              <button onClick={() => { setShowModal(false); setEditingIncome(null); }} className="p-2 text-slate-400"><X size={32} /></button>
            </div>
            <form onSubmit={handleCreateOrUpdateIncome} className="p-8 space-y-5">
              <div className="space-y-1">
                 <label className="text-[10px] font-black uppercase text-slate-400">Project Site</label>
                 <select className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={formData.projectId} onChange={e => setFormData(p => ({ ...p, projectId: e.target.value, invoiceId: '' }))} required>
                   <option value="">Select site...</option>
                   {projects.filter(p => !p.isGodown).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                 </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400">Target Invoice</label>
                <select required className="w-full px-5 py-4 bg-indigo-50/50 dark:bg-indigo-900/10 border-2 border-indigo-100 rounded-2xl font-bold dark:text-white outline-none appearance-none" value={formData.invoiceId} onChange={e => setFormData(p => ({ ...p, invoiceId: e.target.value }))}>
                  <option value="">Choose invoice...</option>
                  {invoices.filter(inv => inv.projectId === formData.projectId).map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.description} | #{inv.id.slice(-6).toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-400">Amount (Rs.)</label>
                  <input type="number" step="0.01" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-black text-lg dark:text-white outline-none" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} required />
                </div>
                <div className="space-y-1">
                   <label className="text-[10px] font-black uppercase text-slate-400">Date</label>
                   <input type="date" className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-2xl font-bold dark:text-white outline-none" value={formData.date} onChange={e => setFormData(p => ({ ...p, date: e.target.value }))} required />
                </div>
              </div>
              <button type="submit" className="w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black uppercase shadow-xl active:scale-95 transition-all">Record Collection</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};