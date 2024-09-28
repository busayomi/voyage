const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./voyage.db');

db.serialize(() => {
    db.run('DELETE FROM users');
    db.run('DELETE FROM bookings');
    db.run('DELETE FROM menu_items');
    db.run('DELETE FROM events');
    db.run('DELETE FROM suites');

    console.log("All tables have been cleared.");
});

db.close();
