CREATE DATABASE IF NOT EXISTS fintrack_db;
USE fintrack_db;

CREATE TABLE IF NOT EXISTS transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    amount DECIMAL(15, 2) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    category VARCHAR(100) NOT NULL,
    date DATETIME DEFAULT CURRENT_TIMESTAMP
);
