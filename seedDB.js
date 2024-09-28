const sqlite3 = require('sqlite3').verbose();
const slugify = require('slugify');  // You'll need to install the slugify package

const db = new sqlite3.Database('./voyage.db');

// Generate slugs using slugify
const generateSlug = (name) => slugify(name, { lower: true, strict: true });

db.serialize(() => {
    // Seed Users
    db.run(`INSERT INTO users (name, email, password) VALUES 
        ('John Doe', 'john@example.com', 'password1'),
        ('Jane Doe', 'jane@example.com', 'password2'),
        ('Sam Smith', 'sam@example.com', 'password3'),
        ('Alice Johnson', 'alice@example.com', 'password4'),
        ('Bob Brown', 'bob@example.com', 'password5')`
    );

    // Seed Suites with amenities and slugs
    db.run(`INSERT INTO suites (name, description, price_per_night, images, slug, bed, rooms, bathroom, wifi, dining) VALUES 
        ('Grand Horizon Suite', 'Luxurious suite with ocean view', 500.00, '["images/pool.jpg", "images/room-bed.jpg"]', '${generateSlug("Grand Horizon Suite")}', '1 King-sized bed', 2, '1 Bathroom with Jacuzzi', 'Complimentary Wi-Fi', 'In-room dining service'),
        ('Opal Serenity Suite', 'Elegant suite with garden view', 300.00, '["images/room-windows.jpg", "images/room-pool.jpg"]', '${generateSlug("Opal Serenity Suite")}', '2 Queen-sized beds', 1, '1 Bathroom with shower', 'Complimentary Wi-Fi', 'In-room dining service'),
        ('Azure Sky Suite', 'Spacious suite with city view', 400.00, '["images/spa1.jpg", "images/event.jpg"]', '${generateSlug("Azure Sky Suite")}', '1 King-sized bed', 3, '1 Bathroom with bathtub', 'Complimentary Wi-Fi', 'In-room dining service'),
        ('Elysian Retreat Suite', 'Private retreat with luxury amenities', 600.00, '["images/hotelroom.jpg", "images/room-bed.jpg"]', '${generateSlug("Elysian Retreat Suite")}', '1 King-sized bed', 2, '1 Bathroom with Jacuzzi', 'Complimentary Wi-Fi', 'In-room dining service'),
        ('Golden Sand Suite', 'Beachfront suite with direct access to the sea', 700.00, '["images/room-pool.jpg", "images/spa2.jpeg"]', '${generateSlug("Golden Sand Suite")}', '2 Queen-sized beds', 2, '2 Bathrooms with shower', 'Complimentary Wi-Fi', 'In-room dining service')`
    );

    // Seed Bookings
    db.run(`INSERT INTO bookings (user_id, suite_id, full_name, email, phone, guests, special_requests, check_in, check_out) VALUES 
        (1, 1, 'John Doe', 'john@example.com', '1234567890', 2, 'No special requests', '2024-10-01', '2024-10-05'),
        (2, 3, 'Jane Doe', 'jane@example.com', '2345678901', 3, 'Request for extra pillows', '2024-10-10', '2024-10-15'),
        (3, 2, 'Sam Smith', 'sam@example.com', '3456789012', 1, 'Vegetarian food', '2024-11-01', '2024-11-07'),
        (4, 5, 'Alice Johnson', 'alice@example.com', '4567890123', 2, 'Sea view room preferred', '2024-09-15', '2024-09-18'),
        (5, 4, 'Bob Brown', 'bob@example.com', '5678901234', 4, 'Family room requested', '2024-12-01', '2024-12-05')`
    );

    // Seed Menu Items
    db.run(`INSERT INTO menu_items (name, description, price, category, image) VALUES 
        ('Bruschetta', 'Toasted bread with tomatoes and basil', 8.00, 'Appetizer', 'brischetta1.jpeg'),
        ('Stuffed Mushrooms', 'Mushrooms filled with savory cheese', 9.00, 'Appetizer', 'stuffedmushrooms.webp'),
        ('Spring Rolls', 'Crispy rolls with vegetables and dipping sauce', 7.00, 'Appetizer', 'spring-rolls.jpg'),
        ('Grilled Chicken', 'Grilled chicken with vegetables', 15.00, 'Main Course', 'grilled-chicken.jpg'),
        ('Beef Stroganoff', 'Beef in creamy mushroom sauce', 18.00, 'Main Course', 'beef-stroganoff.jpg'),
        ('Vegetable Stir-Fry', 'Fresh vegetables stir-fried with soy sauce', 14.00, 'Main Course', 'veg-stir-fry.jpg'),
        ('Chicken Alfredo', 'Creamy pasta with grilled chicken', 16.00, 'Main Course', 'food-plate.jpg'),
        ('Salmon Filet', 'Pan-seared salmon with lemon butter sauce', 19.00, 'Main Course', 'food-plate.jpg'),
        ('Lamb Chops', 'Grilled lamb chops with mint sauce', 20.00, 'Main Course', 'food-plate.jpg'),
        ('Chocolate Cake', 'Rich and moist chocolate cake', 6.00, 'Dessert', 'choccake.jpeg'),
        ('Cheesecake', 'Creamy cheesecake with graham cracker crust', 7.00, 'Dessert', 'cheesecake.jpg'),
        ('Apple Pie', 'Classic apple pie with vanilla ice cream', 5.00, 'Dessert', 'Apple-Pie.jpeg')`
    );

    // Seed Events
    db.run(`INSERT INTO events (name, date, time, description, image, category) VALUES 
        ('Gala Dinner', '2024-12-10', '7:00 PM', 'Luxurious dinner with live entertainment', 'event1.png', 'Upcoming'),
        ('Christmas Brunch', '2024-12-25', '11:00 AM', 'Festive brunch with seasonal dishes', 'event2.png', 'Upcoming'),
        ('New Year\'s Eve Party', '2024-12-31', '9:00 PM', 'Exclusive New Year party with music and dancing', 'event3.png', 'Upcoming'),
        ('Summer Festival', '2024-07-15', '3:00 PM', 'A vibrant summer festival with live music and food stalls', 'event4.png', 'Past'),
        ('Wine Tasting', '2024-08-20', '6:00 PM', 'Evening of fine wines and gourmet cheese', 'event5.png', 'Past'),
        ('Charity Auction', '2024-09-30', '7:00 PM', 'Charity auction to benefit local organizations', 'event6.png', 'Past')`
    );

    console.log("Database seeded with sample data");
});

db.close();
