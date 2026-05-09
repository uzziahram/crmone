-- Sample Customers
INSERT INTO customers (full_name, email, password, contact_number, address) VALUES
('John Doe', 'john@example.com', 'password123', '123-456-7890', '123 Main St, New York, NY'),
('Jane Smith', 'jane@example.com', 'securepass', '987-654-3210', '456 Oak Ave, Los Angeles, CA'),
('Bob Johnson', 'bob@example.com', 'bobpass', '555-0199', '789 Pine Rd, Chicago, IL');

-- Sample Products
INSERT INTO products (product_name, sku, category, size, price, cost_price, stock_quantity, low_stock_alert, image_url) VALUES
('Classic White T-Shirt', 'TSH-001', 'Tops', 'Medium', 25.00, 10.00, 100, 20, '/productImages/Classic white tshirt.png'),
('Slim Fit Blue Jeans', 'JNS-002', 'Bottoms', '32x32', 60.00, 25.00, 50, 10, '/productImages/Slim Fit Blue Jeans.jpg'),
('Leather Biker Jacket', 'JKT-003', 'Outerwear', 'Large', 150.00, 70.00, 15, 5, '/productImages/Leather Biker Jacket.jpg'),
('Wool Blend Sweater', 'SWT-004', 'Tops', 'Large', 45.00, 20.00, 30, 5, '/productImages/Wool Blend Sweater.jpg'),
('Running Sneakers', 'SHO-005', 'Footwear', '10', 85.00, 40.00, 25, 5, '/productImages/Running Sneakers.jpg');

-- Sample Business Profile
INSERT INTO business_profile (company_name, address, contact_email, contact_phone, tax_id, currency) VALUES
('StyleOne Boutique', '101 Fashion Ave, New York, NY', 'contact@styleone.com', '800-555-0101', 'TX-987654321', 'USD');

-- Sample Orders
-- Order 1: John Doe (customer_id 1)
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(1, 85.00, 0, 'delivered');

-- Order 2: Jane Smith (customer_id 2)
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(2, 45.00, 0, 'processing');

-- Order 3: John Doe (customer_id 1) - with a review/comment
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(1, 150.00, 0, 'delivered');

-- Sample Order Items
-- Items for Order 1
-- John Doe buys a T-Shirt (25) and Blue Jeans (60)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(1, 1, 1, 25.00, 10.00, 5, 'Perfect fit and very comfortable cotton!'),
(1, 2, 1, 60.00, 25.00, 4, 'Great jeans, but slightly long.');

-- Items for Order 2
-- Jane Smith buys a Wool Blend Sweater (45)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase) VALUES
(2, 4, 1, 45.00, 20.00);

-- Items for Order 3
-- John Doe buys a Leather Biker Jacket (150)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(3, 3, 1, 150.00, 70.00, 5, 'High quality leather, looks amazing.');

-- Sample Items in Cart
-- Bob Johnson (customer_id 3) has Running Sneakers in his cart
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
(4, 25.00, 0, 'delivered'),
(5, 60.00, 0, 'delivered'),
(6, 150.00, 0, 'delivered'),
(7, 45.00, 0, 'delivered'),
(8, 85.00, 0, 'delivered'),
(9, 75.00, 10, 'delivered'),
(10, 105.00, 0, 'delivered'),
(11, 110.00, 0, 'delivered'),
(12, 85.00, 0, 'delivered'),
(13, 25.00, 0, 'delivered');

-- Order Items with Reviews for the new orders (Order IDs 4 to 13)
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(4, 1, 1, 25.00, 10.00, 5, 'Best white tee I own.'),
(5, 2, 1, 60.00, 25.00, 3, 'Color faded a bit after first wash.'),
(6, 3, 1, 150.00, 70.00, 5, 'A bit expensive but worth it for the style.'),
(7, 4, 1, 45.00, 20.00, 4, 'Warm and cozy.'),
(8, 5, 1, 85.00, 40.00, 4, 'Good support for running.'),
(9, 1, 3, 25.00, 10.00, 5, 'Stocked up on these!'),
(10, 2, 1, 60.00, 25.00, 5, 'Perfect slim fit.'),
(10, 4, 1, 45.00, 20.00, 4, 'Nice color.'),
(11, 5, 1, 85.00, 40.00, 5, 'Super lightweight.'),
(11, 1, 1, 25.00, 10.00, 5, 'Classic.'),
(12, 5, 1, 85.00, 40.00, 5, 'Most comfortable sneakers ever.'),
(13, 1, 1, 25.00, 10.00, 4, 'Good quality for the price.');

-- More Products
INSERT INTO products (product_name, sku, category, size, price, cost_price, stock_quantity, low_stock_alert, image_url) VALUES
('Denim Shorts', 'SHT-006', 'Bottoms', 'Small', 35.00, 15.00, 45, 10, '/productImages/Denim Shorts.jpg'),
('Floral Summer Dress', 'DRS-007', 'Dresses', 'Medium', 65.00, 30.00, 20, 5, '/productImages/Floral Dress.jpg'),
('Baseball Cap', 'CAP-008', 'Accessories', 'Adjustable', 20.00, 8.00, 60, 15, '/productImages/Baseball Cap.jpg'),
('Canvas Sneakers', 'SHO-009', 'Footwear', '9', 45.00, 20.00, 50, 10, '/productImages/Canvas Sneakers.jpg'),
('Formal Linen Shirt', 'SHT-010', 'Tops', 'Large', 55.00, 25.00, 40, 10, '/productImages/Formal Lenin Shirt.jpg'),
('Cargo Work Pants', 'PNT-011', 'Bottoms', 'Medium', 50.00, 22.00, 35, 8, '/productImages/Cargo Work Pants.jpg'),
('Winter Parka', 'COT-012', 'Outerwear', 'XL', 180.00, 80.00, 10, 3, '/productImages/Winter Parka.jpg'),
('Silk Necktie', 'TIE-013', 'Accessories', 'One Size', 30.00, 12.00, 35, 10, '/productImages/Silk Necktie.jpg');

-- Orders for some of the new products
-- Customer 4 (Alice) buys a Summer Dress
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(4, 65.00, 0, 'delivered');
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(14, 7, 1, 65.00, 30.00, 5, 'Beautiful pattern, fits perfectly!');

-- Customer 5 (Charlie) buys Cargo Pants and a Baseball Cap
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(5, 70.00, 0, 'delivered');
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(15, 11, 1, 50.00, 22.00, 5, 'Very durable for work.'),
(15, 8, 1, 20.00, 8.00, 4, 'Simple and clean design.');

-- Customer 6 (David) buys Canvas Sneakers and a Silk Necktie
INSERT INTO orders (customer_id, total_amount, discount_applied, status) VALUES
(6, 75.00, 0, 'delivered');
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(16, 9, 1, 45.00, 20.00, 4, 'Great everyday shoes.'),
(16, 13, 1, 30.00, 12.00, 3, 'Color is slightly different than expected.');
