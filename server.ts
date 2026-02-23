import express from "express";
//import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";

dotenv.config(); // Memuat variabel dari file .env

// --- MONGODB CONNECTION & SCHEMAS ---
const MONGODB_URI = "mongodb+srv://zidniganz:xNElZEnUUOu0BXHG@cluster0.qaovn.mongodb.net/sinartani?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("✅ Terhubung ke MongoDB"))
  .catch(err => console.error("❌ Gagal terhubung ke MongoDB:", err));

// Opsi virtual id agar _id di-map menjadi id untuk frontend
const schemaOptions = { 
  timestamps: { createdAt: 'created_at', updatedAt: false },
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
};

const User = mongoose.model("User", new mongoose.Schema({
  fullname: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'petani' },
  photo: String,
  bio: String,
  phone: String,
  preferred_crops: String,
  farming_practices: String,
  is_approved: { type: Number, default: 1 },
}, schemaOptions));

const Report = mongoose.model("Report", new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  desa: String,
  kec: String,
  hama: String,
  status: String,
  lat: Number,
  lon: Number,
  foto: String,
  is_verified: { type: Number, default: 0 },
}, schemaOptions));

const Product = mongoose.model("Product", new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  product_name: String,
  price: Number,
  description: String,
  seller_phone: String,
  photo: String,
}, schemaOptions));

const Article = mongoose.model("Article", new mongoose.Schema({
  title: String,
  category: String,
  content: String,
  video_url: String,
  image: String,
}, schemaOptions));

const Farm = mongoose.model("Farm", new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: String,
  commodity: String,
  variety: String,
  area: Number,
  modal_awal: Number,
  planting_date: Date,
  estimated_harvest_date: Date,
  total_pendapatan: { type: Number, default: 0 },
  status: { type: String, default: 'aktif' },
}, schemaOptions));

const BantuanProposal = mongoose.model("BantuanProposal", new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: String,
  amount: String,
  reason: String,
  status: { type: String, default: 'Menunggu' },
}, schemaOptions));

const Task = mongoose.model("Task", new mongoose.Schema({
  officer_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title: { type: String, required: true },
  description: String,
  status: { type: String, default: 'Pending' },
  due_date: Date,
}, schemaOptions));

// --- SEEDING DATA ---
async function initDB() {
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    const hashedPass = bcrypt.hashSync("petani123", 10);
    const petani1 = await User.create({ fullname: "Budi Setiawan", username: "budi", password: hashedPass, role: "petani", is_approved: 1 });
    const petani2 = await User.create({ fullname: "Siti Aminah", username: "siti", password: hashedPass, role: "petani", is_approved: 1 });
    
    const hashedAdmin = bcrypt.hashSync("admin123", 10);
    await User.create({ fullname: "Administrator Sinar Tani", username: "admin", password: hashedAdmin, role: "admin", is_approved: 1 });
    
    const hashedOfficer = bcrypt.hashSync("petugas123", 10);
    await User.create({ fullname: "Petugas Lapangan", username: "petugas", password: hashedOfficer, role: "petugas", is_approved: 1 });

    const articleCount = await Article.countDocuments();
    if (articleCount === 0) {
      await Article.create([
        { title: "Teknik Menanam Padi Organik", category: "Budidaya", content: "Langkah-langkah menanam padi tanpa pestisida kimia...", image: "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800" },
        { title: "Mengenal Hama Wereng Batang Cokelat", category: "Hama", content: "Wereng batang cokelat adalah salah satu hama utama padi...", image: "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=800" },
        { title: "Manajemen Air Sawah yang Efisien", category: "Teknis", content: "Cara mengatur irigasi agar tanaman tumbuh optimal...", image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800" }
      ]);
    }

    const reportCount = await Report.countDocuments();
    if (reportCount === 0) {
      await Report.create([
        { user_id: petani1._id, desa: "Desa Karanganyar", kec: "Kec. Kebumen", hama: "Tikus", status: "Waspada", lat: -7.67, lon: 109.65 },
        { user_id: petani1._id, desa: "Desa Panjer", kec: "Kec. Kebumen", hama: "Wereng", status: "Bahaya", lat: -7.68, lon: 109.66 }
      ]);
    }
    console.log("✅ Dummy data seeded");
  }
}
initDB();

const app = express();
const httpServer = createHttpServer(app);
const io = new Server(httpServer, { cors: { origin: "*", methods: ["GET", "POST"] } });

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel /tmp limitation for multer
// --- KONFIGURASI CLOUDINARY ---
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "sinartani-uploads", // Nama folder yang akan otomatis terbuat di Cloudinary
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
  } as any,
});

const upload = multer({ storage });

// --- API ROUTES ---
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  
  if (!user || user.is_approved === 0) return res.status(401).json({ error: "Akun tidak valid atau belum disetujui" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Username atau password salah" });

  const userObj = user.toObject();
  delete userObj.password;
  res.json(userObj);
});

app.post("/api/register", async (req, res) => {
  const { fullname, username, password, role = 'petani' } = req.body;
  try {
    const hashed = bcrypt.hashSync(password, 10);
    await User.create({ fullname, username, password: hashed, role, is_approved: role === 'admin' ? 0 : 1 });
    res.json({ success: true, message: "Pendaftaran berhasil" });
  } catch (err) {
    res.status(400).json({ error: "Username sudah digunakan" });
  }
});

