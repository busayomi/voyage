const express = require('express');
const multer = require('multer'); // To handle file uploads
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./voyage.db');

const session = require('express-session');
const flash = require('connect-flash');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator'); 

const app = express();

// Session setup
app.use(session({
    secret: 'your_secret_key',  
    resave: false,
    saveUninitialized: true,
}));

// Middleware for flash messages
app.use(flash());

// Middleware to pass flash messages to the views
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json()); // Middleware to parse JSON
app.set('view engine', 'ejs');

app.use(express.static('public'));


// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));  // Save file with unique name
    }
});

const upload = multer({ storage });


// Home route
app.get('/', (req, res) => {
    res.render('index');
});

// REGISTRATION _____------------------------

// Route to load the registration page (GET)
app.get('/register', (req, res) => {
    res.render('register', { errors: [], name: '', email: '', password: '', confirmPassword: '' });  
});
// app.get('/register', (req, res) => res.render('register'));

// Route (POST) to register the user information filled in the form
app.post('/register-user', (req, res) => {
    const { name, email, password, confirmPassword } = req.body;
    let errors = [];
    if (!name || !email || !password || !confirmPassword) {
        errors.push({ msg: 'Please fill in all fields' });
    }
    if (password !== confirmPassword) {
        errors.push({ msg: 'Passwords do not match' });
    }
    if (password.length < 6) {
        errors.push({ msg: 'Password should be at least 6 characters' });
    }

    if (errors.length > 0) {
        res.render('register', { errors, name, email, password, confirmPassword });
    } else {
        db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
            if (user) {
                errors.push({ msg: 'Email is already registered' });
                res.render('register', { errors, name, email, password, confirmPassword });
            } else {
                // Hash the password
                bcrypt.hash(password, 10, (err, hash) => {
                    if (err) throw err;
                    db.run('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hash], (err) => {
                        if (err) throw err;
                        req.flash('success_msg', 'You are now registered and can log in');
                        res.redirect('/login');
                    });
                });
            }
        });
    }
});

// LOGIN -----------------------------------------

// Route to load the login page (GET)
app.get('/login', (req, res) => {
    res.render('login');  
});

app.post('/login-user', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
        if (!user) {
            req.flash('error_msg', 'Invalid email or password');
            return res.redirect('/login');
        }

        // Compare the hashed password
        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) throw err;

            if (isMatch) {
                req.session.user = user;  
                req.flash('success_msg', 'You are now logged in');
                res.redirect('/');
            } else {
                req.flash('error_msg', 'Invalid email or password');
                res.redirect('/login');
            }
        });
    });
});

// LOGOUT -------------------------------------------------------------------------------------------

// Logout Route
// app.get('/logout', (req, res) => {
//     req.session.destroy((err) => {
//         if (err) throw err;
//         req.flash('success_msg', 'You are logged out');
//         res.redirect('/login');
//     });
// });

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error("Error logging out:", err);
            return res.status(500).send("Error logging out");
        }
        res.redirect('/login');  
    });
});

// Middleware to check if user is authenticated 
function ensureAuthenticated(req, res, next) {
    if (req.session.user) {
        return next();
    }
    req.flash('error_msg', 'Please log in to view this resource');
    res.redirect('/login');
}

// PROFILE PAGE -------------------------------------------------------------------------------------------
app.get('/profile', ensureAuthenticated, (req, res) => {
    const userId = req.session.user.id;  
    const bookingsQuery = `
        SELECT bookings.*, suites.name AS suite_name, suites.price_per_night 
        FROM bookings 
        JOIN suites ON bookings.suite_id = suites.id 
        WHERE bookings.user_id = ?
    `;
    
    db.all(bookingsQuery, [userId], (err, bookings) => {
        if (err) {
            console.error("Error fetching user bookings:", err);
            return res.status(500).send("Error retrieving user bookings.");
        }

        res.render('profile', {
            user: req.session.user,
            bookings: bookings  
        });
    });
});

// SUITES -------------------------------------------------------------------------------------------
// app.get('/suites', (req, res) => {
//     const query = "SELECT * FROM suites";
  
//     db.all(query, [], (err, rows) => {
//         if (err) {
//             console.error("Error retrieving suites:", err);
//             res.status(500).send("Internal Server Error");
//         } else {
//             res.render('suites', { suites: rows });
//         }
//     });
// });

