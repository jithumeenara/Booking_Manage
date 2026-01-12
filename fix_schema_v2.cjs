
const mysql = require("mysql2/promise");
const config = {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "Mysql2login&",
    database: process.env.MYSQL_DATABASE || "acsti_db",
    multipleStatements: true
};

async function runMigration() {
    const conn = await mysql.createConnection(config);
    try {
        console.log("Step 1: Adding temporary column...");
        await conn.query("ALTER TABLE bookings ADD COLUMN id_new CHAR(36)");

        console.log("Step 2: Converting data...");
        // Try BIN_TO_UUID (MySQL 8.0+)
        try {
            await conn.query("UPDATE bookings SET id_new = BIN_TO_UUID(id)");
        } catch (e) {
            console.log("BIN_TO_UUID failed (older MySQL?), falling back to HEX formatting...");
            // Fallback: HEX() gives 32 chars. We need to insert dashes to make it a valid UUID string 8-4-4-4-12
            // HEX(id) -> 09565C...
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
        await conn.end();
    }
}

runMigration();
