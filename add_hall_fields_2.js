
import { pool } from './server/db.js';

async function migrate() {
    let conn;
    try {
        conn = await pool.getConnection();
        console.log('Connected to database.');

        const [columns] = await conn.query("SHOW COLUMNS FROM training_halls LIKE 'hall_sub_name'");

        if (columns.length === 0) {
            console.log('Adding hall_sub_name and hall_rent_per_day columns...');
            await conn.query(`
        ALTER TABLE training_halls 
        ADD COLUMN hall_sub_name VARCHAR(255),
        ADD COLUMN hall_rent_per_day DECIMAL(10,2) DEFAULT 0
      `);
            console.log('Columns added successfully.');
        } else {
            console.log('Columns already exist.');
        }

    } catch (err) {
        console.error('Error modifying table:', err);
    } finally {
        if (conn) conn.release();
        // process.exit(0); // Don't exit immediately, let pool close if needed, but pool.end is better.
        // Since we import pool from app, closing it might be tricky if it's shared, but for a script it's fine.
        // However, server/db.js exports `pool`.
        process.exit(0);
    }
}

migrate();
