const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./voyage.db');

db.serialize(() => {
    db.run('PRAGMA foreign_keys = ON;');

    // Create Users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL
    )`);

    // Create the bookings table
    db.run(`CREATE TABLE IF NOT EXISTS bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        suite_id INTEGER NOT NULL,
        full_name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        guests INTEGER NOT NULL,
        special_requests TEXT,
        check_in TEXT NOT NULL,
        check_out TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (suite_id) REFERENCES suites(id) ON DELETE CASCADE
    )`);

    // Create the suites table
    db.run(`CREATE TABLE IF NOT EXISTS suites (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        price_per_night REAL NOT NULL,
        images TEXT,
        slug TEXT UNIQUE,
        bed TEXT,
        rooms INTEGER,
        bathroom TEXT,
        wifi TEXT,
        dining TEXT
    )`);

    // Create the menu items table
    db.run(`CREATE TABLE IF NOT EXISTS menu_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        price REAL NOT NULL,
        category TEXT NOT NULL,
        image TEXT  -- Stores image path
    )`);

    // Create the events table
    db.run(`CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        description TEXT,
        image TEXT,
        category TEXT  -- Upcoming or Past based on date
    )`);

    // Create contact requests table
    db.run(`CREATE TABLE IF NOT EXISTS contact_requests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        full_name TEXT,
        email TEXT,
        subject TEXT,
        message TEXT
    )`);

    console.log("Database tables created (or already exist).");
});

db.close();
