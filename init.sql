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
