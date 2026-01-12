import { pool } from './server/db.js';

const conn = await pool.getConnection();

try {
    console.log('🔄 Starting database migration...\n');

    // Step 1: Create a backup table
    console.log('Step 1: Creating backup table...');
    await conn.query('DROP TABLE IF EXISTS bookings_backup');
    await conn.query('CREATE TABLE bookings_backup LIKE bookings');
    await conn.query('INSERT INTO bookings_backup SELECT * FROM bookings');
    const [backupCount] = await conn.query('SELECT COUNT(*) as count FROM bookings_backup');
    console.log(`✅ Backed up ${backupCount[0].count} records\n`);

    // Step 2: Drop the old table
    console.log('Step 2: Dropping old bookings table...');
    await conn.query('DROP TABLE bookings');
    console.log('✅ Old table dropped\n');

    // Step 3: Create new table with correct schema
    console.log('Step 3: Creating new bookings table with correct schema...');
    await conn.query(`
      CREATE TABLE bookings (
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
    console.log('✅ New table created\n');

    // Step 4: Migrate data with UUID conversion
    console.log('Step 4: Migrating data from backup...');
    const [oldRecords] = await conn.query('SELECT * FROM bookings_backup');

    for (const record of oldRecords) {
        // Convert binary UUID to string format
        let uuidString;
        if (record.id instanceof Buffer) {
            // Convert BINARY(16) to UUID string
            const hex = record.id.toString('hex');
            uuidString = `${hex.substr(0, 8)}-${hex.substr(8, 4)}-${hex.substr(12, 4)}-${hex.substr(16, 4)}-${hex.substr(20, 12)}`;
        } else {
            uuidString = record.id;
        }

        await conn.query(`
        INSERT INTO bookings (
          id, department_agency, contact_person_name, contact_person_email, contact_person_phone,
          start_date, end_date, num_participants, needs_accommodation, needs_food, needs_training_hall,
          number_of_halls, purpose, created_at, updated_at, status, total_bill_amount, completed_at,
          financial_year, bill_no, billed_date, num_of_bills, booked_via_link
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
            uuidString, record.department_agency, record.contact_person_name, record.contact_person_email,
            record.contact_person_phone, record.start_date, record.end_date, record.num_participants,
            record.needs_accommodation, record.needs_food, record.needs_training_hall, record.number_of_halls,
            record.purpose, record.created_at, record.updated_at, record.status, record.total_bill_amount,
            record.completed_at, record.financial_year, record.bill_no, record.billed_date,
            record.num_of_bills, record.booked_via_link
        ]);
    }

    const [newCount] = await conn.query('SELECT COUNT(*) as count FROM bookings');
    console.log(`✅ Migrated ${newCount[0].count} records\n`);

    // Step 5: Verify the new schema
    console.log('Step 5: Verifying new schema...');
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'acsti_db' 
      AND TABLE_NAME = 'bookings' 
      AND COLUMN_NAME = 'id';
    `);
    console.log(`✅ ID column type: ${columns[0].COLUMN_TYPE}\n`);

    console.log('🎉 Migration completed successfully!\n');
    console.log('Note: The backup table "bookings_backup" has been kept for safety.');
    console.log('You can drop it manually once you verify everything works correctly.');

} catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\n⚠️  Attempting to restore from backup...');
    try {
        await conn.query('DROP TABLE IF EXISTS bookings');
        await conn.query('CREATE TABLE bookings LIKE bookings_backup');
        await conn.query('INSERT INTO bookings SELECT * FROM bookings_backup');
        console.log('✅ Restored from backup successfully');
    } catch (restoreError) {
        console.error('❌ Failed to restore:', restoreError);
    }
} finally {
    conn.release();
    await pool.end();
}
