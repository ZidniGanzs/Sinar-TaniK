import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  GraduationCap, 
  Calculator, 
  HandHelping, 
  User as UserIcon, 
  LogOut, 
  Menu, 
  X,
  Plus,
  MapPin,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Calendar,
  Wallet,
  ArrowRight,
  Phone,
  Camera,
  Info,
  Search,
  Clock,
  Trash2,
  Home as HomeIcon,
  Check,
  Download,
  Bell,
  Sparkles,
  Loader2,
  ClipboardList,
  Filter,
  Navigation,
  Activity,
  BookOpen,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { io } from 'socket.io-client';
import { GoogleGenAI, Type } from "@google/genai";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend as RechartsLegend 
} from 'recharts';
import { User, Report, Product, Farm, BantuanProposal, Notification, Task } from './types';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import 'leaflet/dist/leaflet.css';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg glass rounded-3xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-all">
              <X size={20} className="text-slate-500" />
            </button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[80vh]">
            {children}
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const Toast = ({ notification, onClose }: { notification: Notification, onClose: () => void }) => (
  <motion.div
    initial={{ opacity: 0, x: 100, scale: 0.9 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 100, scale: 0.9 }}
    className={cn(
      "fixed top-6 right-6 z-[200] w-80 p-4 rounded-2xl shadow-2xl border flex gap-3 backdrop-blur-xl",
      notification.type === 'danger' ? "bg-red-500/90 border-red-400 text-white" :
      notification.type === 'success' ? "bg-emerald-500/90 border-emerald-400 text-white" :
      notification.type === 'warning' ? "bg-amber-500/90 border-amber-400 text-white" :
      "bg-blue-500/90 border-blue-400 text-white"
    )}
  >
    <div className="flex-1">
      <h4 className="font-black text-sm uppercase tracking-tight">{notification.title}</h4>
      <p className="text-xs font-medium mt-1 opacity-90">{notification.message}</p>
    </div>
    <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-all self-start">
      <X size={16} />
    </button>
  </motion.div>
);

