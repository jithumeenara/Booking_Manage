import { pool } from './db.js';
import bcrypt from 'bcryptjs';

async function checkUser() {
    try {
        console.log('Checking database connection and user...\n');

        // Test database connection
        const [tables] = await pool.query('SHOW TABLES');
        console.log('✓ Database connected successfully');
        console.log('Tables found:', tables.map(t => Object.values(t)[0]).join(', '));
        console.log('');

        // Check if user exists
        const email = 'jithulr44@gmail.com';
        const [users] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            console.log(`✗ User '${email}' does NOT exist in the database`);
            console.log('You need to Sign Up first to create an account.\n');

            // Let's create the user
            console.log('Creating user account...');
            const { v4: uuidv4 } = await import('uuid');
            const id = uuidv4();
            const password_hash = await bcrypt.hash('123456', 10);

            await pool.query(
                'INSERT INTO users (id, email, password_hash, name, role) VALUES (?,?,?,?,?)',
                [id, email, password_hash, 'Jithul', 'admin']
            );

            console.log('✓ User account created successfully!');
            console.log('  Email:', email);
            console.log('  Password: 123456');
            console.log('  Role: admin');
        } else {
            const user = users[0];
            console.log('✓ User found in database:');
            console.log('  ID:', user.id);
            console.log('  Email:', user.email);
            console.log('  Name:', user.name);
            console.log('  Role:', user.role);
            console.log('  Password Hash:', user.password_hash.substring(0, 30) + '...');
            console.log('');

            // Test password
            const testPassword = '123456';
            const passwordMatches = await bcrypt.compare(testPassword, user.password_hash);

            if (passwordMatches) {
                console.log(`✓ Password '${testPassword}' matches the hash in database`);
                console.log('Login should work correctly.');
            } else {
                console.log(`✗ Password '${testPassword}' does NOT match the hash in database`);
                console.log('The password stored in database is different.');
                console.log('');
                console.log('Updating password to 123456...');
                const new_hash = await bcrypt.hash('123456', 10);
                await pool.query('UPDATE users SET password_hash = ? WHERE email = ?', [new_hash, email]);
                console.log('✓ Password updated successfully!');
            }
        }

    } catch (error) {
        console.error('✗ Error:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
        process.exit(0);
    }
}

checkUser();