app.get('/suites', (req, res) => {
    const searchTerm = req.query.search || '';  

    const query = searchTerm 
        ? `SELECT * FROM suites WHERE name LIKE ?` 
        : `SELECT * FROM suites`;

    const params = searchTerm ? [`%${searchTerm}%`] : [];

    db.all(query, params, (err, rows) => {
        if (err) {
            console.error("Error retrieving suites:", err);
            res.status(500).send("Internal Server Error");
        } else {
            res.render('suites', { suites: rows, searchTerm }); 
        }
    });
});
// Search Route 
app.get('/suites/search', (req, res) => {
    const searchTerm = req.query.query ? `%${req.query.query}%` : '%';

    const query = `SELECT * FROM suites WHERE name LIKE ?`;

    db.all(query, [searchTerm], (err, suites) => {
        if (err) {
            console.error("Error retrieving suites:", err);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        res.json({ suites });
    });
});

// Single Suite Page
app.get('/suites/:id', (req, res) => {
    const id = req.params.id;

    db.get('SELECT * FROM suites WHERE id = ?', [id], (err, suite) => {
        if (err) {
            return res.status(500).send("Error retrieving suite details");
        }
        if (!suite) {
            return res.status(404).send("Suite not found");
        }

        res.render('single-suite', { suite });
    });
});

app.get('/create-suite', ensureAuthenticated, (req, res) => {
    res.render('create-suite', { user: req.session.user });
});

app.post('/add-suite', upload.array('images', 5), ensureAuthenticated, (req, res) => {
    const { name, description, price } = req.body;
    const images = JSON.stringify(req.files.map(file => `/images/${file.filename}`));

    const query = `INSERT INTO suites (name, description, price_per_night, images, slug) VALUES (?, ?, ?, ?, ?)`;
    const slug = name.toLowerCase().replace(/\s+/g, '-');

    db.run(query, [name, description, price, images, slug], function(err) {
        if (err) {
            return res.status(500).send('Error adding suite');
        }
        res.redirect('/suites');
    });
});

// DINING AND MENU -------------------------------------------------------------------------------------------

app.get('/dining', (req, res) => {
    const query = `SELECT * FROM menu_items`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error("Error fetching menu items:", err);
            res.status(500).send("Internal Server Error");
        } else {
            const appetizers = rows.filter(item => item.category === 'Appetizer');
            const mainCourses = rows.filter(item => item.category === 'Main Course');
            const desserts = rows.filter(item => item.category === 'Dessert');

            res.render('dining', { appetizers, mainCourses, desserts });
        }
    });
});

app.get('/create-menu-item', ensureAuthenticated, (req, res) => {
    res.render('create-menu-item', { user: req.session.user });
});

app.post('/add-menu-item', upload.single('image'), ensureAuthenticated, (req, res) => {
    const { name, description, price, category } = req.body;
    const image = `/images/${req.file.filename}`;

    const query = `INSERT INTO menu_items (name, description, price, category, image) VALUES (?, ?, ?, ?, ?)`;

    db.run(query, [name, description, price, category, image], function(err) {
        if (err) {
            return res.status(500).send('Error adding menu item');
        }
        res.redirect('/dining');
    });
});

// CONTACT US ROUTES -------------------------------------------------------------------------------------------

app.get('/contact', (req, res) => {
    res.render('contact');
});

app.post('/submit-contact', (req, res) => {
    const { fullName, email, message } = req.body;

    const query = `INSERT INTO contact_requests (full_name, email, message) VALUES (?, ?, ?)`;

    db.run(query, [fullName, email, message], (err) => {
        if (err) {
            console.error("Error saving contact request:", err);
            res.status(500).send("Internal Server Error");
        } else {
            res.render('contact-success');
        }
    });
});

// EVENTS ROUTES -------------------------------------------------------------------------------------------

app.get('/events', (req, res) => {
    const query = `SELECT * FROM events ORDER BY date DESC`;

    db.all(query, [], (err, events) => {
        if (err) {
            console.error("Error retrieving events:", err);
            return res.status(500).send("Internal Server Error");
        }
        const currentDate = new Date().toISOString().split('T')[0];
        const upcomingEvents = events.filter(event => event.date >= currentDate);
        const pastEvents = events.filter(event => event.date < currentDate);

        res.render('events', { upcomingEvents, pastEvents });
    });
});



// Render Create Event Page
app.get('/create-event', ensureAuthenticated, (req, res) => {
    res.render('create-event', { user: req.session.user });
});

