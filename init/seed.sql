-- Clear existing data
SET FOREIGN_KEY_CHECKS = 0;
TRUNCATE TABLE in_cart;
TRUNCATE TABLE order_items;
TRUNCATE TABLE orders;
TRUNCATE TABLE products;
TRUNCATE TABLE customers;
TRUNCATE TABLE business_profile;
SET FOREIGN_KEY_CHECKS = 1;

-- Sample Customers
INSERT INTO customers (customer_id, full_name, email, password, contact_number, address) VALUES
(1, 'John Doe', 'john@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '123-456-7890', '123 Main St, New York, NY'),
(2, 'Jane Smith', 'jane@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '987-654-3210', '456 Oak Ave, Los Angeles, CA'),
(3, 'Bob Johnson', 'bob@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '555-0199', '789 Pine Rd, Chicago, IL'),
(4, 'Alice Williams', 'alice@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '555-0101', '101 Apple St, Miami, FL'),
(5, 'Charlie Brown', 'charlie@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '555-0102', '202 Berry Ln, Seattle, WA'),
(6, 'David Miller', 'david@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '555-0103', '303 Cherry Ct, Austin, TX'),
(7, 'Eva Garcia', 'eva@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '555-0104', '404 Date Dr, Denver, CO'),
(8, 'Frank Wilson', 'frank@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '555-0105', '505 Elderberry Rd, Portland, OR'),
(9, 'Grace Lee', 'grace@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '555-0106', '606 Fig St, Boston, MA'),
(10, 'Henry Ford', 'henry@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '555-0107', '707 Grape Ave, Detroit, MI'),
(11, 'Ivy Chen', 'ivy@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '555-0108', '808 Honeydew Ln, San Francisco, CA'),
(12, 'Jack Sparrow', 'jack@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', '555-0109', '909 Ivy Rd, Port Royal, FL'),
(13, 'Karen Smith', 'karen@example.com', '$2b$10$MbzRN0UelU1YYCbQdCHfqecukvY.wBYVh0TBZV7N87EW/4twzU5bu', NULL, '110 Juniper Blvd, Phoenix, AZ');

-- Sample Products with Size Variants
INSERT INTO products (product_id, product_name, sku, category, size, price, cost_price, stock_quantity, low_stock_alert, image_url) VALUES
-- Classic White T-Shirt
(1, 'Classic White T-Shirt', 'TSH-001-S', 'Tops', 'Small', 25.00, 10.00, 50, 10, '/productImages/Classic white tshirt.png'),
(2, 'Classic White T-Shirt', 'TSH-001-M', 'Tops', 'Medium', 25.00, 10.00, 75, 10, '/productImages/Classic white tshirt.png'),
(3, 'Classic White T-Shirt', 'TSH-001-L', 'Tops', 'Large', 25.00, 10.00, 60, 10, '/productImages/Classic white tshirt.png'),
(4, 'Classic White T-Shirt', 'TSH-001-XL', 'Tops', 'Extra Large', 25.00, 10.00, 30, 10, '/productImages/Classic white tshirt.png'),
-- Slim Fit Blue Jeans
(5, 'Slim Fit Blue Jeans', 'JNS-002-30', 'Bottoms', '30x32', 60.00, 25.00, 20, 5, '/productImages/Slim Fit Blue Jeans.jpg'),
(6, 'Slim Fit Blue Jeans', 'JNS-002-32', 'Bottoms', '32x32', 60.00, 25.00, 35, 5, '/productImages/Slim Fit Blue Jeans.jpg'),
(7, 'Slim Fit Blue Jeans', 'JNS-002-34', 'Bottoms', '34x32', 60.00, 25.00, 25, 5, '/productImages/Slim Fit Blue Jeans.jpg'),
(8, 'Slim Fit Blue Jeans', 'JNS-002-36', 'Bottoms', '36x32', 60.00, 25.00, 15, 5, '/productImages/Slim Fit Blue Jeans.jpg'),
-- Leather Biker Jacket
(9, 'Leather Biker Jacket', 'JKT-003-S', 'Outerwear', 'Small', 150.00, 70.00, 5, 2, '/productImages/Leather Biker Jacket.jpg'),
(10, 'Leather Biker Jacket', 'JKT-003-M', 'Outerwear', 'Medium', 150.00, 70.00, 10, 2, '/productImages/Leather Biker Jacket.jpg'),
(11, 'Leather Biker Jacket', 'JKT-003-L', 'Outerwear', 'Large', 150.00, 70.00, 8, 2, '/productImages/Leather Biker Jacket.jpg'),
(12, 'Leather Biker Jacket', 'JKT-003-XL', 'Outerwear', 'Extra Large', 150.00, 70.00, 4, 2, '/productImages/Leather Biker Jacket.jpg'),
-- Wool Blend Sweater
(13, 'Wool Blend Sweater', 'SWT-004-S', 'Tops', 'Small', 45.00, 20.00, 15, 5, '/productImages/Wool Blend Sweater.jpg'),
(14, 'Wool Blend Sweater', 'SWT-004-M', 'Tops', 'Medium', 45.00, 20.00, 25, 5, '/productImages/Wool Blend Sweater.jpg'),
(15, 'Wool Blend Sweater', 'SWT-004-L', 'Tops', 'Large', 45.00, 20.00, 20, 5, '/productImages/Wool Blend Sweater.jpg'),
-- Running Sneakers
(16, 'Running Sneakers', 'SHO-005-08', 'Footwear', '8', 85.00, 40.00, 15, 5, '/productImages/Running Sneakers.jpg'),
(17, 'Running Sneakers', 'SHO-005-09', 'Footwear', '9', 85.00, 40.00, 20, 5, '/productImages/Running Sneakers.jpg'),
(18, 'Running Sneakers', 'SHO-005-10', 'Footwear', '10', 85.00, 40.00, 25, 5, '/productImages/Running Sneakers.jpg'),
(19, 'Running Sneakers', 'SHO-005-11', 'Footwear', '11', 85.00, 40.00, 15, 5, '/productImages/Running Sneakers.jpg'),
-- Denim Shorts
(20, 'Denim Shorts', 'SHT-006-30', 'Bottoms', '30', 35.00, 15.00, 20, 5, '/productImages/Denim Shorts.jpg'),
(21, 'Denim Shorts', 'SHT-006-32', 'Bottoms', '32', 35.00, 15.00, 25, 5, '/productImages/Denim Shorts.jpg'),
(22, 'Denim Shorts', 'SHT-006-34', 'Bottoms', '34', 35.00, 15.00, 20, 5, '/productImages/Denim Shorts.jpg'),
-- Floral Summer Dress
(23, 'Floral Summer Dress', 'DRS-007-S', 'Dresses', 'Small', 65.00, 30.00, 10, 3, '/productImages/Floral Dress.jpg'),
(24, 'Floral Summer Dress', 'DRS-007-M', 'Dresses', 'Medium', 65.00, 30.00, 15, 3, '/productImages/Floral Dress.jpg'),
(25, 'Floral Summer Dress', 'DRS-007-L', 'Dresses', 'Large', 65.00, 30.00, 10, 3, '/productImages/Floral Dress.jpg'),
-- Baseball Cap
(26, 'Baseball Cap', 'CAP-008-OS', 'Accessories', 'One Size', 20.00, 8.00, 100, 10, '/productImages/Baseball Cap.jpg'),
-- Canvas Sneakers
(27, 'Canvas Sneakers', 'SHO-009-08', 'Footwear', '8', 45.00, 20.00, 20, 5, '/productImages/Canvas Sneakers.jpg'),
(28, 'Canvas Sneakers', 'SHO-009-09', 'Footwear', '9', 45.00, 20.00, 30, 5, '/productImages/Canvas Sneakers.jpg'),
(29, 'Canvas Sneakers', 'SHO-009-10', 'Footwear', '10', 45.00, 20.00, 25, 5, '/productImages/Canvas Sneakers.jpg'),
-- Formal Linen Shirt
(30, 'Formal Linen Shirt', 'SHT-010-M', 'Tops', 'Medium', 55.00, 25.00, 20, 5, '/productImages/Formal Lenin Shirt.jpg'),
(31, 'Formal Linen Shirt', 'SHT-010-L', 'Tops', 'Large', 55.00, 25.00, 25, 5, '/productImages/Formal Lenin Shirt.jpg'),
(32, 'Formal Linen Shirt', 'SHT-010-XL', 'Tops', 'Extra Large', 55.00, 25.00, 15, 5, '/productImages/Formal Lenin Shirt.jpg'),
-- Cargo Work Pants
(33, 'Cargo Work Pants', 'PNT-011-32', 'Bottoms', '32', 50.00, 22.00, 20, 5, '/productImages/Cargo Work Pants.jpg'),
(34, 'Cargo Work Pants', 'PNT-011-34', 'Bottoms', '34', 50.00, 22.00, 25, 5, '/productImages/Cargo Work Pants.jpg'),
-- Winter Parka
(35, 'Winter Parka', 'COT-012-L', 'Outerwear', 'Large', 180.00, 80.00, 8, 2, '/productImages/Winter Parka.jpg'),
(36, 'Winter Parka', 'COT-012-XL', 'Outerwear', 'Extra Large', 180.00, 80.00, 10, 2, '/productImages/Winter Parka.jpg'),
-- Silk Necktie
(37, 'Silk Necktie', 'TIE-013-OS', 'Accessories', 'One Size', 30.00, 12.00, 50, 5, '/productImages/Silk Necktie.jpg'),
-- Skechers Comfort Shoes
(38, 'Skechers Comfort Shoes', 'SHO-014-09', 'Footwear', '9', 75.00, 35.00, 20, 5, '/productImages/skechers_shoes.jpg'),
(39, 'Skechers Comfort Shoes', 'SHO-014-10', 'Footwear', '10', 75.00, 35.00, 25, 5, '/productImages/skechers_shoes.jpg');

-- Sample Business Profile
INSERT INTO business_profile (company_name, address, contact_email, contact_phone, tax_id, currency) VALUES
('StyleOne Boutique', '101 Fashion Ave, New York, NY', 'contact@styleone.com', '800-555-0101', 'TX-987654321', 'USD');

-- Sample Orders
INSERT INTO orders (order_id, customer_id, total_amount, discount_applied, status, payment_method) VALUES
(1, 1, 85.00, 0, 'delivered', 'cod'),
(2, 2, 45.00, 0, 'processing', 'gcash'),
(3, 1, 150.00, 0, 'delivered', 'card'),
(4, 4, 25.00, 0, 'delivered', 'paypal'),
(5, 5, 60.00, 0, 'delivered', 'maya'),
(6, 6, 150.00, 0, 'delivered', 'gotyme'),
(7, 7, 45.00, 0, 'delivered', 'cod'),
(8, 8, 85.00, 0, 'delivered', 'gcash');

-- Sample Order Items
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase, cost_price_at_purchase, rating, comments) VALUES
(1, 2, 1, 25.00, 10.00, 5, 'Perfect fit and very comfortable cotton!'),
(1, 6, 1, 60.00, 25.00, 4, 'Great jeans, but slightly long.'),
(2, 14, 1, 45.00, 20.00, 4, 'Warm and cozy.'),
(3, 10, 1, 150.00, 70.00, 5, 'High quality leather, looks amazing.'),
(4, 1, 1, 25.00, 10.00, 5, 'Best white tee I own.'),
(5, 5, 1, 60.00, 25.00, 3, 'Color faded a bit after first wash.'),
(6, 11, 1, 150.00, 70.00, 5, 'A bit expensive but worth it for the style.'),
(7, 15, 1, 45.00, 20.00, 4, 'Nice sweater.'),
(8, 18, 1, 85.00, 40.00, 4, 'Good support for running.');

-- Sample Items in Cart
INSERT INTO in_cart (customer_id, product_id, quantity) VALUES
(3, 18, 1),
(2, 26, 1),
(4, 24, 1);
