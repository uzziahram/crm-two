-- Admin and User creation script
CREATE TABLE IF NOT EXISTS `customers` (
  `customer_id` int NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`customer_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `admins` (
  `admin_id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `product_id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text,
  `specifications` text,
  `price` decimal(10,2) NOT NULL,
  `stock_quantity` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `image_url` varchar(255) DEFAULT NULL,
  `cost_price` decimal(10,2) DEFAULT '0.00',
  `is_visible` tinyint(1) DEFAULT '1',
  PRIMARY KEY (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `order_id` int NOT NULL AUTO_INCREMENT,
  `customer_id` int NOT NULL,
  `total_amount` decimal(10,2) NOT NULL,
  `order_status` enum('CART','PENDING','PROCESSING','SHIPPED','DELIVERED','CANCELLED') DEFAULT 'CART',
  `shipping_address` text,
  `payment_status` enum('PENDING','PAID','FAILED') DEFAULT 'PENDING',
  `payment_method` varchar(50) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`order_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `order_items` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` int NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `order_id` (`order_id`),
  KEY `product_id` (`product_id`),
  CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS `reviews` (
  `review_id` int NOT NULL AUTO_INCREMENT,
  `product_id` int NOT NULL,
  `customer_id` int NOT NULL,
  `order_id` int NOT NULL,
  `rating` int NOT NULL,
  `comment` text,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  UNIQUE KEY `unique_order_product_review` (`order_id`,`product_id`),
  KEY `product_id` (`product_id`),
  KEY `customer_id` (`customer_id`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`product_id`) REFERENCES `products` (`product_id`),
  CONSTRAINT `reviews_ibfk_2` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`customer_id`),
  CONSTRAINT `reviews_ibfk_3` FOREIGN KEY (`order_id`) REFERENCES `orders` (`order_id`),
  CONSTRAINT `reviews_chk_1` CHECK (((`rating` >= 1) and (`rating` <= 5)))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Seed initial admin
INSERT IGNORE INTO `admins` (email, password) VALUES ('admin', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.');

-- Seed all products from current database
INSERT IGNORE INTO products (product_id, name, description, specifications, price, stock_quantity, image_url, cost_price, is_visible) VALUES 
(7, 'MacBook Pro 14-inch', 'Powerful laptop with M3 chip for professionals.', 'CPU: Apple M3 Pro (11-core), RAM: 18GB Unified Memory, Storage: 512GB SSD, Display: 14.2-inch Liquid Retina XDR (3024x1964), GPU: 14-core, Battery: Up to 18 hours', 1999.99, 15, '/product_images/7/Macbook-pro-14-inch.jpg', 1399.99, 1),
(8, 'Logitech MX Master 3S', 'Performance wireless mouse with quiet clicks.', 'DPI: 8000 (Darkfield), Connectivity: Wireless (Bluetooth/Logi Bolt), Buttons: 7, Battery: Up to 70 days, Features: MagSpeed Scrolling, Quiet Clicks', 99.00, 50, '/product_images/8/Logitech-mx-master-3s.jpg', 69.30, 1),
(9, 'Sony WH-1000XM5', 'Industry-leading noise canceling headphones.', 'Connectivity: Wireless (Bluetooth 5.2), Driver: 30mm, Mic: 4 beamforming mics (AI noise reduction), Battery: 30 hours (ANC On), Sound: Hi-Res Audio, LDAC support', 398.00, 30, '/product_images/9/Sony-wh-100xm5.jpg', 278.60, 1),
(10, 'Dell UltraSharp 27 Monitor', '4K USB-C Hub monitor for vibrant color.', 'Resolution: 4K UHD (3840 x 2160), Refresh Rate: 60Hz, Panel: IPS Black, Brightness: 400 nits, Ports: USB-C (90W PD), DisplayPort 1.4, HDMI 2.0', 549.99, 20, '/product_images/10/Dell-ultrasharp-27-monitor.jpg', 384.99, 1),
(11, 'Keychron K2 Wireless Mechanical Keyboard', 'Compact 75% layout keyboard with Gateron switches.', 'Switches: Gateron G Pro (Hot-swappable), Connectivity: Wireless (Bluetooth 5.1) & Wired (USB-C), Backlight: RGB, Layout: 75% (84 keys), Battery: 4000mAh', 89.00, 40, '/product_images/11/Keychron-K2-Wireless-Mechanical-Keyboard.jpg', 62.30, 1),
(12, 'ASUS ROG Zephyrus G14', 'Compact and powerful gaming laptop.', 'CPU: AMD Ryzen 9 7940HS, RAM: 16GB DDR5, Storage: 1TB NVMe SSD, Display: 14-inch QHD+ 165Hz, GPU: NVIDIA RTX 4060 (8GB), Battery: 76Wh', 1599.00, 10, '/product_images/12/ASUS-ROG-Zephyrus-G14.png', 1119.30, 1),
(13, 'iPad Air (M2)', 'Versatile tablet with the power of the M2 chip.', 'Chip: Apple M2, RAM: 8GB, Storage: 128GB, Display: 11-inch Liquid Retina, Camera: 12MP Wide & Center Stage Ultra Wide', 599.00, 25, '/product_images/13/Ipad-air.jpg', 419.30, 1),
(14, 'Logitech C920 HD Pro', 'Standard-setting webcam for high-quality video calling.', 'Resolution: 1080p/30fps, 720p/30fps, Focus: Autofocus, Lens: Glass, Mic: Dual stereo, Field of View: 78 degrees', 79.99, 40, '/product_images/14/Logitech-c920-hd-pro.jpg', 55.99, 1),
(15, 'Samsung T7 Shield 2TB', 'Rugged and fast portable SSD for creators on the go.', 'Capacity: 2TB, Read Speed: Up to 1050 MB/s, Write Speed: Up to 1000 MB/s, Durability: IP65 water/dust resistant, Drop: 3-meter drop resistant', 159.00, 30, '/product_images/15/Samsung-T7-Shield-2TB.jpg', 111.30, 1),
(16, 'Bose Companion 2 Series III', 'High-quality audio performance for your computer.', 'Connectivity: Dual AUX inputs, Controls: Volume/Headphone jack on front, Sound: TrueSpace digital processing circuitry', 149.00, 15, '/product_images/16/Bose-companion-2-series-iii.jpg', 104.30, 1),
(17, 'TP-Link Archer AX55', 'Dual-Band Gigabit Wi-Fi 6 Router for modern homes.', 'Speed: 2402 Mbps (5 GHz) + 574 Mbps (2.4 GHz), Ports: 1x Gigabit WAN, 4x Gigabit LAN, 1x USB 3.0, Security: WPA3, HomeShield', 119.99, 20, '/product_images/17/TP-Link-archer-ax55.jpg', 83.99, 1),
(18, 'LOQ Laptop', 'Powerfull laptop', 'CPU: 15gen, RAM: 32 DDRG, STORAGE: 1TB Nvme', 1600.00, 100, '/product_images/18/Loq-image.jpg', 1400.00, 1);

-- Seed sample customers
INSERT IGNORE INTO `customers` (customer_id, first_name, last_name, email, password) VALUES
(1, 'John', 'Doe', 'john@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(2, 'Jane', 'Smith', 'jane@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(3, 'Bob', 'Wilson', 'bob@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(4, 'Alice', 'Johnson', 'alice@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(5, 'Charlie', 'Brown', 'charlie@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(6, 'David', 'Miller', 'david@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(7, 'Eva', 'Davis', 'eva@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(8, 'Frank', 'Wilson', 'frank@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(9, 'Grace', 'Lee', 'grace@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(10, 'Henry', 'Taylor', 'henry@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(11, 'Ivy', 'Anderson', 'ivy@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(12, 'Jack', 'Thomas', 'jack@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.'),
(13, 'Kelly', 'White', 'kelly@example.com', '$2b$10$xESk5gkNSI7irUowDzchN.j1Lk6WzJCmZT4lSAfXLybOPfAW.HsH.');

-- Seed sample orders
INSERT IGNORE INTO `orders` (order_id, customer_id, total_amount, order_status, shipping_address, payment_status, payment_method, created_at) VALUES
(1, 1, 2098.99, 'DELIVERED', '123 Main St, New York, NY 10001', 'PAID', 'Credit Card', '2024-01-15 10:30:00'),
(2, 2, 497.00, 'SHIPPED', '456 Oak Ave, Los Angeles, CA 90001', 'PAID', 'PayPal', '2024-02-20 14:45:00'),
(3, 3, 159.00, 'PROCESSING', '789 Pine Rd, Chicago, IL 60601', 'PAID', 'Credit Card', '2024-03-10 09:15:00'),
(4, 4, 1599.00, 'DELIVERED', '101 Maple Dr, Seattle, WA 98101', 'PAID', 'Credit Card', '2024-04-05 16:20:00'),
(5, 5, 89.00, 'DELIVERED', '202 Birch Ln, Austin, TX 78701', 'PAID', 'PayPal', '2024-05-12 11:00:00'),
(6, 6, 549.99, 'DELIVERED', '303 Cedar St, Miami, FL 33101', 'PAID', 'Credit Card', '2024-06-18 13:30:00'),
(7, 7, 398.00, 'DELIVERED', '404 Walnut Ave, Boston, MA 02101', 'PAID', 'Credit Card', '2024-07-22 15:45:00'),
(8, 8, 99.00, 'DELIVERED', '505 Spruce Rd, Denver, CO 80201', 'PAID', 'PayPal', '2024-08-30 10:00:00'),
(9, 9, 1999.99, 'DELIVERED', '606 Ash Blvd, San Francisco, CA 94101', 'PAID', 'Credit Card', '2024-09-14 17:10:00'),
(10, 10, 599.00, 'DELIVERED', '707 Willow Way, Portland, OR 97201', 'PAID', 'Credit Card', '2024-10-02 12:20:00'),
(11, 11, 79.99, 'DELIVERED', '808 Elm Ct, Atlanta, GA 30301', 'PAID', 'PayPal', '2024-11-11 14:00:00'),
(12, 12, 159.00, 'DELIVERED', '909 Poplar Ter, Phoenix, AZ 85001', 'PAID', 'Credit Card', '2024-12-25 09:30:00'),
(13, 13, 149.00, 'DELIVERED', '111 Sycamore St, Las Vegas, NV 89101', 'PAID', 'Credit Card', '2025-01-05 11:15:00'),
(14, 1, 119.99, 'DELIVERED', '123 Main St, New York, NY 10001', 'PAID', 'PayPal', '2025-02-14 16:00:00'),
(15, 2, 1600.00, 'DELIVERED', '456 Oak Ave, Los Angeles, CA 90001', 'PAID', 'Credit Card', '2025-03-20 10:45:00'),
(16, 3, 1999.99, 'DELIVERED', '789 Pine Rd, Chicago, IL 60601', 'PAID', 'Credit Card', '2025-04-10 14:30:00'),
(17, 4, 398.00, 'SHIPPED', '101 Maple Dr, Seattle, WA 98101', 'PAID', 'PayPal', '2025-05-01 09:00:00'),
(18, 5, 549.99, 'PROCESSING', '202 Birch Ln, Austin, TX 78701', 'PAID', 'Credit Card', '2025-05-05 13:20:00'),
(19, 6, 89.00, 'PENDING', '303 Cedar St, Miami, FL 33101', 'PAID', 'PayPal', '2025-05-08 11:45:00'),
(20, 7, 99.00, 'PENDING', '404 Walnut Ave, Boston, MA 02101', 'PAID', 'Credit Card', '2025-05-10 15:00:00'),
(21, 8, 1599.00, 'DELIVERED', '505 Spruce Rd, Denver, CO 80201', 'PAID', 'Credit Card', '2025-05-01 10:00:00'),
(22, 9, 599.00, 'SHIPPED', '606 Ash Blvd, San Francisco, CA 94101', 'PAID', 'PayPal', '2025-05-05 14:30:00'),
(23, 10, 1600.00, 'PROCESSING', '707 Willow Way, Portland, OR 97201', 'PAID', 'Credit Card', '2025-05-09 11:00:00');

-- Seed sample order items
INSERT IGNORE INTO `order_items` (order_id, product_id, quantity, unit_price) VALUES
(1, 7, 1, 1999.99),
(1, 8, 1, 99.00),
(2, 9, 1, 398.00),
(2, 8, 1, 99.00),
(3, 15, 1, 159.00),
(4, 12, 1, 1599.00),
(5, 11, 1, 89.00),
(6, 10, 1, 549.99),
(7, 9, 1, 398.00),
(8, 8, 1, 99.00),
(9, 7, 1, 1999.99),
(10, 13, 1, 599.00),
(11, 14, 1, 79.99),
(12, 15, 1, 159.00),
(13, 16, 1, 149.00),
(14, 17, 1, 119.99),
(15, 18, 1, 1600.00),
(16, 7, 1, 1999.99),
(17, 9, 1, 398.00),
(18, 10, 1, 549.99),
(19, 11, 1, 89.00),
(20, 8, 1, 99.00),
(21, 12, 1, 1599.00),
(22, 13, 1, 599.00),
(23, 18, 1, 1600.00);

-- Seed sample reviews
INSERT IGNORE INTO `reviews` (product_id, customer_id, order_id, rating, comment, created_at) VALUES
(7, 1, 1, 5, 'Absolutely love the M3 chip. Best MacBook yet!', '2024-01-20 10:30:00'),
(8, 1, 1, 4, 'Great mouse, very ergonomic, but software is a bit bloated.', '2024-01-21 14:45:00'),
(9, 2, 2, 5, 'The noise cancellation is magical. Perfect for travel.', '2024-02-25 09:15:00'),
(8, 2, 2, 5, 'Quiet clicks are a game changer for office work.', '2024-02-26 16:20:00'),
(12, 4, 4, 5, 'A beast of a laptop in a small form factor.', '2024-04-10 11:00:00'),
(11, 5, 5, 4, 'Tactile and satisfying typing experience.', '2024-05-15 13:30:00'),
(10, 6, 6, 5, 'Colors are stunning. Perfect for design work.', '2024-06-25 15:45:00'),
(9, 7, 7, 5, 'Best headphones I have ever owned.', '2024-07-30 10:00:00'),
(8, 8, 8, 4, 'Solid mouse, though took some time to get used to.', '2024-09-05 17:10:00'),
(7, 9, 9, 5, 'Incredible performance and screen.', '2024-09-20 12:20:00'),
(13, 10, 10, 5, 'The M2 chip makes everything so smooth.', '2024-10-10 14:00:00'),
(14, 11, 11, 4, 'Great quality for the price.', '2024-11-20 09:30:00'),
(15, 12, 12, 5, 'Fast and reliable storage.', '2024-12-30 11:15:00'),
(16, 13, 13, 4, 'Good sound quality for desktop speakers.', '2025-01-12 16:00:00'),
(17, 1, 14, 5, 'Signal is strong and setup was easy.', '2025-02-20 10:45:00'),
(18, 2, 15, 4, 'Powerful laptop, great value.', '2025-03-25 14:30:00'),
(7, 3, 16, 5, 'Expensive but worth every penny.', '2025-04-15 09:00:00'),
(12, 8, 21, 5, 'The screen is beautiful and it runs everything fast.', '2025-05-05 10:00:00'),
(13, 9, 22, 4, 'Perfect for my university notes.', '2025-05-07 14:30:00'),
(18, 10, 23, 5, 'Exceeded my expectations for a gaming laptop.', '2025-05-10 11:00:00');

