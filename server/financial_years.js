import { pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';

// GET all financial years
export async function getFinancialYears(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM financial_years ORDER BY start_date DESC');
        return res.json(rows);
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Server error' });
    }
}

// POST create financial year
export async function createFinancialYear(req, res) {
    try {
        const { name, start_date, end_date } = req.body;

        if (!name || !start_date || !end_date) {
            return res.status(400).json({ error: 'Name, start date, and end date are required' });
        }

        const id = uuidv4();
        await pool.query(
            'INSERT INTO financial_years (id, name, start_date, end_date) VALUES (?, ?, ?, ?)',
            [id, name, start_date, end_date]
        );

        return res.status(201).json({ id, ok: true });
    } catch (e) {
        if (e.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Financial year name already exists' });
        }
        console.error(e);
        return res.status(500).json({ error: 'Server error' });
    }
}

// PUT set active financial year
export async function setActiveFinancialYear(req, res) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const { id } = req.params;

        // Set all to inactive
        await conn.query('UPDATE financial_years SET is_active = FALSE');

        // Set selected to active
        await conn.query('UPDATE financial_years SET is_active = TRUE WHERE id = ?', [id]);

        await conn.commit();
        return res.json({ ok: true });
    } catch (e) {
        await conn.rollback();
        console.error(e);
        return res.status(500).json({ error: 'Server error' });
    } finally {
        conn.release();
    }
}

// DELETE financial year
export async function deleteFinancialYear(req, res) {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM financial_years WHERE id = ?', [id]);
        return res.json({ ok: true });
    } catch (e) {
        console.error(e);
        return res.status(500).json({ error: 'Server error' });
    }
}