const NotificationBell = ({ 
  notifications, 
  setNotifications, 
  showNotifications, 
  setShowNotifications,
  dark = false
}: { 
  notifications: Notification[], 
  setNotifications: (notifs: Notification[]) => void,
  showNotifications: boolean,
  setShowNotifications: (show: boolean) => void,
  dark?: boolean
}) => (
  <div className="relative">
    <button 
      onClick={() => setShowNotifications(!showNotifications)}
      className={cn(
        "p-2 rounded-xl transition-all relative",
        dark ? "text-white hover:bg-white/10" : "text-slate-500 hover:bg-slate-100"
      )}
    >
      <Bell size={24} />
      {notifications.filter(n => !n.read).length > 0 && (
        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white">
          {notifications.filter(n => !n.read).length}
        </span>
      )}
    </button>

    <AnimatePresence>
      {showNotifications && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowNotifications(false)}
            className="fixed inset-0 z-40"
          />
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 glass rounded-3xl shadow-2xl z-50 overflow-hidden border border-white/40"
          >
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white/50">
              <h3 className="font-black text-xs uppercase tracking-widest text-slate-500">Notifikasi</h3>
              <button 
                onClick={() => setNotifications(notifications.map(n => ({...n, read: true})))}
                className="text-[10px] font-bold text-emerald-600 hover:underline"
              >
                Tandai semua dibaca
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto scrollbar-hide">
              {notifications.length === 0 ? (
                <div className="p-10 text-center">
                  <Bell size={32} className="mx-auto text-slate-200 mb-2" />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Belum ada notifikasi</p>
                </div>
              ) : (
                notifications.map(notif => (
                  <div 
                    key={notif.id}
                    className={cn(
                      "p-4 border-b border-slate-50 hover:bg-slate-50 transition-all cursor-pointer relative",
                      !notif.read && "bg-emerald-50/30"
                    )}
                    onClick={() => {
                      setNotifications(notifications.map(n => n.id === notif.id ? {...n, read: true} : n));
                    }}
                  >
                    {!notif.read && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-500 rounded-full" />}
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                        notif.type === 'danger' ? "bg-red-100 text-red-600" :
                        notif.type === 'success' ? "bg-emerald-100 text-emerald-600" :
                        notif.type === 'warning' ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                      )}>
                        {notif.type === 'danger' ? <AlertTriangle size={16} /> : <Info size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-900">{notif.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{notif.message}</p>
                        <p className="text-[9px] text-slate-400 mt-1 font-bold uppercase tracking-tighter">
                          {new Date(notif.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  </div>
);

const SidebarItem = ({ 
  icon: Icon, 
  label, 
  active, 
  onClick 
}: { 
  icon: any, 
  label: string, 
  active: boolean, 
  onClick: () => void 
}) => (
  <button
    onClick={onClick}
    className={cn(
      "flex items-center gap-3 w-full px-4 py-3 rounded-2xl transition-all duration-300 group relative overflow-hidden",
      active 
        ? "glass-emerald text-white shadow-emerald-500/20" 
        : "text-slate-600 hover:bg-white/40 hover:text-emerald-600"
    )}
  >
    <Icon size={20} className={cn("relative z-10", active ? "text-white" : "text-slate-400 group-hover:text-emerald-600")} />
    <span className="font-bold relative z-10">{label}</span>
    {active && (
      <motion.div 
        layoutId="active-pill"
        className="absolute inset-0 bg-emerald-600/10"
        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
      />
    )}
  </button>
);

const Card = ({ children, className }: { children: React.ReactNode, className?: string, key?: any }) => (
  <div className={cn("glass rounded-2xl overflow-hidden", className)}>
    {children}
  </div>
);

const exportToCSV = (data: any[], filename: string) => {
  if (data.length === 0) return;
  // Get all unique keys from all objects in the array
  const allKeys = Array.from(new Set(data.flatMap(obj => Object.keys(obj))));
  const headers = allKeys.join(',');
  const rows = data.map(obj => 
    allKeys.map(key => {
      const val = obj[key] === null || obj[key] === undefined ? '' : obj[key];
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csvContent = [headers, ...rows].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auth States
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '', fullname: '', role: 'petani' });
  const [authError, setAuthError] = useState('');

  // Data States
  const [reports, setReports] = useState<Report[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [farms, setFarms] = useState<Farm[]>([]);
  const [proposals, setProposals] = useState<BantuanProposal[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeToast, setActiveToast] = useState<Notification | null>(null);
  const [showNotifications, setShowNotifications] = useState(false);

  const exportToCSV = (data: any[], filename: string) => {
    if (!data || !data.length) return;
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => {
        const val = row[header];
        return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
      }).join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const socket = io();

    socket.on('notification', (notif: any) => {
      // Filter if it's for a specific user
      if (notif.target_user_id && user && notif.target_user_id !== user.id) {
        return;
      }

      setNotifications(prev => [notif, ...prev]);
      setActiveToast(notif);
      
      // Auto-hide toast
      setTimeout(() => {
        setActiveToast(current => current?.id === notif.id ? null : current);
      }, 5000);
    });

    socket.on('data_updated', (update: any) => {
      console.log('Data update received:', update);
      if (update.type === 'reports') {
        fetchReports();
      } else if (update.type === 'bantuan') {
        // Only refresh if it's for this user or user is admin/petugas
        if (user && (user.role === 'admin' || user.role === 'petugas' || update.user_id === user.id)) {
          fetchProposals();
        }
      } else if (update.type === 'products') {
        fetchProducts();
      } else if (update.type === 'farms') {
        if (user && update.user_id === user.id) {
          fetchFarms();
        }
      } else if (update.type === 'tasks') {
        if (user && (user.role === 'admin' || user.role === 'petugas' || update.officer_id === user.id)) {
          fetchTasks();
        }
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    if (user) {
      fetchReports();
      fetchProducts();
      fetchFarms();
      fetchProposals();
      fetchTasks();
    }
  }, [user]);

  const fetchReports = async () => {
    try {
      const res = await fetch('/api/reports');
      const data = await res.json();
      setReports(data);
    } catch (err) {
      console.error("Fetch reports error:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Fetch products error:", err);
    }
  };

  const fetchFarms = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/farms/${user.id}`);
      const data = await res.json();
      setFarms(data);
    } catch (err) {
      console.error("Fetch farms error:", err);
    }
  };

  const fetchProposals = async () => {
    if (!user) return;
    try {
      const res = await fetch(`/api/bantuan/${user.id}`);
      const data = await res.json();
      setProposals(data);
    } catch (err) {
      console.error("Fetch proposals error:", err);
    }
  };

  const fetchTasks = async () => {
    if (!user) return;
    try {
      const url = user.role === 'admin' ? '/api/tasks' : `/api/tasks/${user.id}`;
      const res = await fetch(url);
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      console.error("Fetch tasks error:", err);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setLoading(true);
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authForm)
      });
      const data = await res.json();
      if (res.ok) {
        if (isLogin) {
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } else {
          setIsLogin(true);
          setAuthError(data.message || 'Registrasi berhasil! Silakan login.');
        }
      } else {
        setAuthError(data.error);
      }
    } catch (err) {
      setAuthError('Koneksi gagal');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden font-sans">
        {/* Animated Background Elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px] animate-pulse delay-700" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="text-center mb-10">
            <motion.div 
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="inline-flex items-center justify-center w-24 h-24 rounded-[2.5rem] overflow-hidden mb-6 shadow-2xl shadow-emerald-500/20 bg-white/80 backdrop-blur-xl p-2 border border-white/50"
            >
              <img 
                src="/logo.svg" 
                alt="SINAR TANI Logo" 
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/initials/svg?seed=ST&backgroundColor=10b981";
                }}
              />
            </motion.div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">SINAR TANI</h1>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sistem Informasi Pertanian Terpadu</p>
          </div>

          <Card className="p-10 backdrop-blur-2xl bg-white/60 border-white/40 shadow-2xl">
            <h2 className="text-2xl font-black text-slate-800 mb-8 text-center uppercase tracking-tight">
              {isLogin ? 'Selamat Datang' : 'Buat Akun'}
            </h2>
            
            <form onSubmit={handleAuth} className="space-y-6">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
                    <input 
                      type="text" required
                      className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-white/60 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                      value={authForm.fullname}
                      onChange={e => setAuthForm({...authForm, fullname: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Daftar Sebagai</label>
                    <select 
                      className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-white/60 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                      value={authForm.role}
                      onChange={e => setAuthForm({...authForm, role: e.target.value})}
                    >
                      <option value="petani">Petani</option>
                      <option value="petugas">Petugas Lapangan</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                </>
              )}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Username</label>
                <input 
                  type="text" required
                  className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-white/60 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                  value={authForm.username}
                  onChange={e => setAuthForm({...authForm, username: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <input 
                  type="password" required
                  className="w-full px-6 py-4 rounded-2xl bg-white/50 border border-white/60 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
                  value={authForm.password}
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                />
              </div>
              
              {authError && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "text-[10px] font-black uppercase tracking-wider text-center py-3 rounded-xl border",
                    authError.includes('berhasil') 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
                      : "bg-red-50 text-red-500 border-red-100"
                  )}
                >
                  {authError}
                </motion.p>
              )}
              
              <button 
                disabled={loading}
                className="w-full glass-emerald text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4 disabled:opacity-50"
              >
                {loading ? 'Memproses...' : (isLogin ? 'Masuk Sekarang' : 'Daftar Sekarang')}
              </button>
            </form>

            <div className="mt-8 text-center">
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors"
              >
                {isLogin ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
              </button>
            </div>
            
            <p className="mt-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Kabupaten Kebumen &copy; 2026
            </p>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-x-hidden">
      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 glass border-none m-4 rounded-3xl transition-transform duration-300 lg:translate-x-0 lg:static lg:m-6 lg:mr-0",
        !isSidebarOpen && "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-between mb-10 px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm p-1.5 border border-slate-100">
                <img 
                  src="/logo.svg" 
                  alt="Logo" 
                  className="w-full h-full object-contain" 
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/initials/svg?seed=ST&backgroundColor=10b981";
                  }}
                />
              </div>
              <span className="text-lg font-extrabold text-slate-900 tracking-tighter">SINAR TANI</span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="lg:hidden p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            <SidebarItem 
              icon={HomeIcon} 
              label="Beranda" 
              active={activeTab === 'home'} 
              onClick={() => { setActiveTab('home'); setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={LayoutDashboard} 
              label="Radar Hama" 
              active={activeTab === 'dashboard'} 
              onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={ShoppingBag} 
              label="Pasar Tani" 
              active={activeTab === 'pasar'} 
              onClick={() => { setActiveTab('pasar'); setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={GraduationCap} 
              label="Kelas Tani" 
              active={activeTab === 'edukasi'} 
              onClick={() => { setActiveTab('edukasi'); setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={Calculator} 
              label="Kalkulator" 
              active={activeTab === 'kalkulator'} 
              onClick={() => { setActiveTab('kalkulator'); setIsSidebarOpen(false); }} 
            />
            <SidebarItem 
              icon={HandHelping} 
              label="Bantuan" 
              active={activeTab === 'bantuan'} 
              onClick={() => { setActiveTab('bantuan'); setIsSidebarOpen(false); }} 
            />
            {(user.role === 'petugas' || user.role === 'admin') && (
              <>
                <SidebarItem 
                  icon={ClipboardList} 
                  label="Tugas" 
                  active={activeTab === 'tugas'} 
                  onClick={() => { setActiveTab('tugas'); setIsSidebarOpen(false); }} 
                />
                {user.role === 'admin' && (
                  <SidebarItem 
                    icon={ShieldCheck} 
                    label="Admin Panel" 
                    active={activeTab === 'admin'} 
                    onClick={() => { setActiveTab('admin'); setIsSidebarOpen(false); }} 
                  />
                )}
              </>
            )}
            <SidebarItem 
              icon={UserIcon} 
              label="Profil" 
              active={activeTab === 'profil'} 
              onClick={() => { setActiveTab('profil'); setIsSidebarOpen(false); }} 
            />
          </nav>

          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="flex items-center gap-3 mb-6 px-2">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold">
                {user.fullname[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{user.fullname}</p>
                <p className="text-xs text-slate-500 truncate">@{user.username}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-all font-medium"
            >
              <LogOut size={20} />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-auto">
        {activeTab !== 'home' && (
          <header className="glass border-none h-20 flex items-center justify-between px-8 sticky top-6 z-40 mx-6 rounded-3xl shadow-2xl">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="lg:hidden text-slate-500 p-2 hover:bg-slate-100 rounded-lg transition-all">
                <Menu size={24} />
              </button>
              <div className="lg:hidden flex items-center gap-2">
                <img 
                  src="/logo.svg" 
                  alt="Logo" 
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "https://api.dicebear.com/7.x/initials/svg?seed=ST&backgroundColor=10b981";
                  }}
                />
                <span className="font-extrabold text-slate-900 tracking-tighter">SINAR TANI</span>
              </div>
              <h2 className="hidden lg:block text-lg font-bold text-slate-800 capitalize">
                {activeTab.replace('-', ' ')}
              </h2>
            </div>
            <div className="flex items-center gap-4">
              <NotificationBell 
                notifications={notifications}
                setNotifications={setNotifications}
                showNotifications={showNotifications}
                setShowNotifications={setShowNotifications}
              />

              <div className="hidden sm:block text-right">
                <p className="text-xs text-slate-400 font-medium">Kebumen, Jawa Tengah</p>
                <p className="text-sm font-semibold text-slate-700">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
            </div>
          </header>
        )}

        <div className="p-6 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'home' && (
                <Home 
                  user={user} 
                  setActiveTab={setActiveTab} 
                  notifications={notifications}
                  setNotifications={setNotifications}
                  showNotifications={showNotifications}
                  setShowNotifications={setShowNotifications}
                />
              )}
              {activeTab === 'dashboard' && <RadarHama reports={reports} user={user} refresh={fetchReports} exportCSV={exportToCSV} />}
              {activeTab === 'pasar' && <PasarTani products={products} user={user} refresh={fetchProducts} exportCSV={exportToCSV} />}
              {activeTab === 'kalkulator' && <KalkulatorTani farms={farms} user={user} refresh={fetchFarms} exportCSV={exportToCSV} />}
              {activeTab === 'bantuan' && <BantuanDinas proposals={proposals} user={user} refresh={fetchProposals} />}
              {activeTab === 'tugas' && <TugasPetugas tasks={tasks} user={user} refresh={fetchTasks} />}
              {activeTab === 'edukasi' && <KelasTani user={user} />}
              {activeTab === 'profil' && <Profil user={user} setUser={setUser} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <AnimatePresence>
        {activeToast && (
          <Toast 
            notification={activeToast} 
            onClose={() => setActiveToast(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Feature Components ---

function Home({ 
  user, 
  setActiveTab,
  notifications,
  setNotifications,
  showNotifications,
  setShowNotifications
}: { 
  user: User, 
  setActiveTab: (tab: string) => void,
  notifications: Notification[],
  setNotifications: (notifs: Notification[]) => void,
  showNotifications: boolean,
  setShowNotifications: (show: boolean) => void
}) {
  const handleLogout = () => {
    if (confirm('Keluar aplikasi?')) {
      localStorage.removeItem('user');
      window.location.reload();
    }
  };

  return (
    <div className="max-w-md mx-auto pb-32">
      {/* Header */}
      <div className="flex justify-between items-start pt-8 px-6 mb-4">
        <div className="header-left">
          <h1 className="text-3xl font-extrabold text-white tracking-widest drop-shadow-lg">
            SINAR <span className="text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">TANI</span>
          </h1>
          <p className="text-xs text-white/90 font-medium mt-1 uppercase tracking-widest">Halo, {user.fullname}</p>
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell 
            notifications={notifications}
            setNotifications={setNotifications}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            dark
          />
          <button 
            onClick={() => setActiveTab('profil')}
            className="w-14 h-14 rounded-full border-2 border-white/90 overflow-hidden shadow-xl transition-transform hover:scale-105"
          >
            <img 
              src={user.photo || "https://api.dicebear.com/7.x/avataaars/svg?seed=" + user.username} 
              alt="Profile" 
              className="w-full h-full object-cover bg-white/20 backdrop-blur-md"
            />
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div className="px-6 mb-8">
        <div className="glass-card p-6 flex justify-between items-center hover:-translate-y-1 transition-all">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Keanggotaan</p>
            <h3 className="text-lg font-black text-slate-900">
              {user.role === 'admin' ? 'Administrator' : user.role === 'petugas' ? 'Petugas Lapangan' : 'Anggota Tani'}
            </h3>
          </div>
          <div className="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5">
            <Check size={14} /> Aktif 2024
          </div>
        </div>
      </div>

      {/* Carousel */}
      <div className="px-6 mb-8">
        <div className="rounded-[2rem] border-2 border-white/40 shadow-2xl overflow-hidden h-44">
          <div className="flex h-full overflow-x-auto snap-x snap-mandatory scrollbar-hide">
            <img className="min-w-full h-full object-cover snap-center" src="https://images.unsplash.com/photo-1625246333195-58197bd47d72?w=800&h=400&fit=crop" alt="Promo 1" />
            <img className="min-w-full h-full object-cover snap-center" src="https://images.unsplash.com/photo-1592982537447-6f2a6a0c7c18?w=800&h=400&fit=crop" alt="Promo 2" />
          </div>
        </div>
      </div>

      <div className="px-6 mb-4 flex items-center gap-2">
        <div className="w-1 h-5 bg-gradient-to-b from-emerald-400 to-emerald-600 rounded-full" />
        <h2 className="text-white font-black text-base drop-shadow-md uppercase tracking-widest">Menu Layanan Terpadu</h2>
      </div>

      {/* Menu Grid */}
      <div className="grid grid-cols-3 gap-4 px-6 mb-8">
        <MenuCard icon={<Activity size={28} />} label="Radar Hama" color="border-red-500" bg="bg-gradient-to-br from-pink-500 to-red-500" onClick={() => setActiveTab('dashboard')} />
        <MenuCard icon={<ShoppingBag size={28} />} label="Pasar Tani" color="border-emerald-500" bg="bg-gradient-to-br from-emerald-500 to-lime-500" onClick={() => setActiveTab('pasar')} />
        <MenuCard icon={<BookOpen size={28} />} label="Kelas Tani" color="border-blue-500" bg="bg-gradient-to-br from-blue-500 to-cyan-400" onClick={() => setActiveTab('edukasi')} />
        <MenuCard icon={<Calculator size={28} />} label="Kalkulator" color="border-amber-500" bg="bg-gradient-to-br from-amber-500 to-yellow-400" onClick={() => setActiveTab('kalkulator')} />
        <MenuCard icon={<HandHelping size={28} />} label="Bantuan Dinas" color="border-orange-500" bg="bg-gradient-to-br from-red-500 to-orange-400" onClick={() => setActiveTab('bantuan')} />
        {user.role === 'admin' && (
          <MenuCard icon={<ShieldCheck size={28} />} label="Admin Panel" color="border-indigo-500" bg="bg-gradient-to-br from-indigo-600 to-blue-400" onClick={() => setActiveTab('admin')} />
        )}
        <MenuCard icon={<UserIcon size={28} />} label="Edit Profil" color="border-purple-500" bg="bg-gradient-to-br from-purple-600 to-pink-400" onClick={() => setActiveTab('profil')} />
        <MenuCard icon={<LogOut size={28} />} label="Keluar Akun" color="border-slate-500" bg="bg-gradient-to-br from-slate-600 to-slate-400" onClick={handleLogout} />
      </div>
    </div>
  );
}

function MenuCard({ icon, label, color, bg, onClick }: { icon: React.ReactNode, label: string, color: string, bg: string, onClick: () => void | Promise<void> }) {
  return (
    <button 
      onClick={onClick}
      className="group flex flex-col items-center"
    >
      <div className={cn(
        "w-full bg-white/98 backdrop-blur-md rounded-[2rem] p-4 flex flex-col items-center shadow-lg border-b-4 transition-all group-hover:-translate-y-1.5 group-hover:shadow-2xl",
        color
      )}>
        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-xl mb-2 transition-transform group-hover:scale-110 group-hover:rotate-6", bg)}>
          {icon}
        </div>
        <span className="text-[10px] font-black text-slate-600 leading-tight uppercase tracking-tight text-center">
          {label.split(' ').map((word, i) => <React.Fragment key={i}>{word}<br/></React.Fragment>)}
        </span>
      </div>
    </button>
  );
}

function BottomNav({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) {
  return (
    <div className="fixed bottom-5 left-0 right-0 z-50 px-4 max-w-md mx-auto">
      <div className="bg-slate-900/85 backdrop-blur-3xl border border-white/10 rounded-[2rem] p-2 flex justify-between items-center shadow-2xl">
        <NavItem icon={<HomeIcon size={20} />} label="Beranda" active={activeTab === 'home'} onClick={() => setActiveTab('home')} />
        <NavItem icon={<Activity size={20} />} label="Radar" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
        
        <div className="relative -mt-10">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 via-emerald-600 to-emerald-800 border-4 border-slate-900/85 flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-transform hover:scale-110 animate-pulse-glow"
          >
            <Camera size={28} />
          </button>
          <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-black text-emerald-400 uppercase tracking-widest whitespace-nowrap drop-shadow-md">Lapor</span>
        </div>

        <NavItem icon={<ShoppingBag size={20} />} label="Pasar" active={activeTab === 'pasar'} onClick={() => setActiveTab('pasar')} />
        <NavItem icon={<UserIcon size={20} />} label="Profil" active={activeTab === 'profil'} onClick={() => setActiveTab('profil')} />
      </div>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex flex-col items-center p-2 rounded-2xl transition-all min-w-[56px] relative",
        active ? "bg-emerald-400/10 text-emerald-400" : "text-white/50 hover:text-white/80 hover:bg-white/5"
      )}
    >
      {active && <div className="absolute top-1 w-1 h-1 bg-emerald-400 rounded-full shadow-[0_0_8px_#4ade80]" />}
      {icon}
      <span className="text-[9px] font-bold mt-1 uppercase tracking-tighter opacity-80">{label}</span>
    </button>
  );
}

function RadarHama({ reports, user, refresh, exportCSV }: { reports: Report[], user: User, refresh: () => void, exportCSV: (data: any[], name: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState({ status: 'Semua', hama: 'Semua' });
  const [formData, setFormData] = useState({
    desa: '',
    kec: '',
    hama: '',
    status: 'Aman',
    lat: -7.67,
    lon: 109.65
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [aiResult, setAiResult] = useState<{ name: string, treatment: string, prevention: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [loading, setLoading] = useState(false);

  const stats = {
    total: reports.length,
    bahaya: reports.filter(r => r.status === 'Bahaya').length,
    waspada: reports.filter(r => r.status === 'Waspada').length,
    aman: reports.filter(r => r.status === 'Aman').length,
  };

  const pieData = [
    { name: 'Bahaya', value: stats.bahaya, color: '#ef4444' },
    { name: 'Waspada', value: stats.waspada, color: '#f59e0b' },
    { name: 'Aman', value: stats.aman, color: '#10b981' },
  ];

  const hamaCounts = reports.reduce((acc: any, r) => {
    acc[r.hama] = (acc[r.hama] || 0) + 1;
    return acc;
  }, {});

  const barData = Object.keys(hamaCounts).map(hama => ({
    name: hama,
    jumlah: hamaCounts[hama]
  })).sort((a, b) => b.jumlah - a.jumlah).slice(0, 5);

  const filteredReports = reports.filter(r => {
    const statusMatch = filter.status === 'Semua' || r.status === filter.status;
    const hamaMatch = filter.hama === 'Semua' || r.hama === filter.hama;
    return statusMatch && hamaMatch;
  });

  const uniqueHamas = Array.from(new Set(reports.map(r => r.hama)));

  const getIcon = (status: string) => {
    const color = status === 'Bahaya' ? '#ef4444' : status === 'Waspada' ? '#f59e0b' : '#10b981';
    return L.divIcon({
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.3);"></div>`,
      className: 'custom-div-icon',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  const LocateButton = () => {
    const map = useMap();
    return (
      <button 
        onClick={() => {
          navigator.geolocation.getCurrentPosition((pos) => {
            map.setView([pos.coords.latitude, pos.coords.longitude], 14);
          });
        }}
        className="absolute bottom-5 right-5 z-[500] bg-white p-3 rounded-full shadow-xl text-slate-600 hover:text-emerald-600 transition-all"
        title="Lokasi Saya"
      >
        <Navigation size={20} />
      </button>
    );
  };

  const handleVerify = async (reportId: number) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/verify`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_role: user.role })
      });
      if (res.ok) refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAiIdentify = async () => {
    if (!selectedFile) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(selectedFile);
      });
      const base64Data = await base64Promise;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: selectedFile.type,
              },
            },
            {
              text: "Identifikasi hama atau penyakit tanaman pada gambar ini. Berikan nama hama/penyakit, cara penanganan (treatment), dan cara pencegahan (prevention). Berikan jawaban dalam format JSON.",
            },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              treatment: { type: Type.STRING },
              prevention: { type: Type.STRING },
            },
            required: ["name", "treatment", "prevention"],
          },
        },
      });

      const result = JSON.parse(response.text || '{}');
      setAiResult(result);
      if (result.name) {
        setFormData(prev => ({ ...prev, hama: result.name }));
      }
    } catch (err) {
      console.error("AI Identification error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      body.append('user_id', user.id.toString());
      body.append('desa', formData.desa);
      body.append('kec', formData.kec);
      body.append('hama', formData.hama);
      body.append('status', formData.status);
      body.append('lat', formData.lat.toString());
      body.append('lon', formData.lon.toString());
      if (selectedFile) {
        body.append('foto', selectedFile);
      }

      const res = await fetch('/api/reports', {
        method: 'POST',
        body
      });

      if (res.ok) {
        setShowForm(false);
        setSelectedFile(null);
        setAiResult(null);
        refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-6 text-center">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Laporan</span>
          <div className="text-4xl font-black text-slate-900">{stats.total}</div>
        </div>
        <div className="glass-card p-6 text-center border-l-4 border-red-500">
          <span className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1 block">Bahaya</span>
          <div className="text-4xl font-black text-slate-900">{stats.bahaya}</div>
        </div>
        <div className="glass-card p-6 text-center border-l-4 border-amber-500">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 block">Waspada</span>
          <div className="text-4xl font-black text-slate-900">{stats.waspada}</div>
        </div>
        <div className="glass-card p-6 text-center border-l-4 border-emerald-500">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 block">Aman</span>
          <div className="text-4xl font-black text-slate-900">{stats.aman}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 glass-card">
          <h5 className="font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" /> Status Lahan
          </h5>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <RechartsLegend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-6 glass-card">
          <h5 className="font-black text-slate-900 uppercase tracking-tight mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" /> Tren Hama
          </h5>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <XAxis dataKey="name" hide />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="jumlah" fill="#10b981" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="glass-card overflow-hidden relative">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h5 className="font-black text-slate-900 uppercase tracking-tight mb-0 flex items-center gap-2">
            <MapPin size={18} className="text-red-500" /> Peta Persebaran Hama
          </h5>
          <div className="flex gap-2">
            {(user.role === 'admin' || user.role === 'petugas') && (
              <button 
                onClick={() => exportCSV(reports, 'Laporan_Radar_Hama')}
                className="bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-white transition-all border border-slate-200 flex items-center gap-2"
                title="Ekspor CSV"
              >
                <Download size={16} /> <span className="hidden sm:inline">Ekspor</span>
              </button>
            )}
            <button 
              onClick={() => setShowForm(true)}
              className="bg-emerald-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-lg shadow-emerald-200 hover:scale-105 transition-all"
            >
              Lapor
            </button>
          </div>
        </div>
        <div className="h-[480px] relative z-0">
          <div className="absolute top-5 left-5 z-[500] flex flex-col gap-2">
            <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-white/50 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                <Filter size={12} /> Filter
              </div>
              <select 
                className="text-xs font-bold text-slate-700 bg-transparent outline-none"
                value={filter.status}
                onChange={e => setFilter({...filter, status: e.target.value})}
              >
                <option value="Semua">Semua Status</option>
                <option value="Bahaya">Bahaya</option>
                <option value="Waspada">Waspada</option>
                <option value="Aman">Aman</option>
              </select>
            </div>
          </div>

        <MapContainer center={[-7.67, 109.65]} zoom={12} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <LocateButton />
          {filteredReports.map(report => (
            <React.Fragment key={report.id}>
              <CircleMarker 
                center={[report.lat, report.lon]}
                pathOptions={{ 
                  color: report.status === 'Bahaya' ? '#ef4444' : report.status === 'Waspada' ? '#f59e0b' : '#10b981',
                  fillColor: report.status === 'Bahaya' ? '#ef4444' : report.status === 'Waspada' ? '#f59e0b' : '#10b981',
                  fillOpacity: 0.4,
                  weight: 2
                }}
                radius={20}
              />
              <Marker position={[report.lat, report.lon]} icon={getIcon(report.status)}>
                <Popup className="custom-popup">
                  <div className="w-64">
                    {report.foto && (
                      <img 
                        src={report.foto} 
                        className="w-full h-32 object-cover" 
                        alt="Laporan"
                        onError={(e) => { (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/hama/400/200' }}
                      />
                    )}
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-slate-900 uppercase tracking-tight m-0">{report.hama}</h4>
                        <span className={cn(
                          "text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                          report.status === 'Bahaya' ? "bg-red-100 text-red-600" :
                          report.status === 'Waspada' ? "bg-amber-100 text-amber-600" :
                          "bg-emerald-100 text-emerald-600"
                        )}>
                          {report.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold mb-3 flex items-center gap-1">
                        <MapPin size={10} /> {report.desa}, {report.kec}
                      </p>
                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400">
                            {report.user_name[0]}
                          </div>
                          <span className="text-[10px] font-bold text-slate-600">{report.user_name}</span>
                        </div>
                        {(user.role === 'petugas' || user.role === 'admin') && report.is_verified === 0 && (
                          <button 
                            onClick={() => handleVerify(report.id)}
                            className="text-[10px] font-black text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100 transition-all uppercase tracking-widest"
                          >
                            Verifikasi
                          </button>
                        )}
                        {report.is_verified === 1 && (
                          <div className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                            <CheckCircle2 size={12} /> Terverifikasi
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          ))}
        </MapContainer>
        </div>
      </div>

      <div className="glass-card p-6">
        <h5 className="font-black text-slate-900 uppercase tracking-tight mb-4">Laporan Terbaru</h5>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Lokasi</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Hama</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {reports.slice(0, 10).map(report => (
                <tr key={report.id} className="group">
                  <td className="py-4 text-xs font-bold text-slate-500">{new Date(report.created_at).toLocaleDateString()}</td>
                  <td className="py-4 text-xs font-bold text-slate-700">{report.desa}</td>
                  <td className="py-4 text-xs font-bold text-slate-900">{report.hama}</td>
                  <td className="py-4">
                    <span className={cn(
                      "text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest",
                      report.status === 'Bahaya' ? "bg-red-100 text-red-600" :
                      report.status === 'Waspada' ? "bg-amber-100 text-amber-600" :
                      "bg-emerald-100 text-emerald-600"
                    )}>
                      {report.status}
                    </span>
                  </td>
                  <td className="py-4">
                    {(user.role === 'petugas' || user.role === 'admin') && report.is_verified === 0 ? (
                      <button 
                        onClick={() => handleVerify(report.id)}
                        className="text-[9px] font-black text-emerald-600 hover:bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-100 transition-all uppercase tracking-widest"
                      >
                        Verifikasi
                      </button>
                    ) : report.is_verified === 1 ? (
                      <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">
                        <CheckCircle2 size={12} /> OK
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Menunggu</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Buat Laporan OPT">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Desa</label>
              <input 
                type="text" required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.desa}
                onChange={e => setFormData({...formData, desa: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kecamatan</label>
              <input 
                type="text" required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.kec}
                onChange={e => setFormData({...formData, kec: e.target.value})}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Foto Hama/Tanaman</label>
            <div className="flex gap-2">
              <input 
                type="file" accept="image/*"
                className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                onChange={e => setSelectedFile(e.target.files?.[0] || null)}
              />
              <button 
                type="button"
                disabled={!selectedFile || aiLoading}
                onClick={handleAiIdentify}
                className="bg-purple-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-bold shadow-lg shadow-purple-100 disabled:opacity-50 transition-all hover:bg-purple-700"
              >
                {aiLoading ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />}
                <span className="hidden sm:inline">Identifikasi AI</span>
              </button>
            </div>
          </div>
          {aiResult && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-purple-50 rounded-2xl border border-purple-100 space-y-3"
            >
              <div className="flex items-center gap-2 text-purple-700 font-black text-xs uppercase tracking-widest">
                <Sparkles size={14} /> Hasil Analisis AI
              </div>
              <div>
                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter">Identifikasi</p>
                <p className="text-sm font-black text-slate-900">{aiResult.name}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter">Penanganan</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{aiResult.treatment}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-tighter">Pencegahan</p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{aiResult.prevention}</p>
                </div>
              </div>
            </motion.div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Jenis Hama/OPT</label>
            <input 
              type="text" required placeholder="Contoh: Wereng, Tikus, dll"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.hama}
              onChange={e => setFormData({...formData, hama: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status Serangan</label>
            <select 
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value as any})}
            >
              <option value="Aman">Aman</option>
              <option value="Waspada">Waspada</option>
              <option value="Bahaya">Bahaya</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Latitude</label>
              <input 
                type="number" step="any" required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.lat}
                onChange={e => setFormData({...formData, lat: parseFloat(e.target.value)})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Longitude</label>
              <input 
                type="number" step="any" required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.lon}
                onChange={e => setFormData({...formData, lon: parseFloat(e.target.value)})}
              />
            </div>
          </div>
          <button 
            disabled={loading}
            className="w-full glass-emerald text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Laporan'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function PasarTani({ products, user, refresh, exportCSV }: { products: Product[], user: User, refresh: () => void, exportCSV: (data: any[], name: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    price: '',
    description: '',
    seller_phone: user.phone || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const body = new FormData();
      body.append('user_id', user.id.toString());
      body.append('product_name', formData.product_name);
      body.append('price', formData.price);
      body.append('description', formData.description);
      body.append('seller_phone', formData.seller_phone);

      const res = await fetch('/api/products', {
        method: 'POST',
        body
      });

      if (res.ok) {
        setShowForm(false);
        refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-slate-800">Produk Pertanian</h3>
        <div className="flex gap-2">
          {(user.role === 'admin' || user.role === 'petugas') && (
            <button 
              onClick={() => exportCSV(products, 'Data_Pasar_Tani')}
              className="glass text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-white transition-all"
            >
              <Download size={16} /> <span className="hidden sm:inline">Ekspor</span>
            </button>
          )}
          <button 
            onClick={() => setShowForm(true)}
            className="glass-emerald text-white px-4 py-2 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-emerald-100"
          >
            <Plus size={20} />
            <span>Jual Produk</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {products.map(product => (
          <Card key={product.id} className="group cursor-pointer hover:shadow-xl transition-all duration-300">
            <div className="aspect-square bg-slate-100 relative overflow-hidden">
              <img 
                src={product.photo || `https://picsum.photos/seed/${product.id}/400/400`} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
              />
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-emerald-700 font-bold text-sm">
                Rp {product.price.toLocaleString()}
              </div>
            </div>
            <div className="p-4">
              <h4 className="font-bold text-slate-900 mb-1">{product.product_name}</h4>
              <p className="text-sm text-slate-500 line-clamp-2 mb-4">{product.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 text-xs font-bold">
                    {product.seller_name[0]}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{product.seller_name}</span>
                </div>
                <a 
                  href={`https://wa.me/${product.seller_phone}`}
                  className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <Phone size={16} />
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Jual Produk Pertanian">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Produk</label>
            <input 
              type="text" required
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.product_name}
              onChange={e => setFormData({...formData, product_name: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Harga (Rp)</label>
            <input 
              type="number" required
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.price}
              onChange={e => setFormData({...formData, price: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
            <textarea 
              required rows={3}
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">No. WhatsApp</label>
            <input 
              type="text" required placeholder="Contoh: 08123456789"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.seller_phone}
              onChange={e => setFormData({...formData, seller_phone: e.target.value})}
            />
          </div>
          <button 
            disabled={loading}
            className="w-full glass-emerald text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Pasang Iklan'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function KalkulatorTani({ farms, user, refresh, exportCSV }: { farms: Farm[], user: User, refresh: () => void, exportCSV: (data: any[], name: string) => void }) {
  const [showForm, setShowForm] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'lahan' | 'keuangan'>('lahan');
  const [expandedFarmId, setExpandedFarmId] = useState<number | null>(null);
  const [transactions, setTransactions] = useState([
    { id: 1, date: '2026-02-15', type: 'pengeluaran', category: 'Pupuk', amount: 450000, note: 'Pembelian pupuk urea 2 sak' },
    { id: 2, date: '2026-02-18', type: 'pengeluaran', category: 'Bibit', amount: 200000, note: 'Bibit padi IR64' },
    { id: 3, date: '2026-02-20', type: 'pemasukan', category: 'Penjualan', amount: 1200000, note: 'Penjualan sisa panen jagung' },
  ]);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'pengeluaran',
    category: 'Pupuk',
    amount: '',
    note: ''
  });
  const [formData, setFormData] = useState({
    name: '',
    commodity: 'padi',
    variety: '',
    area: '',
    modal_awal: '',
    planting_date: new Date().toISOString().split('T')[0],
    duration: '120'
  });
  const [loading, setLoading] = useState(false);

  // Commodity data for prediction
  const commodityData: Record<string, { yieldPerM2: number, pricePerKg: number }> = {
    padi: { yieldPerM2: 0.6, pricePerKg: 6500 },
    jagung: { yieldPerM2: 0.8, pricePerKg: 5000 },
    kedelai: { yieldPerM2: 0.2, pricePerKg: 12000 },
    cabai: { yieldPerM2: 1.5, pricePerKg: 30000 },
    bawang_merah: { yieldPerM2: 1.0, pricePerKg: 25000 },
  };

  const calculatePrediction = (farm: Farm) => {
    const data = commodityData[farm.commodity] || commodityData.padi;
    const estimatedYield = farm.area * data.yieldPerM2;
    const estimatedRevenue = estimatedYield * data.pricePerKg;
    const estimatedProfit = estimatedRevenue - farm.modal_awal;
    return { estimatedYield, estimatedRevenue, estimatedProfit };
  };

  const totalStats = farms.reduce((acc, farm) => {
    const { estimatedRevenue, estimatedProfit } = calculatePrediction(farm);
    return {
      totalModal: acc.totalModal + farm.modal_awal,
      totalRevenue: acc.totalRevenue + estimatedRevenue,
      totalProfit: acc.totalProfit + estimatedProfit
    };
  }, { totalModal: 0, totalRevenue: 0, totalProfit: 0 });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/farms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: user.id })
      });

      if (res.ok) {
        setShowForm(false);
        refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 glass-emerald text-white border-none shadow-emerald-200/50">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Estimasi Laba Bersih</span>
          </div>
          <p className="text-sm opacity-80 font-bold">Total Keuntungan</p>
          <p className="text-3xl font-black mt-1">Rp {totalStats.totalProfit.toLocaleString('id-ID')}</p>
        </Card>
        
        <Card className="p-6 bg-white/80 backdrop-blur-xl border-white/50 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
              <Wallet size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Modal</span>
          </div>
          <p className="text-sm text-slate-500 font-bold">Modal Terinvestasi</p>
          <p className="text-3xl font-black text-slate-900 mt-1">Rp {totalStats.totalModal.toLocaleString('id-ID')}</p>
        </Card>

        <Card className="p-6 bg-white/80 backdrop-blur-xl border-white/50 shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
              <ShoppingBag size={24} />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Omzet</span>
          </div>
          <p className="text-sm text-slate-500 font-bold">Total Pendapatan Kotor</p>
          <p className="text-3xl font-black text-slate-900 mt-1">Rp {totalStats.totalRevenue.toLocaleString('id-ID')}</p>
        </Card>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveSubTab('lahan')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeSubTab === 'lahan' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Manajemen Lahan
          </button>
          <button 
            onClick={() => setActiveSubTab('keuangan')}
            className={cn(
              "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              activeSubTab === 'keuangan' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Laporan Keuangan
          </button>
        </div>
        {(user.role === 'admin' || user.role === 'petugas') && (
          <button 
            onClick={() => exportCSV(farms, 'Data_Kalkulator_Tani')}
            className="glass text-slate-700 px-4 py-2 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-sm border border-slate-100"
          >
            <Download size={16} /> <span className="hidden sm:inline">Ekspor CSV</span>
          </button>
        )}
        
        {activeSubTab === 'lahan' ? (
          <button 
            onClick={() => setShowForm(true)}
            className="glass-emerald text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest shadow-xl shadow-emerald-200/50 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            <span>Tambah Lahan</span>
          </button>
        ) : (
          <button 
            onClick={() => setShowTransactionModal(true)}
            className="glass-emerald text-white px-6 py-3 rounded-2xl flex items-center gap-2 font-black uppercase tracking-widest shadow-xl shadow-emerald-200/50 hover:scale-105 transition-all"
          >
            <Plus size={20} />
            <span>Catat Transaksi</span>
          </button>
        )}
      </div>

      {activeSubTab === 'lahan' ? (
        <Card className="overflow-hidden border-none shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left bg-slate-50/50 border-b border-slate-100">
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Lahan</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Luas</th>
                  <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estimasi Laba</th>
                  <th className="p-6 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {farms.map(farm => {
                  const prediction = calculatePrediction(farm);
                  const isExpanded = expandedFarmId === farm.id;
                  return (
                    <React.Fragment key={farm.id}>
                      <tr className="group hover:bg-slate-50/30 transition-all">
                        <td className="p-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                              <LayoutDashboard size={20} />
                            </div>
                            <span className="font-extrabold text-slate-900">{farm.name}</span>
                          </div>
                        </td>
                        <td className="p-6 text-sm font-bold text-slate-600">{farm.area} m²</td>
                        <td className="p-6 text-sm font-black text-emerald-600">Rp {prediction.estimatedProfit.toLocaleString('id-ID')}</td>
                        <td className="p-6 text-right">
                          <button 
                            onClick={() => setExpandedFarmId(isExpanded ? null : farm.id)}
                            className="px-4 py-2 bg-emerald-50 text-emerald-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-100 transition-all"
                          >
                            {isExpanded ? 'Tutup' : 'Lihat'}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/50">
                          <td colSpan={4} className="p-8">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Komoditas</p>
                                <p className="text-slate-800 font-extrabold capitalize">{farm.commodity.replace('_', ' ')}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Varietas</p>
                                <p className="text-slate-800 font-extrabold">{farm.variety}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tgl Tanam</p>
                                <p className="text-slate-800 font-extrabold">{new Date(farm.planting_date).toLocaleDateString('id-ID')}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimasi Panen</p>
                                <p className="text-emerald-600 font-extrabold">{new Date(farm.estimated_harvest_date).toLocaleDateString('id-ID')}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Modal Awal</p>
                                <p className="text-slate-800 font-extrabold">Rp {farm.modal_awal.toLocaleString('id-ID')}</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prediksi Hasil</p>
                                <p className="text-slate-800 font-extrabold">{prediction.estimatedYield.toFixed(1)} Kg</p>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prediksi Omzet</p>
                                <p className="text-slate-800 font-extrabold">Rp {prediction.estimatedRevenue.toLocaleString('id-ID')}</p>
                              </div>
                              <div className="flex items-end">
                                <button className="w-full px-4 py-3 glass-emerald text-white font-black text-[10px] uppercase tracking-widest rounded-xl shadow-lg shadow-emerald-100 hover:scale-105 transition-all">
                                  Catat Panen
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 p-8">
              <h4 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Riwayat Transaksi</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-slate-100">
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</th>
                      <th className="pb-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                      <th className="pb-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {transactions.map(t => (
                      <tr key={t.id} className="group hover:bg-slate-50/50 transition-all">
                        <td className="py-4 text-sm font-bold text-slate-600">{new Date(t.date).toLocaleDateString('id-ID')}</td>
                        <td className="py-4">
                          <span className={cn(
                            "px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                            t.type === 'pemasukan' ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
                          )}>
                            {t.category}
                          </span>
                        </td>
                        <td className="py-4 text-sm text-slate-500 font-medium">{t.note}</td>
                        <td className={cn(
                          "py-4 text-sm font-black text-right",
                          t.type === 'pemasukan' ? "text-emerald-600" : "text-red-600"
                        )}>
                          {t.type === 'pemasukan' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <div className="space-y-6">
              <Card className="p-8">
                <h4 className="text-lg font-black text-slate-900 mb-6 uppercase tracking-tight">Analisis Biaya</h4>
                <div className="space-y-4">
                  {[
                    { label: 'Pupuk & Pestisida', value: 45, color: 'bg-emerald-500' },
                    { label: 'Bibit & Benih', value: 25, color: 'bg-blue-500' },
                    { label: 'Tenaga Kerja', value: 20, color: 'bg-amber-500' },
                    { label: 'Lainnya', value: 10, color: 'bg-slate-400' },
                  ].map(item => (
                    <div key={item.label}>
                      <div className="flex justify-between text-xs font-bold mb-1.5">
                        <span className="text-slate-500 uppercase tracking-widest">{item.label}</span>
                        <span className="text-slate-900">{item.value}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all duration-1000", item.color)} style={{ width: `${item.value}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-8 glass-emerald text-white border-none">
                <h4 className="text-lg font-black mb-4 uppercase tracking-tight">Tips Keuangan</h4>
                <p className="text-sm opacity-90 leading-relaxed font-medium">
                  Gunakan fitur "Catat Panen" segera setelah masa panen selesai untuk mendapatkan analisis laba rugi yang lebih akurat per lahan.
                </p>
              </Card>
            </div>
          </div>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Tambah Lahan Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lahan</label>
            <input 
              type="text" required placeholder="Contoh: Sawah Lor, Kebun Kidul"
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Komoditas</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.commodity}
                onChange={e => setFormData({...formData, commodity: e.target.value})}
              >
                <option value="padi">Padi</option>
                <option value="jagung">Jagung</option>
                <option value="kedelai">Kedelai</option>
                <option value="cabai">Cabai</option>
                <option value="bawang_merah">Bawang Merah</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Varietas</label>
              <input 
                type="text" required placeholder="Contoh: IR64, Ciherang"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.variety}
                onChange={e => setFormData({...formData, variety: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Luas (m²)</label>
              <input 
                type="number" required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.area}
                onChange={e => setFormData({...formData, area: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Modal Awal (Rp)</label>
              <input 
                type="number" required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.modal_awal}
                onChange={e => setFormData({...formData, modal_awal: e.target.value})}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tgl Tanam</label>
              <input 
                type="date" required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.planting_date}
                onChange={e => setFormData({...formData, planting_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Durasi (Hari)</label>
              <input 
                type="number" required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                value={formData.duration}
                onChange={e => setFormData({...formData, duration: e.target.value})}
              />
            </div>
          </div>
          <button 
            disabled={loading}
            className="w-full glass-emerald text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-100 disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Simpan Lahan'}
          </button>
        </form>
      </Modal>

      {/* Modal Tambah Transaksi */}
      <Modal isOpen={showTransactionModal} onClose={() => setShowTransactionModal(false)} title="Catat Transaksi Baru">
        <form onSubmit={(e) => {
          e.preventDefault();
          setTransactions([{ ...newTransaction, id: Date.now(), amount: Number(newTransaction.amount) }, ...transactions]);
          setShowTransactionModal(false);
          setNewTransaction({
            date: new Date().toISOString().split('T')[0],
            type: 'pengeluaran',
            category: 'Pupuk',
            amount: '',
            note: ''
          });
        }} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tipe</label>
              <select 
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={newTransaction.type}
                onChange={e => setNewTransaction({...newTransaction, type: e.target.value as any})}
              >
                <option value="pengeluaran">Pengeluaran</option>
                <option value="pemasukan">Pemasukan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Kategori</label>
              <select 
                className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                value={newTransaction.category}
                onChange={e => setNewTransaction({...newTransaction, category: e.target.value})}
              >
                <option value="Pupuk">Pupuk</option>
                <option value="Bibit">Bibit</option>
                <option value="Pestisida">Pestisida</option>
                <option value="Tenaga Kerja">Tenaga Kerja</option>
                <option value="Penjualan">Penjualan</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Jumlah (Rp)</label>
            <input 
              type="number" required placeholder="0"
              className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={newTransaction.amount}
              onChange={e => setNewTransaction({...newTransaction, amount: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Keterangan</label>
            <input 
              type="text" required placeholder="Contoh: Beli pupuk urea"
              className="w-full px-5 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              value={newTransaction.note}
              onChange={e => setNewTransaction({...newTransaction, note: e.target.value})}
            />
          </div>
          <button 
            type="submit"
            className="w-full glass-emerald text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-200/50 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Simpan Transaksi
          </button>
        </form>
      </Modal>
    </div>
  );
}

function BantuanDinas({ proposals, user, refresh }: { proposals: BantuanProposal[], user: User, refresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: '',
    amount: '',
    reason: ''
  });
  const [loading, setLoading] = useState(false);

  const programs = [
    {
      title: 'Bantuan Benih Padi Gratis',
      period: 'Jan - Mar 2024',
      desc: 'Dapatkan bantuan benih padi unggul gratis untuk petani dengan luas lahan maksimal 2 hektar. Kuota terbatas!',
      icon: '🌾',
      bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
      badges: [
        { text: 'Aktif', color: 'bg-emerald-500' },
        { text: 'Kuota: 500 Petani', color: 'bg-blue-500' }
      ]
    },
    {
      title: 'Alsintan (Alat Mesin Pertanian)',
      period: 'Feb - Apr 2024',
      desc: 'Pinjam pakai alat pertanian modern seperti traktor, pompa air, dan mesin panen dengan harga terjangkau.',
      icon: '🚜',
      bg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
      badges: [
        { text: 'Aktif', color: 'bg-emerald-500' },
        { text: 'Biaya: Rp 50rb/hari', color: 'bg-amber-500' }
      ]
    },
    {
      title: 'Pelatihan dan Sertifikasi',
      period: 'Berkelanjutan',
      desc: 'Ikuti pelatihan pertanian modern dan dapatkan sertifikat kompetensi dari Dinas Pertanian.',
      icon: '🎓',
      bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
      badges: [
        { text: 'Aktif', color: 'bg-emerald-500' },
        { text: 'Gratis', color: 'bg-blue-600' }
      ]
    }
  ];

  const ajukanBantuan = (programTitle: string) => {
    setFormData({ ...formData, type: programTitle });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/bantuan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, user_id: user.id })
      });

      if (res.ok) {
        setShowForm(false);
        setFormData({ type: '', amount: '', reason: '' });
        refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/bantuan/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const myProposals = proposals.filter(p => p.user_id === user.id);
  const totalReceived = proposals.length;
  const totalApproved = proposals.filter(p => p.status === 'Disetujui').length;
  const myApprovedCount = myProposals.filter(p => p.status === 'Disetujui').length;

  const canManage = user.role === 'admin' || user.role === 'petugas';

  return (
    <div className="max-w-md mx-auto pb-20">
      <div className="text-center py-10">
        <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-orange-500 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-orange-500/30 mx-auto mb-6">
          🏦
        </div>
        <h2 className="text-2xl font-black text-white drop-shadow-md">Program Bantuan Pertanian</h2>
        <p className="text-white/80 text-sm font-medium">Dinas Pertanian Kabupaten Kebumen</p>
      </div>

      <div className="px-6 mb-8">
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-emerald-400 mb-1">3</div>
            <div className="text-[9px] font-black text-white/70 uppercase tracking-widest">Tersedia</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-amber-400 mb-1">{canManage ? totalReceived : myProposals.length}</div>
            <div className="text-[9px] font-black text-white/70 uppercase tracking-widest">{canManage ? 'Total Masuk' : 'Pengajuan'}</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-center">
            <div className="text-2xl font-black text-blue-400 mb-1">{canManage ? totalApproved : myApprovedCount}</div>
            <div className="text-[9px] font-black text-white/70 uppercase tracking-widest">{canManage ? 'Total Disetujui' : 'Disetujui'}</div>
          </div>
        </div>
      </div>

      <div className="px-6 space-y-6 mb-10">
        {programs.map((program, idx) => (
          <Card key={idx} className="bg-white/95 backdrop-blur-2xl border-white/60 shadow-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner" style={{ background: program.bg }}>
                {program.icon}
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 leading-tight">{program.title}</h4>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Periode: {program.period}</span>
              </div>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed mb-4 font-medium">{program.desc}</p>
            <div className="flex gap-2 mb-6">
              {program.badges.map((badge, bIdx) => (
                <span key={bIdx} className={cn("px-3 py-1 rounded-full text-[9px] font-black text-white uppercase tracking-widest", badge.color)}>
                  {badge.text}
                </span>
              ))}
            </div>
            <button 
              onClick={() => ajukanBantuan(program.title)}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-4 rounded-xl text-xs font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <HandHelping size={16} />
              Ajukan Sekarang
            </button>
          </Card>
        ))}
      </div>

      <div className="px-6">
        <Card className="bg-white/10 backdrop-blur-2xl border-white/20 shadow-2xl p-6 overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <h5 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              Riwayat Pengajuan
            </h5>
            <button 
              onClick={() => exportToCSV(proposals, 'pengajuan_bantuan.csv')}
              className="bg-white/10 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all"
            >
              <Download size={14} />
              Export
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] font-black text-white/50 uppercase tracking-widest border-b border-white/10">
                  <th className="pb-4">Program</th>
                  <th className="pb-4">Tanggal</th>
                  <th className="pb-4">Status</th>
                  {canManage && <th className="pb-4 text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {proposals.map(p => {
                  if (!canManage && p.user_id !== user.id) return null;
                  return (
                    <tr key={p.id} className="text-xs font-bold text-white/90">
                      <td className="py-4 pr-4">{p.type}</td>
                      <td className="py-4 pr-4 whitespace-nowrap">{new Date(p.created_at).toLocaleDateString('id-ID')}</td>
                      <td className="py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                          p.status === 'Disetujui' ? "bg-emerald-500/20 text-emerald-400" :
                          p.status === 'Ditolak' ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
                        )}>
                          {p.status}
                        </span>
                      </td>
                      {canManage && (
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-1">
                            <button 
                              onClick={() => handleStatusUpdate(p.id, 'Disetujui')}
                              className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg hover:bg-emerald-500/40 transition-all"
                            >
                              <Check size={14} />
                            </button>
                            <button 
                              onClick={() => handleStatusUpdate(p.id, 'Ditolak')}
                              className="p-1.5 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/40 transition-all"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title={`Ajukan ${formData.type}`}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jumlah/Detail Kebutuhan</label>
            <input 
              type="text" required placeholder="Contoh: 50 kg benih / 2 hektar"
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold text-slate-700"
              value={formData.amount}
              onChange={e => setFormData({...formData, amount: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alasan Pengajuan</label>
            <textarea 
              required rows={3} placeholder="Jelaskan alasan pengajuan..."
              className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none resize-none transition-all font-bold text-slate-700"
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function TugasPetugas({ tasks, user, refresh }: { tasks: Task[], user: User, refresh: () => void }) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [officers, setOfficers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    officer_id: '',
    title: '',
    description: '',
    due_date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user.role === 'admin') {
      fetch('/api/officers').then(res => res.json()).then(setOfficers);
    }
  }, [user.role]);

  const handleStatusUpdate = async (id: number, status: string) => {
    try {
      await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setShowAddModal(false);
        setFormData({
          officer_id: '',
          title: '',
          description: '',
          due_date: new Date().toISOString().split('T')[0]
        });
        refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-20">
      <div className="text-center py-10">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-blue-500/30 mx-auto mb-6 text-white">
          <ClipboardList size={40} />
        </div>
        <h2 className="text-2xl font-black text-white drop-shadow-md">Manajemen Tugas</h2>
        <p className="text-white/80 text-sm font-medium">Pantau dan kelola tugas lapangan</p>
      </div>

      <div className="px-6 mb-8 flex justify-between items-center">
        <h3 className="text-white font-black uppercase tracking-widest text-xs">Daftar Tugas</h3>
        {user.role === 'admin' && (
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-white/10 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-white/20 hover:bg-white/20 transition-all"
          >
            <Plus size={14} /> Tambah Tugas
          </button>
        )}
      </div>

      <div className="px-6 space-y-4">
        {tasks.length === 0 && (
          <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-white/50 font-bold text-sm">Belum ada tugas yang tersedia</p>
          </div>
        )}
        {tasks.map(task => (
          <Card key={task.id} className="p-5 bg-white/95 backdrop-blur-2xl border-white/60 shadow-2xl">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-black text-slate-900 text-base leading-tight">{task.title}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  Tenggat: {new Date(task.due_date).toLocaleDateString('id-ID')}
                </p>
              </div>
              <span className={cn(
                "px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest",
                task.status === 'Completed' ? "bg-emerald-100 text-emerald-700" :
                task.status === 'Ongoing' ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"
              )}>
                {task.status}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">{task.description}</p>
            
            {user.role === 'admin' && (
              <div className="flex items-center gap-2 pt-3 border-t border-slate-100 mb-4">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center text-[8px] font-bold text-blue-600">
                  {task.officer_name?.[0]}
                </div>
                <span className="text-[10px] text-slate-500 font-bold">Ditugaskan ke: {task.officer_name}</span>
              </div>
            )}

            {(user.role === 'petugas' || user.role === 'admin') && task.status !== 'Completed' && (
              <div className="flex gap-2">
                {task.status === 'Pending' && (
                  <button 
                    onClick={() => handleStatusUpdate(task.id, 'Ongoing')}
                    className="flex-1 bg-blue-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 transition-all hover:scale-[1.02]"
                  >
                    Mulai Tugas
                  </button>
                )}
                {task.status === 'Ongoing' && (
                  <button 
                    onClick={() => handleStatusUpdate(task.id, 'Completed')}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all hover:scale-[1.02]"
                  >
                    Selesaikan
                  </button>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Tugas Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Pilih Petugas</label>
            <select 
              required
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
              value={formData.officer_id}
              onChange={e => setFormData({...formData, officer_id: e.target.value})}
            >
              <option value="">Pilih Petugas...</option>
              {officers.map(o => <option key={o.id} value={o.id}>{o.fullname} (@{o.username})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Judul Tugas</label>
            <input 
              type="text" required placeholder="Contoh: Kunjungan Farm A"
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Deskripsi</label>
            <textarea 
              required rows={3} placeholder="Detail tugas..."
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none resize-none transition-all font-bold text-slate-700"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Tenggat Waktu</label>
            <input 
              type="date" required
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-bold text-slate-700"
              value={formData.due_date}
              onChange={e => setFormData({...formData, due_date: e.target.value})}
            />
          </div>
          <button 
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {loading ? 'Menyimpan...' : 'Simpan Tugas'}
          </button>
        </form>
      </Modal>
    </div>
  );
}

function KelasTani({ user }: { user: User }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('semua');
  const [showAddModal, setShowAddModal] = useState(false);
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [newArticle, setNewArticle] = useState({
    title: '',
    category: 'Pertanian',
    content: '',
    video_url: '',
    image: 'https://picsum.photos/seed/new/800/400'
  });

  const fetchArticles = async () => {
    try {
      const res = await fetch('/api/articles');
      const data = await res.json();
      setArticles(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArticles();
  }, []);

  const categories = [
    { id: 'semua', label: 'Semua' },
    { id: 'Pertanian', label: 'Pertanian' },
    { id: 'Perkebunan', label: 'Perkebunan' },
    { id: 'Hama', label: 'Pengendalian Hama' },
    { id: 'Pasca', label: 'Pasca Panen' },
  ];

  const filteredArticles = articles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'semua' || article.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle)
      });
      if (res.ok) {
        setShowAddModal(false);
        setNewArticle({
          title: '',
          category: 'Pertanian',
          content: '',
          video_url: '',
          image: 'https://picsum.photos/seed/new/800/400'
        });
        fetchArticles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const bukaMateri = (article: any) => {
    if (article.video_url) {
      window.open(article.video_url, '_blank');
    } else {
      alert('Materi pembelajaran akan segera tersedia.');
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Hero Section */}
      <div className="relative h-64 rounded-3xl overflow-hidden shadow-2xl">
        <img src="https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=1200&h=400&fit=crop" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col justify-end p-8">
          <span className="text-emerald-400 font-bold text-sm uppercase tracking-widest mb-2">Unggulan</span>
          <h3 className="text-3xl font-bold text-white max-w-2xl leading-tight">Meningkatkan Hasil Panen dengan Teknologi Smart Farming</h3>
          <button className="mt-4 glass-emerald text-white w-fit px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all">
            Mulai Belajar <ArrowRight size={18} />
          </button>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="glass flex-1 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-lg mr-4">
            <Search className="text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Cari materi pembelajaran..." 
              className="bg-transparent border-none outline-none w-full text-slate-700 placeholder:text-slate-400 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {user.role === 'admin' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="glass-emerald text-white p-4 rounded-2xl shadow-xl hover:scale-105 transition-all"
            >
              <Plus size={24} />
            </button>
          )}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300",
                activeCategory === cat.id 
                  ? "glass-emerald text-white shadow-lg shadow-emerald-200/50" 
                  : "glass text-slate-600 hover:bg-emerald-50/50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Article Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          <div className="col-span-full py-20 text-center">
            <div className="animate-spin w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-white font-bold">Memuat materi...</p>
          </div>
        ) : filteredArticles.map(article => (
          <Card key={article.id} className="group flex flex-col h-full hover:shadow-2xl transition-all duration-500 border-none overflow-hidden glass-card">
            <div className="relative h-52 overflow-hidden">
              <img 
                src={article.image || 'https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800'} 
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://cdn-icons-png.flaticon.com/512/3074/3074086.png' }}
              />
              <div className="absolute top-4 left-4 glass-emerald text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                {article.category}
              </div>
            </div>
            <div className="p-6 flex flex-col flex-1">
              <h4 className="text-xl font-extrabold text-slate-900 mb-2 leading-tight group-hover:text-emerald-600 transition-colors">{article.title}</h4>
              <p className="text-sm text-slate-500 line-clamp-3 mb-6 leading-relaxed flex-1">{article.content}</p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5">
                  <Clock size={14} /> 30 Menit
                </span>
                <button 
                  onClick={() => bukaMateri(article)}
                  className="glass-emerald text-white px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider hover:scale-105 transition-all shadow-lg shadow-emerald-100"
                >
                  Mulai Belajar
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Tambah Materi Edukasi">
        <form onSubmit={handleAddArticle} className="space-y-4">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Judul Materi</label>
            <input 
              type="text" required
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
              value={newArticle.title}
              onChange={e => setNewArticle({...newArticle, title: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Kategori</label>
            <select 
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
              value={newArticle.category}
              onChange={e => setNewArticle({...newArticle, category: e.target.value})}
            >
              {categories.slice(1).map(c => <option key={c.id} value={c.label}>{c.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Konten Singkat</label>
            <textarea 
              required rows={3}
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none transition-all font-bold text-slate-700"
              value={newArticle.content}
              onChange={e => setNewArticle({...newArticle, content: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">URL Video (Opsional)</label>
            <input 
              type="url"
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
              value={newArticle.video_url}
              onChange={e => setNewArticle({...newArticle, video_url: e.target.value})}
            />
          </div>
          <button 
            className="w-full glass-emerald text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Simpan Materi
          </button>
        </form>
      </Modal>
    </div>
  );
}

function AdminPanel({ user }: { user: User }) {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPending = async () => {
    try {
      const res = await fetch('/api/admin/pending-users');
      const data = await res.json();
      setPendingUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approveUser = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/approve-user/${id}`, { method: 'POST' });
      if (res.ok) fetchPending();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-20">
      <div className="text-center py-10">
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/30 mx-auto mb-6 text-white">
          <ShieldCheck size={40} />
        </div>
        <h2 className="text-2xl font-black text-white drop-shadow-md">Admin Panel</h2>
        <p className="text-white/80 text-sm font-medium">Persetujuan pendaftaran admin baru</p>
      </div>

      <div className="px-6 space-y-4">
        <h3 className="text-white font-black uppercase tracking-widest text-xs mb-4">Menunggu Persetujuan</h3>
        {loading ? (
          <div className="text-center py-10">
            <Loader2 className="animate-spin text-white mx-auto" />
          </div>
        ) : pendingUsers.length === 0 ? (
          <div className="text-center py-10 bg-white/5 rounded-3xl border border-white/10">
            <p className="text-white/50 font-bold text-sm">Tidak ada pendaftaran tertunda</p>
          </div>
        ) : (
          pendingUsers.map(u => (
            <Card key={u.id} className="p-5 bg-white/95 backdrop-blur-2xl border-white/60 shadow-2xl">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="font-black text-slate-900 text-base leading-tight">{u.fullname}</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                    @{u.username} • {u.role}
                  </p>
                </div>
                <button 
                  onClick={() => approveUser(u.id)}
                  className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                >
                  Setujui
                </button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

function Profil({ user, setUser }: { user: User, setUser: (u: User) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    fullname: user.fullname,
    phone: user.phone || '',
    bio: user.bio || '',
    preferred_crops: user.preferred_crops || '',
    farming_practices: user.farming_practices || ''
  });
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <Card className="max-w-2xl mx-auto p-8">
        <h3 className="text-2xl font-bold text-slate-900 mb-6 font-black uppercase tracking-tight">Edit Profil</h3>
        <form onSubmit={handleUpdate} className="space-y-5">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
            <input 
              type="text" required
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
              value={formData.fullname}
              onChange={e => setFormData({...formData, fullname: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">No. Telepon</label>
            <input 
              type="text"
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Bio</label>
            <textarea 
              rows={3}
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none transition-all font-bold text-slate-700"
              value={formData.bio}
              onChange={e => setFormData({...formData, bio: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Komoditas Pilihan</label>
            <input 
              type="text" placeholder="Contoh: Padi, Jagung, Cabai"
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700"
              value={formData.preferred_crops}
              onChange={e => setFormData({...formData, preferred_crops: e.target.value})}
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Praktik Pertanian</label>
            <textarea 
              rows={2} placeholder="Contoh: Organik, Hidroponik, Konvensional"
              className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-100 focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none resize-none transition-all font-bold text-slate-700"
              value={formData.farming_practices}
              onChange={e => setFormData({...formData, farming_practices: e.target.value})}
            />
          </div>
          <div className="flex gap-4 pt-4">
            <button 
              type="button"
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
            >
              Batal
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-xl shadow-emerald-200"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto p-8 border-none shadow-2xl">
      <div className="flex flex-col items-center mb-8">
        <div className="w-32 h-32 rounded-3xl bg-emerald-100 flex items-center justify-center text-emerald-600 text-4xl font-bold mb-4 border-4 border-white shadow-xl">
          {user.fullname[0]}
        </div>
        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{user.fullname}</h3>
        <p className="text-slate-500 font-bold">@{user.username}</p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nama Lengkap</label>
            <p className="text-slate-800 font-bold px-1">{user.fullname}</p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">No. Telepon</label>
            <p className="text-slate-800 font-bold px-1">{user.phone || '-'}</p>
          </div>
        </div>
        <div>
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Bio</label>
          <p className="text-slate-800 font-medium px-1 leading-relaxed">{user.bio || 'Belum ada bio'}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Komoditas Pilihan</label>
            <p className="text-slate-800 font-bold px-1">{user.preferred_crops || '-'}</p>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Praktik Pertanian</label>
            <p className="text-slate-800 font-bold px-1">{user.farming_practices || '-'}</p>
          </div>
        </div>
        <div className="pt-6 border-t border-slate-100">
          <button 
            onClick={() => setIsEditing(true)}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
          >
            Edit Profil
          </button>
        </div>
      </div>
    </Card>
  );
}
