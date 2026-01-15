import { pool } from './server/db.js';

async function checkSchema() {
    try {
        const [rows] = await pool.query("DESCRIBE training_halls");
        console.log("Columns in training_halls:");
        console.table(rows);
    } catch (error) {
        console.error("Error describing table:", error);
    } finally {
        process.exit();
    }
}

checkSchema();
