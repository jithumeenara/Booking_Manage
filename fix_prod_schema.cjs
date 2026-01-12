
const mysql = require("mysql2/promise");

// Read config from Environment Variables
const config = {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    port: Number(process.env.MYSQL_PORT) || 3306,
    multipleStatements: true,
    ssl: {
        rejectUnauthorized: false // Often needed for cloud DBs (Aiven/Render)
    }
};

async function runMigration() {
    if (!config.host || !config.user || !config.password || !config.database) {
        console.error("ERROR: Missing environment variables. Please set MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, and MYSQL_DATABASE.");
        process.exit(1);
    }

    console.log(`Connecting to database at ${config.host}...`);
    let conn;
    try {
        conn = await mysql.createConnection(config);

        // Check if migration is needed
        const [cols] = await conn.query("SHOW COLUMNS FROM bookings LIKE 'id'");
        if (cols[0].Type.includes('char(36)')) {
            console.log("Database is already patched! id is char(36).");
            return;
        }

        console.log("Step 1: Adding temporary column...");
        await conn.query("ALTER TABLE bookings ADD COLUMN id_new CHAR(36)");

        console.log("Step 2: Converting data...");
        try {
            await conn.query("UPDATE bookings SET id_new = BIN_TO_UUID(id)");
        } catch (e) {
            console.log("BIN_TO_UUID failed (older MySQL?), falling back to HEX formatting...");
            await conn.query(`
        UPDATE bookings SET id_new = LOWER(CONCAT(
          SUBSTR(HEX(id), 1, 8), '-',
          SUBSTR(HEX(id), 9, 4), '-',
          SUBSTR(HEX(id), 13, 4), '-',
          SUBSTR(HEX(id), 17, 4), '-',
          SUBSTR(HEX(id), 21)
        ))
      `);
        }

        console.log("Step 3: Switching PRIMARY KEY...");
        await conn.query("ALTER TABLE bookings DROP PRIMARY KEY");
        await conn.query("ALTER TABLE bookings MODIFY id_new CHAR(36) NOT NULL PRIMARY KEY");

        console.log("Step 4: Cleanup...");
        await conn.query("ALTER TABLE bookings DROP COLUMN id");
        await conn.query("ALTER TABLE bookings CHANGE COLUMN id_new id CHAR(36) NOT NULL");

        console.log("Migration successful! bookings.id is now CHAR(36).");
    } catch (err) {
        console.error("Migration failed:", err.message);
    } finally {
        if (conn) await conn.end();
    }
}

runMigration();
