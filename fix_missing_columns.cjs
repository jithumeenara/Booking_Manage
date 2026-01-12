
const mysql = require("mysql2/promise");

const config = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT) || 3306,
    ssl: { rejectUnauthorized: false }
};

async function runMigration() {
    if (!config.host) {
        console.error("Missing DB credentials. Run with: $env:MYSQL_HOST='...'; node fix_missing_columns.cjs");
        process.exit(1);
    }

    console.log(`Connecting to ${config.host}...`);
    let conn;
    try {
        conn = await mysql.createConnection(config);

        const columns = [
            { name: 'total_bill_amount', def: 'DECIMAL(10,2) DEFAULT NULL' },
            { name: 'bill_no', def: 'VARCHAR(100) DEFAULT NULL' },
            { name: 'billed_date', def: 'DATETIME DEFAULT NULL' },
            { name: 'num_of_bills', def: 'INT DEFAULT 1' },
            { name: 'status', def: "ENUM('pending', 'complete', 'payment_completed', 'payment_pending') DEFAULT 'pending'" }
        ];

        for (const col of columns) {
            console.log(`Checking column ${col.name}...`);
            try {
                await conn.query(`SELECT ${col.name} FROM bookings LIMIT 1`);
                console.log(`  - Exists.`);
            } catch (e) {
                console.log(`  - MISSING! Adding ${col.name}...`);
                try {
                    await conn.query(`ALTER TABLE bookings ADD COLUMN ${col.name} ${col.def}`);
                    console.log(`  - Added successfully.`);
                } catch (addErr) {
                    console.error(`  - Failed to add: ${addErr.message}`);
                }
            }
        }

        // Also check if 'status' enum has 'payment_pending'
        console.log("Checking status enum values...");
        try {
            const [rows] = await conn.query("SHOW COLUMNS FROM bookings LIKE 'status'");
            const type = rows[0].Type; // e.g. "enum('pending','complete')"
            if (!type.includes('payment_pending')) {
                console.log("  - 'payment_pending' missing from ENUM. Updating...");
                await conn.query(`ALTER TABLE bookings MODIFY COLUMN status ENUM('pending', 'complete', 'payment_completed', 'payment_pending') DEFAULT 'pending'`);
                console.log("  - Updated status ENUM.");
            } else {
                console.log("  - Status ENUM looks correct.");
            }
        } catch (e) {
            console.error("Failed to check status enum:", e.message);
        }

        console.log("Done.");
    } catch (err) {
        console.error("Connection failed:", err.message);
    } finally {
        if (conn) await conn.end();
    }
}

runMigration();