app.get("/api/admin/pending-users", async (req, res) => {
  const users = await User.find({ is_approved: 0 }).select("-password");
  res.json(users);
});

app.post("/api/admin/approve-user/:id", async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { is_approved: 1 });
  res.json({ success: true });
});

app.get("/api/articles", async (req, res) => {
  const articles = await Article.find().sort("-created_at");
  res.json(articles);
});

app.patch("/api/profile/:id", async (req, res) => {
  const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select("-password");
  res.json(updatedUser);
});

app.get("/api/reports", async (req, res) => {
  const reports = await Report.find().populate("user_id", "fullname").sort("-created_at");
  // Mapping agar sesuai dengan format frontend lama
  const mappedReports = reports.map(r => ({
    ...r.toObject(),
    user_name: (r.user_id as any)?.fullname
  }));
  res.json(mappedReports);
});

app.post("/api/reports", upload.single("foto"), async (req: any, res) => {
  // Cloudinary menyimpan URL gambar di req.file.path
  const fotoUrl = req.file ? req.file.path : null; 
  const data = { ...req.body, foto: fotoUrl };
  
  const report = await Report.create(data);
  
  if (req.body.status === 'Bahaya') {
    io.emit("notification", { id: Date.now().toString(), title: "Radar Hama: BAHAYA!", message: `Laporan baru...` });
  }
  io.emit("data_updated", { type: "reports" });
  res.json({ success: true, id: report._id });
});

app.patch("/api/reports/:id/verify", async (req, res) => {
  await Report.findByIdAndUpdate(req.params.id, { is_verified: 1 });
  io.emit("data_updated", { type: "reports" });
  res.json({ success: true });
});

app.get("/api/products", async (req, res) => {
  const products = await Product.find().populate("user_id", "fullname").sort("-created_at");
  const mappedProducts = products.map(p => ({
    ...p.toObject(),
    seller_name: (p.user_id as any)?.fullname
  }));
  res.json(mappedProducts);
});

app.post("/api/products", upload.single("photo"), async (req: any, res) => {
  const photoUrl = req.file ? req.file.path : null;
  const data = { ...req.body, photo: photoUrl };
  
  await Product.create(data);
  io.emit("data_updated", { type: "products" });
  res.json({ success: true });
});

app.get("/api/farms/:userId", async (req, res) => {
  const farms = await Farm.find({ user_id: req.params.userId });
  res.json(farms);
});

app.post("/api/farms", async (req, res) => {
  const harvest = new Date(req.body.planting_date);
  harvest.setDate(harvest.getDate() + parseInt(req.body.duration));
  await Farm.create({ ...req.body, estimated_harvest_date: harvest });
  io.emit("data_updated", { type: "farms" });
  res.json({ success: true });
});

app.get("/api/bantuan/:userId", async (req, res) => {
  const proposals = await BantuanProposal.find({ user_id: req.params.userId });
  res.json(proposals);
});

app.post("/api/bantuan", async (req, res) => {
  await BantuanProposal.create(req.body);
  io.emit("data_updated", { type: "bantuan" });
  res.json({ success: true });
});

app.patch("/api/bantuan/:id", async (req, res) => {
  const proposal = await BantuanProposal.findByIdAndUpdate(req.params.id, { status: req.body.status });
  io.emit("data_updated", { type: "bantuan", user_id: proposal?.user_id });
  res.json({ success: true });
});

app.post("/api/articles", upload.single("image"), async (req: any, res) => {
  const imageUrl = req.file ? req.file.path : null;
  const data = { ...req.body, image: imageUrl };
  
  await Article.create(data);
  res.json({ success: true });
});

app.get("/api/tasks/:officerId", async (req, res) => {
  const tasks = await Task.find({ officer_id: req.params.officerId }).sort("-created_at");
  res.json(tasks);
});

app.get("/api/tasks", async (req, res) => {
  const tasks = await Task.find().populate("officer_id", "fullname").sort("-created_at");
  const mappedTasks = tasks.map(t => ({
    ...t.toObject(),
    officer_name: (t.officer_id as any)?.fullname
  }));
  res.json(mappedTasks);
});

app.post("/api/tasks", async (req, res) => {
  await Task.create(req.body);
  io.emit("data_updated", { type: "tasks" });
  res.json({ success: true });
});

app.patch("/api/tasks/:id", async (req, res) => {
  await Task.findByIdAndUpdate(req.params.id, { status: req.body.status });
  io.emit("data_updated", { type: "tasks" });
  res.json({ success: true });
});

app.get("/api/officers", async (req, res) => {
  const officers = await User.find({ role: { $in: ['petugas', 'admin'] } }).select("-password");
  res.json(officers);
});

// --- VITE & SERVER HANDLING ---
// --- SERVER HANDLING LOKAL ---
// Jalankan server di port 3000 HANYA jika berjalan di komputer lokal
if (process.env.NODE_ENV !== "production") {
  httpServer.listen(3000, "0.0.0.0", () => {
    console.log(`🚀 Server API berjalan di http://localhost:3000`);
  });
}

// EKSPOR APP AGAR BISA DIBACA OLEH VERCEL SERVERLESS
export default app;
