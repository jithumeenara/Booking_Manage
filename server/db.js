import mysql from 'mysql2/promise';

const DATABASE_NAME = process.env.MYSQL_DATABASE || 'acsti_db';

// First, create a connection without selecting a database
const baseConfig = {
  host: process.env.MYSQL_HOST || '127.0.0.1',
  user: process.env.MYSQL_USER || 'root',
  password: process.env.MYSQL_PASSWORD || 'Mysql2login&',
  port: Number(process.env.MYSQL_PORT || 3306),
};

// Create the database if it doesn't exist
async function ensureDatabase() {
  const connection = await mysql.createConnection(baseConfig);
  try {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DATABASE_NAME}\``);
    console.log(`Database '${DATABASE_NAME}' ensured to exist.`);
  } finally {
    await connection.end();
  }
}

// Initialize database before creating pool
await ensureDatabase();

// Now create pool with database selected
const config = {
  ...baseConfig,
  database: DATABASE_NAME,
  connectionLimit: 10,
};

export const pool = mysql.createPool(config);

export async function ensureSchema() {
  const conn = await pool.getConnection();
  try {
    await conn.query(`
      CREATE TABLE IF NOT EXISTS users (
        id CHAR(36) NOT NULL PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        name VARCHAR(255) NULL,
        role ENUM('admin','user') NOT NULL DEFAULT 'user',
        mobile VARCHAR(32) NULL,
        photo LONGTEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS booking_links (
        id CHAR(36) NOT NULL PRIMARY KEY,
        token VARCHAR(255) NOT NULL UNIQUE,
        department_name TEXT NOT NULL,
        email VARCHAR(255) NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id CHAR(36) NOT NULL PRIMARY KEY,
        department_agency TEXT NOT NULL,
        contact_person_name TEXT NOT NULL,
        contact_person_email TEXT NOT NULL,
        contact_person_phone TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        num_participants INT NOT NULL CHECK (num_participants > 0),
        needs_accommodation BOOLEAN NOT NULL DEFAULT FALSE,
        needs_food BOOLEAN NOT NULL DEFAULT FALSE,
        needs_training_hall BOOLEAN NOT NULL DEFAULT FALSE,
        purpose TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        number_of_halls INT DEFAULT 1,
        status ENUM('pending', 'complete', 'payment_completed', 'payment_pending') DEFAULT 'pending',
        total_bill_amount DECIMAL(10,2) DEFAULT 0,
        completed_at TIMESTAMP NULL,
        financial_year VARCHAR(20),
        bill_no TEXT,
        billed_date TIMESTAMP NULL,
        num_of_bills INT DEFAULT 1,
        booked_via_link BOOLEAN NOT NULL DEFAULT FALSE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS training_programs (
        id CHAR(36) NOT NULL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        start_date TIMESTAMP NOT NULL,
        end_date TIMESTAMP NOT NULL,
        max_participants INT NOT NULL DEFAULT 180,
        has_accommodation BOOLEAN NOT NULL DEFAULT FALSE,
        has_food BOOLEAN NOT NULL DEFAULT FALSE,
        has_training_hall BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        department_agency TEXT,
        no_of_batches INT DEFAULT 1,
        training_hall_count INT DEFAULT 0,
        training_hall_capacity TEXT,
        is_private BOOLEAN NOT NULL DEFAULT FALSE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS email_config (
        id CHAR(36) NOT NULL PRIMARY KEY,
        smtp_host VARCHAR(255) NOT NULL,
        smtp_port INT NOT NULL DEFAULT 587,
        smtp_user VARCHAR(255) NOT NULL,
        smtp_password TEXT NOT NULL,
        from_email VARCHAR(255) NOT NULL,
        from_name VARCHAR(255) NOT NULL DEFAULT 'ACSTI Kerala',
        security VARCHAR(20) NOT NULL DEFAULT 'tls',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS telegram_config (
        id CHAR(36) NOT NULL PRIMARY KEY,
        bot_token VARCHAR(500) NOT NULL,
        chat_id VARCHAR(255) NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT FALSE,
        notify_on_link_booking BOOLEAN NOT NULL DEFAULT TRUE,
        notify_on_billing_ready BOOLEAN NOT NULL DEFAULT TRUE,
        notify_on_month_end BOOLEAN NOT NULL DEFAULT TRUE,
        notify_on_login BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id CHAR(36) NOT NULL PRIMARY KEY,
        user_id CHAR(36) NOT NULL,
        page VARCHAR(100) NOT NULL,
        can_access BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_user_page (user_id, page),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
  } finally {
    conn.release();
  }
}