// Add Event (POST)
app.post('/add-event', upload.single('image'), ensureAuthenticated, (req, res) => {
    const { name, date, time, description } = req.body;
    const image = `/images/${req.file.filename}`;

    const query = `INSERT INTO events (name, date, time, description, image, category) VALUES (?, ?, ?, ?, ?, ?)`;
    const category = (new Date(date) > new Date()) ? 'Upcoming' : 'Past';

    db.run(query, [name, date, time, description, image, category], function(err) {
        if (err) {
            return res.status(500).send('Error adding event');
        }
        res.redirect('/events');
    });
});




// BOOKING ROUTES -------------------------------------------------------------------------------------------

// Booking Route (GET)
// app.get('/booking/:id', ensureAuthenticated, (req, res) => {
//     const id = req.params.id;

//     db.get('SELECT * FROM suites WHERE id = ?', [id], (err, suite) => {
//         if (err) {
//             return res.status(500).send("Error retrieving suite details");
//         }
//         if (!suite) {
//             return res.status(404).send("Suite not found");
//         }

//         res.render('booking-form', { suite });
//     });
// });
app.get('/booking/:id', ensureAuthenticated, (req, res) => {
    const id = req.params.id;

    db.get('SELECT * FROM suites WHERE id = ?', [id], (err, suite) => {
        if (err) {
            return res.status(500).send("Error retrieving suite details");
        }
        if (!suite) {
            return res.status(404).send("Suite not found");
        }
        res.render('booking-form', { user: req.session.user, suite });
    });
});

app.post('/submit-booking', ensureAuthenticated, (req, res) => {
    const { fullName, email, phone, checkIn, checkOut, guests, specialRequests, suite_id } = req.body;
    const userId = req.session.user.id;  

    const insertBooking = `
        INSERT INTO bookings (full_name, email, phone, check_in, check_out, guests, special_requests, suite_id, user_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    db.run(insertBooking, [fullName, email, phone, checkIn, checkOut, guests, specialRequests, suite_id, userId], function(err) {
        if (err) {
            console.error("Error inserting booking data: ", err);
            res.status(500).send("Error processing booking");
        } else {
            db.get('SELECT * FROM suites WHERE id = ?', [suite_id], (err, suite) => {
                if (err || !suite) {
                    res.status(500).send("Error retrieving suite information");
                } else {
                    res.render('booking-success', { 
                        fullName, 
                        suite, 
                        checkIn, 
                        checkOut, 
                        guests, 
                        specialRequests 
                    });
                }
            });
        }
    });
});

app.get('/bookings-and-requests', ensureAuthenticated, (req, res) => {
    const bookingsQuery = `SELECT b.*, s.name AS suite_name FROM bookings b JOIN suites s ON b.suite_id = s.id`;
    const requestsQuery = `SELECT * FROM contact_requests`;

    db.all(bookingsQuery, [], (err, bookings) => {
        if (err) {
            return res.status(500).send('Error retrieving bookings');
        }

        db.all(requestsQuery, [], (err, contactRequests) => {
            if (err) {
                return res.status(500).send('Error retrieving contact requests');
            }

            res.render('bookings-and-requests', { bookings, contactRequests });
        });
    });
});

app.get('/view-bookings-requests', ensureAuthenticated, (req, res) => {
    const bookingsQuery = `
        SELECT bookings.id, bookings.full_name, bookings.email, bookings.phone, bookings.check_in, 
               bookings.check_out, bookings.guests, bookings.special_requests, suites.name AS suite_name
        FROM bookings
        JOIN suites ON bookings.suite_id = suites.id
    `;

    const requestsQuery = `SELECT * FROM contact_requests`;

    const usersQuery = `SELECT id, name, email FROM users`;

    db.all(bookingsQuery, [], (err, bookings) => {
        if (err) {
            console.error("Error retrieving bookings:", err);
            return res.status(500).send("Error retrieving bookings");
        } else {
            db.all(requestsQuery, [], (err, requests) => {
                if (err) {
                    console.error("Error retrieving contact requests:", err);
                    return res.status(500).send("Error retrieving contact requests");
                } else {
                    db.all(usersQuery, [], (err, users) => {
                        if (err) {
                            console.error("Error retrieving users:", err);
                            return res.status(500).send("Error retrieving users");
                        }

                        res.render('view-bookings-requests', { 
                            user: req.session.user, 
                            bookings, 
                            requests, 
                            users 
                        });
                    });
                }
            });
        }
    });
});




// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
