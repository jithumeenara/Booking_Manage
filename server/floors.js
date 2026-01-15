import { pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';

export async function getFloors(req, res) {
    try {
        const [rows] = await pool.query('SELECT * FROM floors ORDER BY display_order ASC, name ASC');
        res.json(rows);
    } catch (error) {
        console.error('Error fetching floors:', error);
        res.status(500).json({ error: 'Failed to fetch floors' });
    }
}

export async function createFloor(req, res) {
    try {
        const { name, display_order } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const id = uuidv4();
        await pool.query('INSERT INTO floors (id, name, display_order) VALUES (?, ?, ?)', [
            id, name, display_order || 0
        ]);

        const [newFloor] = await pool.query('SELECT * FROM floors WHERE id = ?', [id]);
        res.status(201).json(newFloor[0]);
    } catch (error) {
        console.error('Error creating floor:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ error: 'Floor name already exists' });
        }
        res.status(500).json({ error: 'Failed to create floor' });
    }
}

export async function updateFloor(req, res) {
    try {
        const { id } = req.params;
        const { name, display_order } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        await pool.query('UPDATE floors SET name = ?, display_order = ? WHERE id = ?', [
            name, display_order || 0, id
        ]);

        // Update existing training halls to match new floor name if they used the old one (optional sync)
        // For now we just rely on the text match.

        const [updated] = await pool.query('SELECT * FROM floors WHERE id = ?', [id]);
        res.json(updated[0]);
    } catch (error) {
        console.error('Error updating floor:', error);
        res.status(500).json({ error: 'Failed to update floor' });
    }
}

export async function deleteFloor(req, res) {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM floors WHERE id = ?', [id]);
        res.json({ message: 'Floor deleted' });
    } catch (error) {
        console.error('Error deleting floor:', error);
        res.status(500).json({ error: 'Failed to delete floor' });
    }
}
