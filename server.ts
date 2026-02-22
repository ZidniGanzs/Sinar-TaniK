import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "http";
import { Server } from "socket.io";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";
import cors from "cors";
import morgan from "morgan";

const db = new Database("sinartani.db");

// Initialize Database
function initDB() {
  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullname TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'petani',
      photo TEXT,
      bio TEXT,
      phone TEXT,
      preferred_crops TEXT,
      farming_practices TEXT,
      is_approved INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      desa TEXT,
      kec TEXT,
      hama TEXT,
      status TEXT,
      lat REAL,
      lon REAL,
      foto TEXT,
      is_verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      product_name TEXT,
      price REAL,
      description TEXT,
      seller_phone TEXT,
      photo TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      category TEXT,
      content TEXT,
      video_url TEXT,
      image TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS farms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      name TEXT,
      commodity TEXT,
      variety TEXT,
      area REAL,
      modal_awal REAL,
      planting_date DATE,
      estimated_harvest_date DATE,
      total_pendapatan REAL DEFAULT 0,
      status TEXT DEFAULT 'aktif',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER,
      category TEXT,
      item_name TEXT,
      quantity REAL,
      unit TEXT,
      price_per_unit REAL,
      date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farm_id) REFERENCES farms(id)
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      farm_id INTEGER,
      type TEXT,
      title TEXT,
      date DATE,
      time TEXT,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(farm_id) REFERENCES farms(id)
    );

    CREATE TABLE IF NOT EXISTS bantuan_proposals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      type TEXT,
      amount TEXT,
      reason TEXT,
      status TEXT DEFAULT 'Menunggu',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      officer_id INTEGER,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'Pending',
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(officer_id) REFERENCES users(id)
    );
  `);

  // Migrate existing users table if needed
  try {
    db.exec("ALTER TABLE users ADD COLUMN preferred_crops TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN farming_practices TEXT");
  } catch (e) {}
  try {
    db.exec("ALTER TABLE users ADD COLUMN is_approved INTEGER DEFAULT 1");
  } catch (e) {}

  // Seed Dummy Data if empty
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get() as any;
  if (userCount.count === 0 || (userCount.count <= 2)) {
    // Default admin and officer are handled below, but let's add some farmers
    const hashedPass = bcrypt.hashSync("petani123", 10);
    db.prepare("INSERT INTO users (fullname, username, password, role, is_approved) VALUES (?, ?, ?, ?, ?)").run(
      "Budi Setiawan", "budi", hashedPass, "petani", 1
    );
    db.prepare("INSERT INTO users (fullname, username, password, role, is_approved) VALUES (?, ?, ?, ?, ?)").run(
      "Siti Aminah", "siti", hashedPass, "petani", 1
    );
  }

  const articleCount = db.prepare("SELECT COUNT(*) as count FROM articles").get() as any;
  if (articleCount.count === 0) {
    db.prepare("INSERT INTO articles (title, category, content, image) VALUES (?, ?, ?, ?)").run(
      "Teknik Menanam Padi Organik", "Budidaya", "Langkah-langkah menanam padi tanpa pestisida kimia...", "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?w=800"
    );
    db.prepare("INSERT INTO articles (title, category, content, image) VALUES (?, ?, ?, ?)").run(
      "Mengenal Hama Wereng Batang Cokelat", "Hama", "Wereng batang cokelat adalah salah satu hama utama padi...", "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?w=800"
    );
    db.prepare("INSERT INTO articles (title, category, content, image) VALUES (?, ?, ?, ?)").run(
      "Manajemen Air Sawah yang Efisien", "Teknis", "Cara mengatur irigasi agar tanaman tumbuh optimal...", "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800"
    );
  }

  const reportCount = db.prepare("SELECT COUNT(*) as count FROM reports").get() as any;
  if (reportCount.count === 0) {
    db.prepare("INSERT INTO reports (user_id, desa, kec, hama, status, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      1, "Desa Karanganyar", "Kec. Kebumen", "Tikus", "Waspada", -7.67, 109.65
    );
    db.prepare("INSERT INTO reports (user_id, desa, kec, hama, status, lat, lon) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
      1, "Desa Panjer", "Kec. Kebumen", "Wereng", "Bahaya", -7.68, 109.66
    );
  }

  // Create or update default admin and officer
  const admin = db.prepare("SELECT * FROM users WHERE username = ?").get("admin") as any;
  const hashedAdmin = bcrypt.hashSync("admin123", 10);
  if (!admin) {
    db.prepare("INSERT INTO users (fullname, username, password, role, is_approved) VALUES (?, ?, ?, ?, ?)").run(
      "Administrator Sinar Tani",
      "admin",
      hashedAdmin,
      "admin",
      1
    );
    console.log("Default admin created.");
  }

  const officer = db.prepare("SELECT * FROM users WHERE username = ?").get("petugas") as any;
  const hashedOfficer = bcrypt.hashSync("petugas123", 10);
  if (!officer) {
    db.prepare("INSERT INTO users (fullname, username, password, role) VALUES (?, ?, ?, ?)").run(
      "Petugas Lapangan",
      "petugas",
      hashedOfficer,
      "petugas"
    );
    console.log("Default officer created.");
  }
}

initDB();

async function startServer() {
  const app = express();
  const httpServer = createHttpServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);
    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Multer setup
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const dir = "public/uploads";
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage });

  // --- API ROUTES ---

  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    console.log(`Login attempt for username: ${username}`);
    
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    
    if (!user) {
      console.log(`User not found: ${username}`);
      return res.status(401).json({ error: "Username atau password salah" });
    }

    if (user.is_approved === 0) {
      return res.status(403).json({ error: "Akun Anda sedang menunggu persetujuan administrator" });
    }

    console.log(`User found. Comparing passwords...`);
    try {
      const match = bcrypt.compareSync(password, user.password);
      console.log(`Password match result: ${match}`);
      
      if (!match) {
        return res.status(401).json({ error: "Username atau password salah" });
      }

      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (err) {
      console.error("Bcrypt comparison error:", err);
      res.status(500).json({ error: "Terjadi kesalahan pada server" });
    }
  });

  app.post("/api/register", (req, res) => {
    const { fullname, username, password, role = 'petani' } = req.body;
    try {
      const isApproved = role === 'admin' ? 0 : 1;
      const hashed = bcrypt.hashSync(password, 10);
      db.prepare("INSERT INTO users (fullname, username, password, role, is_approved) VALUES (?, ?, ?, ?, ?)").run(
        fullname,
        username,
        hashed,
        role,
        isApproved
      );
      res.json({ success: true, message: role === 'admin' ? "Pendaftaran berhasil. Menunggu persetujuan admin." : "Pendaftaran berhasil." });
    } catch (err) {
      res.status(400).json({ error: "Username sudah digunakan" });
    }
  });

  // Admin approval routes
  app.get("/api/admin/pending-users", (req, res) => {
    const users = db.prepare("SELECT id, fullname, username, role, created_at FROM users WHERE is_approved = 0").all();
    res.json(users);
  });

  app.post("/api/admin/approve-user/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("UPDATE users SET is_approved = 1 WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.get("/api/articles", (req, res) => {
    const articles = db.prepare("SELECT * FROM articles ORDER BY created_at DESC").all();
    res.json(articles);
  });

  // Profile
  app.patch("/api/profile/:id", (req, res) => {
    const { id } = req.params;
    const { fullname, phone, bio, preferred_crops, farming_practices } = req.body;
    
    try {
      db.prepare(`
        UPDATE users 
        SET fullname = ?, phone = ?, bio = ?, preferred_crops = ?, farming_practices = ? 
        WHERE id = ?
      `).run(fullname, phone, bio, preferred_crops, farming_practices, id);
      
      const updatedUser = db.prepare("SELECT id, fullname, username, role, photo, bio, phone, preferred_crops, farming_practices FROM users WHERE id = ?").get(id);
      res.json(updatedUser);
    } catch (err) {
      console.error("Profile update error:", err);
      res.status(500).json({ error: "Gagal memperbarui profil" });
    }
  });

  // Reports (Radar Hama)
  app.get("/api/reports", (req, res) => {
    const reports = db.prepare(`
      SELECT r.*, u.fullname as user_name 
      FROM reports r 
      JOIN users u ON r.user_id = u.id 
      ORDER BY r.created_at DESC
    `).all();
    res.json(reports);
  });

  app.post("/api/reports", upload.single("foto"), (req: any, res) => {
    const { user_id, desa, kec, hama, status, lat, lon } = req.body;
    const foto = req.file ? "/uploads/" + req.file.filename : null;
    const result = db.prepare(`
      INSERT INTO reports (user_id, desa, kec, hama, status, lat, lon, foto) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, desa, kec, hama, status, lat, lon, foto);

    if (status === 'Bahaya') {
      io.emit("notification", {
        id: Date.now().toString(),
        title: "Radar Hama: BAHAYA!",
        message: `Laporan hama ${hama} di Desa ${desa}, Kec. ${kec} berstatus BAHAYA.`,
        type: "danger",
        created_at: new Date().toISOString(),
        read: false
      });
    }

    io.emit("data_updated", { type: "reports" });

    res.json({ success: true, id: result.lastInsertRowid });
  });

  // Add endpoint to verify report (for petugas/admin)
  app.patch("/api/reports/:id/verify", (req, res) => {
    const { id } = req.params;
    const { user_role } = req.body; // In a real app, this would be from a session/token

    if (user_role !== 'petugas' && user_role !== 'admin') {
      return res.status(403).json({ error: "Akses ditolak" });
    }

    db.prepare("UPDATE reports SET is_verified = 1 WHERE id = ?").run(id);
    
    io.emit("data_updated", { type: "reports" });
    
    res.json({ success: true });
  });

  // Pasar Tani
  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, u.fullname as seller_name 
      FROM products p 
      JOIN users u ON p.user_id = u.id 
      ORDER BY p.created_at DESC
    `).all();
    res.json(products);
  });

  app.post("/api/products", upload.single("photo"), (req: any, res) => {
    const { user_id, product_name, price, description, seller_phone } = req.body;
    const photo = req.file ? "/uploads/" + req.file.filename : null;
    db.prepare(`
      INSERT INTO products (user_id, product_name, price, description, seller_phone, photo) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user_id, product_name, price, description, seller_phone, photo);
    
    io.emit("data_updated", { type: "products" });
    
    res.json({ success: true });
  });

  // Kalkulator Tani
  app.get("/api/farms/:userId", (req, res) => {
    const farms = db.prepare("SELECT * FROM farms WHERE user_id = ?").all(req.params.userId);
    res.json(farms);
  });

  app.post("/api/farms", (req, res) => {
    const { user_id, name, commodity, variety, area, modal_awal, planting_date, duration } = req.body;
    const planting = new Date(planting_date);
    const harvest = new Date(planting);
    harvest.setDate(planting.getDate() + parseInt(duration));
    const estimated_harvest_date = harvest.toISOString().split("T")[0];
    
    db.prepare(`
      INSERT INTO farms (user_id, name, commodity, variety, area, modal_awal, planting_date, estimated_harvest_date) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(user_id, name, commodity, variety, area, modal_awal, planting_date, estimated_harvest_date);
    
    io.emit("data_updated", { type: "farms", user_id });
    
    res.json({ success: true });
  });

  // Bantuan
  app.get("/api/bantuan/:userId", (req, res) => {
    const proposals = db.prepare("SELECT * FROM bantuan_proposals WHERE user_id = ?").all(req.params.userId);
    res.json(proposals);
  });

  app.post("/api/bantuan", (req, res) => {
    const { user_id, type, amount, reason } = req.body;
    db.prepare(`
      INSERT INTO bantuan_proposals (user_id, type, amount, reason) 
      VALUES (?, ?, ?, ?)
    `).run(user_id, type, amount, reason);
    
    // Notify admins about new proposal
    io.emit("notification", {
      id: Date.now().toString(),
      title: "Pengajuan Bantuan Baru",
      message: `Ada pengajuan bantuan baru tipe ${type} sebesar ${amount}.`,
      type: "info",
      created_at: new Date().toISOString(),
      read: false
    });

    io.emit("data_updated", { type: "bantuan", user_id });

    res.json({ success: true });
  });

  // Add endpoint to update proposal status (for admin)
  app.patch("/api/bantuan/:id", (req, res) => {
    const { status } = req.body;
    const { id } = req.params;
    
    const proposal = db.prepare("SELECT * FROM bantuan_proposals WHERE id = ?").get(id) as any;
    if (!proposal) return res.status(404).json({ error: "Proposal tidak ditemukan" });

    db.prepare("UPDATE bantuan_proposals SET status = ? WHERE id = ?").run(status, id);

    // Notify the specific user
    io.emit("notification", {
      id: Date.now().toString(),
      title: "Update Status Bantuan",
      message: `Pengajuan bantuan Anda (${proposal.type}) telah ${status.toLowerCase()}.`,
      type: status === 'Disetujui' ? 'success' : 'warning',
      created_at: new Date().toISOString(),
      read: false,
      target_user_id: proposal.user_id // Frontend can filter this
    });

    io.emit("data_updated", { type: "bantuan", user_id: proposal.user_id });

    res.json({ success: true });
  });

  // Add endpoint for articles (to demonstrate new content notification)
  app.post("/api/articles", upload.single("image"), (req: any, res) => {
    const { title, category, content, video_url } = req.body;
    const image = req.file ? "/uploads/" + req.file.filename : null;
    
    db.prepare(`
      INSERT INTO articles (title, category, content, video_url, image) 
      VALUES (?, ?, ?, ?, ?)
    `).run(title, category, content, video_url, image);

    io.emit("notification", {
      id: Date.now().toString(),
      title: "Edukasi Tani Baru",
      message: `Artikel baru diterbitkan: ${title}`,
      type: "info",
      created_at: new Date().toISOString(),
      read: false
    });

    res.json({ success: true });
  });

  // Tasks
  app.get("/api/tasks/:officerId", (req, res) => {
    const tasks = db.prepare("SELECT * FROM tasks WHERE officer_id = ? ORDER BY created_at DESC").all(req.params.officerId);
    res.json(tasks);
  });

  app.get("/api/tasks", (req, res) => {
    const tasks = db.prepare(`
      SELECT t.*, u.fullname as officer_name 
      FROM tasks t 
      JOIN users u ON t.officer_id = u.id 
      ORDER BY t.created_at DESC
    `).all();
    res.json(tasks);
  });

  app.post("/api/tasks", (req, res) => {
    const { officer_id, title, description, due_date } = req.body;
    db.prepare(`
      INSERT INTO tasks (officer_id, title, description, due_date) 
      VALUES (?, ?, ?, ?)
    `).run(officer_id, title, description, due_date);
    
    io.emit("notification", {
      id: Date.now().toString(),
      title: "Tugas Baru",
      message: `Anda mendapatkan tugas baru: ${title}`,
      type: "info",
      created_at: new Date().toISOString(),
      read: false,
      target_user_id: officer_id
    });

    io.emit("data_updated", { type: "tasks", officer_id });
    res.json({ success: true });
  });

  app.patch("/api/tasks/:id", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, req.params.id);
    
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id) as any;
    io.emit("data_updated", { type: "tasks", officer_id: task.officer_id });
    res.json({ success: true });
  });

  // Get all officers for task assignment
  app.get("/api/officers", (req, res) => {
    const officers = db.prepare("SELECT id, fullname, username FROM users WHERE role = 'petugas' OR role = 'admin'").all();
    res.json(officers);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
    app.get("*", (req, res) => res.sendFile(path.resolve("dist/index.html")));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
