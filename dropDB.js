const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./voyage.db');

db.serialize(() => {
    db.run('DROP TABLE IF EXISTS users');
    db.run('DROP TABLE IF EXISTS bookings');
    db.run('DROP TABLE IF EXISTS menu_items');
    db.run('DROP TABLE IF EXISTS events');
    db.run('DROP TABLE IF EXISTS suites');

    console.log("All tables have been dropped.");
});

db.close();
