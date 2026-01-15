import { pool } from './server/db.js';

async function applyMigration() {
    console.log('Applying migration: Add floor column to training_halls...');
    const conn = await pool.getConnection();
    try {
        // Check if column exists
        const [rows] = await conn.query("SHOW COLUMNS FROM training_halls LIKE 'floor'");
        if (rows.length === 0) {
            await conn.query(`
        ALTER TABLE training_halls 
        ADD COLUMN floor VARCHAR(50) NULL AFTER name
      `);
            console.log('Added floor column successfully.');
        } else {
            console.log('Column floor already exists.');
        }
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        conn.release();
        process.exit();
    }
}

applyMigration();
