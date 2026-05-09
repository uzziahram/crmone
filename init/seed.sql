-- Sample Customers
INSERT INTO customers (full_name, email, password, contact_number, address) VALUES
('John Doe', 'john@example.com', 'password123', '123-456-7890', '123 Main St, New York, NY'),
('Jane Smith', 'jane@example.com', 'securepass', '987-654-3210', '456 Oak Ave, Los Angeles, CA'),
('Bob Johnson', 'bob@example.com', 'bobpass', '555-0199', '789 Pine Rd, Chicago, IL');

-- Sample Products
INSERT INTO products (product_name, sku, category, size, price, cost_price, stock_quantity, low_stock_alert) VALUES
('Professional Laptop', 'LAP-001', 'Electronics', '15-inch', 1200.00, 800.00, 15, 5),
('Wireless Mouse', 'MOU-002', 'Accessories', 'Small', 25.00, 10.00, 50, 10),
('Mechanical Keyboard', 'KEY-003', 'Accessories', 'Full-size', 85.00, 40.00, 30, 5),
('4K Monitor', 'MON-004', 'Electronics', '27-inch', 350.00, 200.00, 10, 3),
('Gaming Headset', 'HED-005', 'Accessories', 'Over-ear', 60.00, 30.00, 20, 5);

-- Sample Business Profile
INSERT INTO business_profile (company_name, address, contact_email, contact_phone, tax_id, currency) VALUES
('CRM One Solutions', '101 Tech Way, Silicon Valley, CA', 'contact@crmone.com', '800-555-0101', 'TX-987654321', 'USD');

-- Sample Orders
-- Order 1: John Doe (customer_id 1)
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(1, 1225.00, 0, 'delivered');

-- Order 2: Jane Smith (customer_id 2)
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(2, 350.00, 0, 'processing');

-- Order 3: John Doe (customer_id 1) - with a review/comment
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(1, 85.00, 0, 'delivered');

-- Sample Order Items
-- Items for Order 1
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(1, 1, 1, 1200.00, 800.00, 5, 'Excellent laptop, very fast!'),
(1, 2, 1, 25.00, 10.00, 4, 'Good mouse, but a bit small.');

-- Items for Order 2
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase) VALUES
(2, 4, 1, 350.00, 200.00);

-- Items for Order 3
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(3, 3, 1, 85.00, 40.00, 5, 'Best keyboard I have ever used.');

-- Sample Items in Cart
-- Bob Johnson (customer_id 3) has a headset in his cart
INSERT INTO in_cart (customer_id, product_id, quantity) VALUES
(3, 5, 1);

-- 10 More Customers
INSERT INTO customers (full_name, email, password, contact_number, address) VALUES
('Alice Williams', 'alice@example.com', 'pass123', '555-0101', '101 Apple St, Miami, FL'),
('Charlie Brown', 'charlie@example.com', 'pass123', '555-0102', '202 Berry Ln, Seattle, WA'),
('David Miller', 'david@example.com', 'pass123', '555-0103', '303 Cherry Ct, Austin, TX'),
('Eva Garcia', 'eva@example.com', 'pass123', '555-0104', '404 Date Dr, Denver, CO'),
('Frank Wilson', 'frank@example.com', 'pass123', '555-0105', '505 Elderberry Rd, Portland, OR'),
('Grace Lee', 'grace@example.com', 'pass123', '555-0106', '606 Fig St, Boston, MA'),
('Henry Ford', 'henry@example.com', 'pass123', '555-0107', '707 Grape Ave, Detroit, MI'),
('Ivy Chen', 'ivy@example.com', 'pass123', '555-0108', '808 Honeydew Ln, San Francisco, CA'),
('Jack Sparrow', 'jack@example.com', 'pass123', '555-0109', '909 Ivy Rd, Port Royal, FL'),
('Karen Smith', 'karen@example.com', 'pass123', '555-0110', '110 Juniper Blvd, Phoenix, AZ');

-- Orders for the 10 new customers (IDs 4 to 13)
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(4, 1200.00, 0, 'delivered'),
(5, 25.00, 0, 'delivered'),
(6, 85.00, 0, 'delivered'),
(7, 350.00, 0, 'delivered'),
(8, 60.00, 0, 'delivered'),
(9, 1285.00, 50, 'delivered'),
(10, 375.00, 0, 'delivered'),
(11, 410.00, 10, 'delivered'),
(12, 60.00, 0, 'delivered'),
(13, 1200.00, 0, 'delivered');

-- Order Items with Reviews for the new orders (Order IDs 4 to 13)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(4, 1, 1, 1200.00, 800.00, 5, 'Perfect for my design work.'),
(5, 2, 1, 25.00, 10.00, 3, 'Decent, but feels a bit plasticky.'),
(6, 3, 1, 85.00, 40.00, 5, 'The clicking sound is so satisfying!'),
(7, 4, 1, 350.00, 200.00, 4, 'Great colors, very sharp.'),
(8, 5, 1, 60.00, 30.00, 4, 'Good sound quality for the price.'),
(9, 1, 1, 1200.00, 800.00, 5, 'Premium feel, worth every penny.'),
(9, 3, 1, 85.00, 40.00, 4, 'Very solid keyboard.'),
(10, 4, 1, 350.00, 200.00, 5, 'Impressed with the build quality.'),
(10, 2, 1, 25.00, 10.00, 2, 'Stopped working after a week.'),
(11, 4, 1, 350.00, 200.00, 5, 'Excellent display.'),
(11, 5, 1, 60.00, 30.00, 3, 'Microphone could be better.'),
(12, 5, 1, 60.00, 30.00, 5, 'Really comfortable for long gaming sessions.'),
(13, 1, 1, 1200.00, 800.00, 4, 'Great performance, runs a bit hot.');

-- More Products
INSERT INTO products (product_name, sku, category, size, price, cost_price, stock_quantity, low_stock_alert) VALUES
('Ergonomic Chair', 'CHR-006', 'Office Furniture', 'Large', 250.00, 150.00, 10, 2),
('Standing Desk', 'DSK-007', 'Office Furniture', 'Adjustable', 450.00, 250.00, 5, 1),
('USB-C Hub', 'HUB-008', 'Accessories', 'Portable', 45.00, 15.00, 40, 5),
('Webcam 1080p', 'CAM-009', 'Home Office', 'Compact', 75.00, 35.00, 25, 5),
('Desk Lamp', 'LMP-010', 'Home Office', 'LED', 35.00, 15.00, 30, 5),
('HDMI Cable 2m', 'CBL-011', 'Cables', '2 meters', 15.00, 5.00, 100, 20),
('External SSD 1TB', 'SSD-012', 'Storage', 'Pocket-size', 120.00, 70.00, 20, 5),
('Portable Charger', 'PWR-013', 'Accessories', '10000mAh', 40.00, 18.00, 35, 10);

-- Orders for some of the new products
-- Customer 4 (Alice) buys a chair
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(4, 250.00, 0, 'delivered');
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(14, 6, 1, 250.00, 150.00, 5, 'My back feels so much better!');

-- Customer 5 (Charlie) buys a desk and a lamp
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(5, 485.00, 0, 'delivered');
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(15, 7, 1, 450.00, 250.00, 5, 'Very sturdy desk.'),
(15, 10, 1, 35.00, 15.00, 4, 'Bright light, nice design.');

-- Customer 6 (David) buys a webcam and a hub
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(6, 120.00, 0, 'delivered');
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(16, 9, 1, 75.00, 35.00, 4, 'Clear picture for meetings.'),
(16, 8, 1, 45.00, 15.00, 3, 'Gets a bit warm during use.');
