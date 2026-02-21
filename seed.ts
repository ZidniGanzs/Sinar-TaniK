import Database from "better-sqlite3";
import bcrypt from "bcryptjs";

const db = new Database("sinartani.db");

function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      fullname TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
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
}

function seed() {
  initDB();
  const hashed = bcrypt.hashSync("password123", 10);
  
  // Users
  const insertUser = db.prepare("INSERT OR IGNORE INTO users (fullname, username, password, role, phone, bio) VALUES (?, ?, ?, ?, ?, ?)");
  insertUser.run("Karto Wijoyo", "karto", hashed, "user", "08123456789", "Petani Padi asal Desa Karanganyar");
  insertUser.run("Siti Aminah", "siti", hashed, "user", "08987654321", "Penyuluh Pertanian");

  const karto = db.prepare("SELECT id FROM users WHERE username = 'karto'").get() as any;
  const siti = db.prepare("SELECT id FROM users WHERE username = 'siti'").get() as any;

  // Reports
  const insertReport = db.prepare("INSERT INTO reports (user_id, desa, kec, hama, status, lat, lon, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertReport.run(karto.id, "Karanganyar", "Kebumen", "Wereng Coklat", "Bahaya", -7.67, 109.65, 1);
  insertReport.run(siti.id, "Pejagoan", "Pejagoan", "Tikus Sawah", "Waspada", -7.66, 109.64, 1);

  // Products
  const insertProduct = db.prepare("INSERT INTO products (user_id, product_name, price, description, seller_phone) VALUES (?, ?, ?, ?, ?)");
  insertProduct.run(karto.id, "Beras IR64 Super", 12500, "Beras kualitas premium, pulen dan bersih.", "08123456789");
  insertProduct.run(karto.id, "Pupuk Organik Cair", 45000, "Pupuk alami untuk meningkatkan hasil panen.", "08123456789");

  // Farms
  const insertFarm = db.prepare("INSERT INTO farms (user_id, name, commodity, variety, area, modal_awal, planting_date, estimated_harvest_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insertFarm.run(karto.id, "Sawah Lor", "Padi", "Inpari 32", 1000, 2500000, "2026-01-15", "2026-05-15");
  insertFarm.run(karto.id, "Sawah Kidul", "Jagung", "Pioneer", 500, 1200000, "2026-02-01", "2026-05-10");

  // Bantuan
  const insertBantuan = db.prepare("INSERT INTO bantuan_proposals (user_id, type, amount, reason, status) VALUES (?, ?, ?, ?, ?)");
  insertBantuan.run(karto.id, "Bibit Padi", "50 Kg", "Untuk musim tanam kedua", "Disetujui");
  insertBantuan.run(karto.id, "Traktor", "1 Unit", "Kelompok tani membutuhkan alat pengolah tanah", "Menunggu");

  console.log("Database seeded successfully!");
}

seed();
