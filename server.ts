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
  `);

  // Create or update default admin and officer
  const admin = db.prepare("SELECT * FROM users WHERE username = ?").get("admin") as any;
  const hashedAdmin = bcrypt.hashSync("admin123", 10);
  if (!admin) {
    db.prepare("INSERT INTO users (fullname, username, password, role) VALUES (?, ?, ?, ?)").run(
      "Administrator Sinar Tani",
      "admin",
      hashedAdmin,
      "admin"
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
      const hashed = bcrypt.hashSync(password, 10);
      db.prepare("INSERT INTO users (fullname, username, password, role) VALUES (?, ?, ?, ?)").run(
        fullname,
        username,
        hashed,
        role
      );
      res.json({ success: true });
    } catch (err) {
      res.status(400).json({ error: "Username sudah digunakan" });
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
