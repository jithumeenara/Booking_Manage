import { pool } from './server/db.js';

async function applyMigration() {
    console.log('Applying Training Hall migrations...');
    const conn = await pool.getConnection();
    try {
        await conn.query(`
      CREATE TABLE IF NOT EXISTS training_halls (
        id CHAR(36) NOT NULL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        code VARCHAR(50) NOT NULL UNIQUE,
        capacity INT NOT NULL DEFAULT 0,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        console.log('Created training_halls table');

        await conn.query(`
      CREATE TABLE IF NOT EXISTS booking_halls (
        booking_id CHAR(36) NOT NULL,
        hall_id CHAR(36) NOT NULL,
        PRIMARY KEY (booking_id, hall_id),
        FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
        FOREIGN KEY (hall_id) REFERENCES training_halls(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);
        console.log('Created booking_halls table');

        console.log('Migration complete.');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        conn.release();
        process.exit();
    }
}

applyMigration();
