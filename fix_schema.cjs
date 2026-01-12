
const mysql = require("mysql2/promise");
const config = {
    host: process.env.MYSQL_HOST || "127.0.0.1",
    user: process.env.MYSQL_USER || "root",
    password: process.env.MYSQL_PASSWORD || "Mysql2login&",
    database: process.env.MYSQL_DATABASE || "acsti_db",
    multipleStatements: true
};
async function fixSchema() {
    try {
        const conn = await mysql.createConnection(config);
        console.log("Altering bookings table...");
        await conn.query("ALTER TABLE bookings MODIFY id CHAR(36) NOT NULL");
        console.log("Success! bookings.id converted to CHAR(36).");
        await conn.end();
    } catch (err) {
        console.error("ERROR:", err.message);
    }
}
fixSchema();
