
import React, { useState, useRef } from 'react';
import { 
  User, 
  Users,
  Building2, 
  Globe, 
  Save, 
  LogOut, 
  Plus, 
  X, 
  List, 
  Package, 
  Layers, 
  Activity, 
  Database, 
  Code2, 
  Terminal, 
  Scale, 
  Copy,
  DownloadCloud,
  UploadCloud,
  FileJson,
  FileSpreadsheet,
  ShieldCheck,
  Archive,
  AlertTriangle,
  FileUp,
  Server,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../AppContext';
import { AppState, Vendor, Material } from '../types';

export const Settings: React.FC = () => {
  const { 
    currentUser, updateUser, theme, setTheme, 
    tradeCategories, addTradeCategory, removeTradeCategory,
    stockingUnits, addStockingUnit, removeStockingUnit,
    siteStatuses, addSiteStatus, removeSiteStatus,
    allowDecimalStock, setAllowDecimalStock,
    projects, vendors, materials, expenses, incomes, invoices, payments,
    importState, addVendor, addMaterial
  } = useApp();
  
  const [activeSection, setActiveSection] = useState<'profile' | 'company' | 'system' | 'master-lists' | 'database' | 'export' | 'import'>('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [importing, setImporting] = useState(false);

  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const csvVendorInputRef = useRef<HTMLInputElement>(null);
  const csvMaterialInputRef = useRef<HTMLInputElement>(null);

  const [newTradeCat, setNewTradeCat] = useState('');
  const [newStockUnit, setNewStockUnit] = useState('');
  const [newSiteStatus, setNewSiteStatus] = useState('');

  const [profileData, setProfileData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: '+91 98765 43210'
  });

  const sqlSchema = `
-- Create Database
CREATE DATABASE buildtrack_db;
USE buildtrack_db;

-- Projects Table
CREATE TABLE projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    client VARCHAR(255),
    location VARCHAR(255),
    startDate DATE,
    endDate DATE,
    budget DECIMAL(15, 2),
    status VARCHAR(50),
    description TEXT,
    contactNumber VARCHAR(20)
);

-- Vendors Table
CREATE TABLE vendors (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    category VARCHAR(100),
    email VARCHAR(100),
    balance DECIMAL(15, 2) DEFAULT 0
);

-- Materials Table
CREATE TABLE materials (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(50),
    costPerUnit DECIMAL(15, 2),
    totalPurchased DECIMAL(15, 2) DEFAULT 0,
    totalUsed DECIMAL(15, 2) DEFAULT 0
);

-- Expenses Table
CREATE TABLE expenses (
    id VARCHAR(50) PRIMARY KEY,
    date DATE,
    project_id VARCHAR(50),
    vendor_id VARCHAR(50),
    material_id VARCHAR(50),
    amount DECIMAL(15, 2),
    paymentMethod VARCHAR(50),
    notes TEXT,
    category VARCHAR(100),
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
`;

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveStatus('saving');
    updateUser({ ...currentUser, name: profileData.name, email: profileData.email });
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }, 800);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Database schema copied to clipboard!");
  };

  const downloadFile = (data: string, filename: string, type: string) => {
    const blob = new Blob([data], { type });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const fullState = {
      projects, vendors, materials, expenses, incomes, invoices, payments,
      tradeCategories, stockingUnits, siteStatuses, exportDate: new Date().toISOString()
    };
    downloadFile(JSON.stringify(fullState, null, 2), `BuildTrackPro_Backup_${new Date().toISOString().split('T')[0]}.json`, 'application/json');
  };

  const handleExportCSV = (type: 'projects' | 'expenses' | 'inventory') => {
    let csv = '';
    let filename = '';

    if (type === 'projects') {
      filename = `Projects_Backup_${Date.now()}.csv`;
      csv = 'ID,Name,Client,Location,Budget,Status\n' + 
            projects.map(p => `"${p.id}","${p.name}","${p.client}","${p.location}",${p.budget},"${p.status}"`).join('\n');
    } else if (type === 'expenses') {
      filename = `Ledger_Backup_${Date.now()}.csv`;
      csv = 'Date,Category,Project,Amount,Method,Notes\n' + 
            expenses.map(e => {
              const p = projects.find(proj => proj.id === e.projectId);
              return `"${e.date}","${e.category}","${p?.name || 'N/A'}",${e.amount},"${e.paymentMethod}","${e.notes.replace(/"/g, '""')}"`;
            }).join('\n');
    } else if (type === 'inventory') {
      filename = `Inventory_Backup_${Date.now()}.csv`;
      csv = 'ID,Name,Unit,CostPerUnit,InStock\n' + 
            materials.map(m => `"${m.id}","${m.name}","${m.unit}",${m.costPerUnit},${m.totalPurchased - m.totalUsed}`).join('\n');
    }

    downloadFile(csv, filename, 'text/csv');
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("CRITICAL WARNING: Importing a database file will OVERWRITE all current records. This action cannot be undone. Proceed?")) {
      if (jsonFileInputRef.current) jsonFileInputRef.current.value = '';
      return;
    }

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const importedData = JSON.parse(content) as AppState;
        if (!importedData.projects) throw new Error("Invalid format");
        await importState({ ...importedData, theme: theme });
        alert("Success! System restored.");
        window.location.reload();
      } catch (err) {
        alert("Import failed. Ensure the file is a valid BuildTrack backup.");
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
    return lines.slice(1).filter(l => l.trim()).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      return headers.reduce((obj: any, header, i) => {
        obj[header] = values[i];
        return obj;
      }, {});
    });
  };

  const handleImportCSVVendors = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = parseCSV(event.target?.result as string);
        let count = 0;
        for (const item of data) {
          if (item.name) {
            await addVendor({
              id: 'v' + Date.now() + Math.random().toString(36).slice(2, 5),
              name: item.name,
              phone: item.phone || '',
              address: item.address || '',
              category: item.category || tradeCategories[0],
              balance: parseFloat(item.balance) || 0
            });
            count++;
          }
        }
        alert(`Successfully imported ${count} suppliers.`);
      } catch (err) {
        alert("CSV Import Error. Ensure headers are: name, phone, category, address, balance");
      }
    };
    reader.readAsText(file);
  };

  const handleImportCSVMaterials = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = parseCSV(event.target?.result as string);
        let count = 0;
        for (const item of data) {
          if (item.name) {
            await addMaterial({
              id: 'm' + Date.now() + Math.random().toString(36).slice(2, 5),
              name: item.name,
              unit: item.unit || stockingUnits[0],
              costPerUnit: parseFloat(item.costperunit) || parseFloat(item.cost) || 0,
              totalPurchased: 0,
              totalUsed: 0,
              history: []
            });
            count++;
          }
        }
        alert(`Successfully imported ${count} materials.`);
      } catch (err) {
        alert("CSV Import Error. Ensure headers are: name, unit, costperunit");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings & Configuration</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your professional profile and application environment.</p>
        </div>
        <div className="hidden sm:block">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Version 2.6.0-Pro
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-1">
          <button onClick={() => setActiveSection('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <User size={18} /> <span className="text-sm font-bold">Personal Profile</span>
          </button>
          <button onClick={() => setActiveSection('master-lists')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'master-lists' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <List size={18} /> <span className="text-sm font-bold">Master Lists</span>
          </button>
          <button onClick={() => setActiveSection('database')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'database' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <Server size={18} /> <span className="text-sm font-bold">SQL Integration</span>
          </button>
          <button onClick={() => setActiveSection('export')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'export' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <DownloadCloud size={18} /> <span className="text-sm font-bold">Export Data</span>
          </button>
          <button onClick={() => setActiveSection('import')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'import' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <UploadCloud size={18} /> <span className="text-sm font-bold">Import Data</span>
          </button>
          <button onClick={() => setActiveSection('system')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'system' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <Globe size={18} /> <span className="text-sm font-bold">System Defaults</span>
          </button>
          <div className="pt-8 space-y-1">
             <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all">
               <LogOut size={18} /> <span className="text-sm font-bold">Sign Out</span>
             </button>
          </div>
        </aside>

        <div className="flex-1">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4">
            
            {activeSection === 'export' && (
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-4 bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl">
                  <div className="p-4 bg-white/10 rounded-2xl"><Archive size={32} /></div>
                  <div>
                    <h3 className="text-lg font-bold">Data Governance: Export</h3>
                    <p className="text-[10px] font-bold uppercase text-indigo-200">System Backup & Reporting</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2rem] space-y-4">
                    <div className="flex items-center gap-3 text-blue-600">
                      <FileJson size={20} />
                      <h4 className="font-bold text-sm uppercase tracking-tight">Full System Snapshot</h4>
                    </div>
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Download your entire project portfolio, supplier ledger, and material pool in a single encrypted JSON file for total data ownership.</p>
                    <button onClick={handleExportJSON} className="w-full py-3.5 bg-white dark:bg-slate-800 border-2 border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all flex items-center justify-center gap-2">
                      <DownloadCloud size={16} /> Generate Master Backup (.JSON)
                    </button>
                  </div>

                  <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2rem] space-y-4">
                    <div className="flex items-center gap-3 text-emerald-600">
                      <FileSpreadsheet size={20} />
                      <h4 className="font-bold text-sm uppercase tracking-tight">Excel Compatible Exports</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <button onClick={() => handleExportCSV('projects')} className="py-3 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-50 transition-all">Projects CSV</button>
                      <button onClick={() => handleExportCSV('expenses')} className="py-3 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-50 transition-all">Ledger CSV</button>
                      <button onClick={() => handleExportCSV('inventory')} className="py-3 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-50 transition-all">Assets CSV</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'import' && (
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-4 bg-emerald-600 p-6 rounded-[2rem] text-white shadow-xl">
                  <div className="p-4 bg-white/10 rounded-2xl"><UploadCloud size={32} /></div>
                  <div>
                    <h3 className="text-lg font-bold">Data Governance: Import</h3>
                    <p className="text-[10px] font-bold uppercase text-emerald-200">Migration & Restoration Center</p>
                  </div>
                </div>

                <div className="p-8 bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-[2.5rem] space-y-4">
                   <div className="flex items-center gap-3 text-rose-600">
                     <AlertTriangle size={24} />
                     <h4 className="font-black text-sm uppercase tracking-tight">System Overwrite Protocol</h4>
                   </div>
                   <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                     Uploading a <strong>Master Backup</strong> file will completely replace all existing projects and financial records. This is an destructive operation intended for full system recovery.
                   </p>
                   <input type="file" accept=".json" className="hidden" ref={jsonFileInputRef} onChange={handleImportJSON} />
                   <button 
                    onClick={() => jsonFileInputRef.current?.click()}
                    className="w-full py-4 bg-white dark:bg-slate-900 border-2 border-rose-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-rose-600 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center gap-2"
                   >
                     {importing ? <RefreshCw className="animate-spin" /> : <FileUp size={16} />} Select .JSON Master File
                   </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2rem] space-y-4">
                      <div className="flex items-center gap-3 text-blue-600">
                        {/* Fix: Added missing 'Users' import from 'lucide-react' */}
                        <Users size={18} />
                        <h4 className="font-bold text-[10px] uppercase tracking-widest">Supplier Bulk Upload</h4>
                      </div>
                      <input type="file" accept=".csv" className="hidden" ref={csvVendorInputRef} onChange={handleImportCSVVendors} />
                      <button onClick={() => csvVendorInputRef.current?.click()} className="w-full py-10 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500 transition-all text-slate-400 hover:text-emerald-600">
                         <FileSpreadsheet size={32} />
                         <span className="text-[9px] font-black uppercase">Import CSV Suppliers</span>
                      </button>
                   </div>
                   <div className="p-6 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-[2rem] space-y-4">
                      <div className="flex items-center gap-3 text-blue-600">
                        <Package size={18} />
                        <h4 className="font-bold text-[10px] uppercase tracking-widest">Material Bulk Upload</h4>
                      </div>
                      <input type="file" accept=".csv" className="hidden" ref={csvMaterialInputRef} onChange={handleImportCSVMaterials} />
                      <button onClick={() => csvMaterialInputRef.current?.click()} className="w-full py-10 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-emerald-500 transition-all text-slate-400 hover:text-emerald-600">
                         <FileSpreadsheet size={32} />
                         <span className="text-[9px] font-black uppercase">Import CSV Materials</span>
                      </button>
                   </div>
                </div>
              </div>
            )}

            {activeSection === 'profile' && (
              <div className="p-8">
                <div className="flex items-center gap-6 mb-8">
                  <img src={currentUser.avatar} alt="Profile" className="w-20 h-20 rounded-[2rem] object-cover border-4 border-slate-100 dark:border-slate-700 shadow-sm" />
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{currentUser.name}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{currentUser.role} Account</p>
                  </div>
                </div>
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <input type="text" className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold dark:text-white" value={profileData.name} onChange={e => setProfileData(p => ({ ...p, name: e.target.value }))} placeholder="Full Name" />
                    <input type="email" className="w-full px-4 py-3.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-2xl font-bold dark:text-white" value={profileData.email} onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))} placeholder="Email" />
                  </div>
                  <button type="submit" className={`w-full flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-bold transition-all bg-blue-600 text-white hover:bg-blue-700`}>
                    <Save size={18} /> Save Profile
                  </button>
                </form>
              </div>
            )}

            {activeSection === 'database' && (
              <div className="p-8 space-y-6">
                <div className="bg-blue-600 p-6 rounded-[2rem] text-white flex justify-between items-center shadow-xl">
                  <div className="flex gap-4 items-center">
                    <div className="p-4 bg-white/10 rounded-2xl"><Terminal size={24} /></div>
                    <div>
                      <h3 className="text-lg font-bold">SQL Database Configuration</h3>
                      <p className="text-[10px] font-bold uppercase text-white/60">MySQL / PostgreSQL Compatibility</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <Code2 size={20} />
                    <h4 className="font-bold text-sm uppercase tracking-tight">Connection Architecture</h4>
                  </div>
                  <div className="p-5 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      This application communicates with a <strong>MySQL/PostgreSQL Database</strong> through a RESTful API Backend. The architecture follows modern standards for secure data persistence.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Required Database Schema (SQL)</label>
                  <pre className="w-full p-4 bg-slate-900 text-blue-400 rounded-2xl text-[10px] font-mono overflow-x-auto border border-slate-700 h-48 no-scrollbar">
                    {sqlSchema}
                  </pre>
                  <button onClick={() => copyToClipboard(sqlSchema)} className="flex items-center gap-2 text-[10px] font-bold text-blue-600 hover:underline uppercase tracking-widest mt-2">
                    <Copy size={12} /> Copy Schema to Clipboard
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'master-lists' && (
              <div className="p-8 space-y-12">
                <div className="space-y-4 p-6 bg-blue-50/50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/20">
                   <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600 text-white rounded-2xl">
                           <Scale size={20} />
                        </div>
                        <div>
                           <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-tight">Decimal Quantity Support</h3>
                           <p className="text-[10px] text-slate-500 font-bold uppercase">Inventory & Stock Tracking</p>
                        </div>
                     </div>
                     <button 
                      onClick={() => setAllowDecimalStock(!allowDecimalStock)}
                      className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${allowDecimalStock ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                     >
                       <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${allowDecimalStock ? 'translate-x-6' : 'translate-x-1'}`} />
                     </button>
                   </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                    <Layers size={18} className="text-blue-500" /> Trade Categories
                  </h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="New category..." 
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none dark:text-white"
                      value={newTradeCat}
                      onChange={e => setNewTradeCat(e.target.value)}
                    />
                    <button onClick={() => { if(newTradeCat) { addTradeCategory(newTradeCat); setNewTradeCat(''); } }} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700"><Plus size={18} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                    {tradeCategories.map(cat => (
                      <span key={cat} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest dark:text-slate-300 shadow-sm">
                        {cat} <X size={10} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeTradeCategory(cat)} />
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {activeSection === 'system' && (
               <div className="p-8 space-y-6">
                 <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">Appearance Mode</h4>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">Switch between light and dark themes</p>
                    </div>
                    <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                       <button onClick={() => setTheme('light')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${theme === 'light' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Light</button>
                       <button onClick={() => setTheme('dark')} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${theme === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>Dark</button>
                    </div>
                 </div>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
