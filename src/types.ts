export type User = {
  id: number;
  fullname: string;
  username: string;
  role: 'petani' | 'petugas' | 'admin';
  photo?: string;
  bio?: string;
  phone?: string;
  preferred_crops?: string;
  farming_practices?: string;
};

export type Report = {
  id: number;
  user_id: number;
  user_name: string;
  desa: string;
  kec: string;
  hama: string;
  status: 'Aman' | 'Waspada' | 'Bahaya';
  lat: number;
  lon: number;
  foto?: string;
  is_verified: number;
  created_at: string;
};

export type Product = {
  id: number;
  user_id: number;
  seller_name: string;
  product_name: string;
  price: number;
  description: string;
  seller_phone: string;
  photo?: string;
  created_at: string;
};

export type Farm = {
  id: number;
  user_id: number;
  name: string;
  commodity: string;
  variety: string;
  area: number;
  modal_awal: number;
  planting_date: string;
  estimated_harvest_date: string;
  total_pendapatan: number;
  status: 'aktif' | 'panen';
  created_at: string;
};

export type BantuanProposal = {
  id: number;
  user_id: number;
  type: string;
  amount: string;
  reason: string;
  status: string;
  created_at: string;
};

export type Task = {
  id: number;
  officer_id: number;
  title: string;
  description: string;
  status: 'Pending' | 'Ongoing' | 'Completed';
  due_date: string;
  created_at: string;
  officer_name?: string;
};

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'danger';
  created_at: string;
  read: boolean;
};
