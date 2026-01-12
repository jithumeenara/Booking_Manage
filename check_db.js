import { pool } from './server/db.js';

try {
    // Check the current table structure
    const [columns] = await pool.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'acsti_db' 
      AND TABLE_NAME = 'bookings' 
      AND COLUMN_NAME = 'id';
    `);

    console.log('Current ID column structure:', columns);

    // If the column is not CHAR(36), we need to fix it
    if (columns.length > 0) {
        const col = columns[0];
        console.log(`\nColumn Type: ${col.COLUMN_TYPE}`);
        console.log(`Max Length: ${col.CHARACTER_MAXIMUM_LENGTH}`);

        if (col.COLUMN_TYPE === 'char(36)') {
            console.log('\n✅ ID column is correctly configured as CHAR(36)');
        } else {
            console.log('\n⚠️  ID column is not CHAR(36), attempting to fix...');

            // First, check if there are any existing records
            const [counts] = await pool.query('SELECT COUNT(*) as count FROM bookings');
            console.log(`\nExisting records: ${counts[0].count}`);

            if (counts[0].count === 0) {
                // Drop and recreate the table if no data
                console.log('No data in table, recreating with correct schema...');
                await pool.query('DROP TABLE IF EXISTS bookings');
                console.log('✅ Table dropped successfully');
            } else {
                console.log('⚠️  Table has data. Manual migration needed.');
            }
        }
    }

} catch (error) {
    console.error('Error:', error);
} finally {
    await pool.end();
}
