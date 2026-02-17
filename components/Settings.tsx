import React, { useState } from 'react';
import { 
  User, 
  Building2, 
  Globe, 
  Bell, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Mail, 
  Smartphone,
  CreditCard,
  Cloud,
  ChevronRight,
  LogOut,
  Zap,
  Plus,
  X,
  List,
  Package,
  Layers,
  Activity,
  Database,
  Code2,
  Terminal,
  LayoutGrid,
  Scale,
  Copy
} from 'lucide-react';
import { useApp } from '../AppContext';

export const Settings: React.FC = () => {
  const { 
    currentUser, updateUser, syncId, theme, setTheme, 
    tradeCategories, addTradeCategory, removeTradeCategory,
    stockingUnits, addStockingUnit, removeStockingUnit,
    siteStatuses, addSiteStatus, removeSiteStatus,
    allowDecimalStock, setAllowDecimalStock
  } = useApp();
  
  const [activeSection, setActiveSection] = useState<'profile' | 'company' | 'system' | 'master-lists' | 'database'>('profile');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Settings & Configuration</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage your professional profile and application environment.</p>
        </div>
        <div className="hidden sm:block">
          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
            Version 2.5.0-Stable
          </span>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-1">
          <button onClick={() => setActiveSection('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'profile' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <User size={18} /> <span className="text-sm font-bold">Personal Profile</span>
          </button>
          <button onClick={() => setActiveSection('company')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'company' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <Building2 size={18} /> <span className="text-sm font-bold">Company Info</span>
          </button>
          <button onClick={() => setActiveSection('master-lists')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'master-lists' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <List size={18} /> <span className="text-sm font-bold">Master Lists</span>
          </button>
          <button onClick={() => setActiveSection('database')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'database' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <Database size={18} /> <span className="text-sm font-bold">Database Connection</span>
          </button>
          <button onClick={() => setActiveSection('system')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeSection === 'system' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm'}`}>
            <Globe size={18} /> <span className="text-sm font-bold">System Defaults</span>
          </button>
          
          <div className="pt-8 space-y-1">
             <div className="px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Support</div>
             <button className="w-full flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all">
               <LogOut size={18} /> <span className="text-sm font-bold">Sign Out</span>
             </button>
          </div>
        </aside>

        <div className="flex-1">
          <div className="bg-white dark:bg-slate-800 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4">
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
                    <ol className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400 list-decimal list-inside">
                      <li>Initialize a hosted SQL environment (e.g., AWS RDS, Vercel Postgres, or DigitalOcean).</li>
                      <li>Execute the SQL script provided below to establish schema, indexing, and foreign keys.</li>
                      <li>Deploy a Backend Bridge (Node.js/Express) using drivers like <code>mysql2</code> or <code>pg</code>.</li>
                      <li>Update the <code>API_BASE_URL</code> in your configuration to point to your live backend.</li>
                    </ol>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Required Database Schema (SQL)</label>
                  <pre className="w-full p-4 bg-slate-900 text-blue-400 rounded-2xl text-[10px] font-mono overflow-x-auto border border-slate-700">
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
                {/* Global Quantity Settings */}
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
                   <p className="text-xs text-slate-600 dark:text-slate-400 italic">
                      When enabled, inventory items can be recorded with decimal places (e.g., 1.5 Tons). If disabled, inputs are restricted to whole numbers.
                   </p>
                </div>

                {/* Trade Categories */}
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
                      onKeyPress={e => e.key === 'Enter' && newTradeCat && (addTradeCategory(newTradeCat), setNewTradeCat(''))}
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

                {/* Stocking Units */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                    <Package size={18} className="text-emerald-500" /> Stocking Units
                  </h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="New unit (e.g. Bag, Ton)..." 
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none dark:text-white"
                      value={newStockUnit}
                      onChange={e => setNewStockUnit(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && newStockUnit && (addStockingUnit(newStockUnit), setNewStockUnit(''))}
                    />
                    <button onClick={() => { if(newStockUnit) { addStockingUnit(newStockUnit); setNewStockUnit(''); } }} className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"><Plus size={18} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                    {stockingUnits.map(unit => (
                      <span key={unit} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest dark:text-slate-300 shadow-sm">
                        {unit} <X size={10} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeStockingUnit(unit)} />
                      </span>
                    ))}
                  </div>
                </div>

                {/* Site Statuses */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2 text-sm uppercase tracking-widest">
                    <Activity size={18} className="text-amber-500" /> Project Statuses
                  </h3>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="New status..." 
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold outline-none dark:text-white"
                      value={newSiteStatus}
                      onChange={e => setNewSiteStatus(e.target.value)}
                      onKeyPress={e => e.key === 'Enter' && newSiteStatus && (addSiteStatus(newSiteStatus), setNewSiteStatus(''))}
                    />
                    <button onClick={() => { if(newSiteStatus) { addSiteStatus(newSiteStatus); setNewSiteStatus(''); } }} className="p-2 bg-amber-600 text-white rounded-xl hover:bg-amber-700"><Plus size={18} /></button>
                  </div>
                  <div className="flex flex-wrap gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-700">
                    {siteStatuses.map(status => (
                      <span key={status} className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest dark:text-slate-300 shadow-sm">
                        {status} <X size={10} className="cursor-pointer text-slate-400 hover:text-red-500" onClick={() => removeSiteStatus(status)} />
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
