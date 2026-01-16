
import { pool } from './server/db.js';

async function migrate() {
    try {
        const conn = await pool.getConnection();
        console.log('Connected to database.');

        try {
            // Check if columns exist
            const [columns] = await conn.query(`SHOW COLUMNS FROM bookings LIKE 'bill_base_amount'`);

            if (columns.length === 0) {
                console.log('Adding bill_base_amount and bill_gst_amount columns...');
                await conn.query(`
          ALTER TABLE bookings 
          ADD COLUMN bill_base_amount DECIMAL(10,2) DEFAULT 0,
          ADD COLUMN bill_gst_amount DECIMAL(10,2) DEFAULT 0
        `);
                console.log('Columns added successfully.');
            } else {
                console.log('Columns already exist.');
            }

        } catch (err) {
            console.error('Error modifying table:', err);
        } finally {
            conn.release();
        }
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        process.exit();
    }
}

migrate();
