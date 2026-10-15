CREATE DATABASE IF NOT EXISTS campus_book_market DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE campus_book_market;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  openid VARCHAR(64) NOT NULL UNIQUE,
  nickname VARCHAR(80) NULL,
  avatar TEXT NULL,
  school ENUM('重庆邮电大学','重庆工商大学','重庆第二师范学院') NOT NULL,
  phone VARCHAR(32) NULL,
  role ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS books (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  seller_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  isbn VARCHAR(32) NULL,
  price DECIMAL(10,2) NOT NULL,
  `condition` ENUM('全新','九成新','八成新','七成新','有明显使用痕迹') NOT NULL,
  school ENUM('重庆邮电大学','重庆工商大学','重庆第二师范学院') NOT NULL,
  campus VARCHAR(100) NOT NULL,
  note VARCHAR(1000) NULL,
  images JSON NOT NULL,
  status ENUM('在售','已下单','已完成','已下架') NOT NULL DEFAULT '在售',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seller_id) REFERENCES users(id),
  INDEX idx_books_school_status (school, status),
  INDEX idx_books_title (title)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  book_id BIGINT UNSIGNED NOT NULL,
  buyer_id BIGINT UNSIGNED NOT NULL,
  seller_id BIGINT UNSIGNED NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  seller_amount DECIMAL(10,2) NOT NULL,
  status ENUM('待面交','已完成','已退款') NOT NULL DEFAULT '待面交',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  FOREIGN KEY (seller_id) REFERENCES users(id),
  INDEX idx_orders_buyer (buyer_id, created_at),
  INDEX idx_orders_seller (seller_id, created_at)
) ENGINE=InnoDB;
