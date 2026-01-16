import { pool } from './db.js';
import { v4 as uuidv4 } from 'uuid';

// Get all training halls
export async function getTrainingHalls(req, res) {
    try {
        const { activeOnly } = req.query;
        let query = 'SELECT * FROM training_halls';
        let params = [];

        if (activeOnly === 'true') {
            query += ' WHERE is_active = TRUE';
        }

        query += ' ORDER BY name ASC';

        const [rows] = await pool.query(query, params);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching training halls:', error);
        res.status(500).json({ error: 'Failed to fetch training halls' });
    }
}

// Create new training hall
export async function createTrainingHall(req, res) {
    try {
        const { name, code, capacity, is_active } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'Name and Code are required' });
        }

        // Check unique code
        const [existing] = await pool.query('SELECT id FROM training_halls WHERE code = ?', [code]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'A training hall with this code already exists' });
        }

        const id = uuidv4();
        await pool.query(
            `INSERT INTO training_halls (id, name, floor, code, capacity, is_active) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, name, req.body.floor || null, code, capacity || 0, is_active !== undefined ? is_active : true]
        );

        const [newHall] = await pool.query('SELECT * FROM training_halls WHERE id = ?', [id]);
        res.status(201).json(newHall[0]);
    } catch (error) {
        console.error('Error creating training hall:', error);
        res.status(500).json({ error: error.message });
    }
}

// Update training hall
export async function updateTrainingHall(req, res) {
    try {
        const { id } = req.params;
        const { name, code, capacity, is_active } = req.body;

        if (!name || !code) {
            return res.status(400).json({ error: 'Name and Code are required' });
        }

        // Check unique code (excluding self)
        const [existing] = await pool.query('SELECT id FROM training_halls WHERE code = ? AND id != ?', [code, id]);
        if (existing.length > 0) {
            return res.status(409).json({ error: 'Another training hall with this code already exists' });
        }

        await pool.query(
            `UPDATE training_halls SET name = ?, floor = ?, code = ?, capacity = ?, is_active = ? WHERE id = ?`,
            [name, req.body.floor || null, code, capacity || 0, is_active, id]
        );

        const [updatedHall] = await pool.query('SELECT * FROM training_halls WHERE id = ?', [id]);
        if (updatedHall.length === 0) {
            return res.status(404).json({ error: 'Training hall not found' });
        }
        res.json(updatedHall[0]);
    } catch (error) {
        console.error('Error updating training hall:', error);
        res.status(500).json({ error: 'Failed to update training hall' });
    }
}

// Delete training hall
export async function deleteTrainingHall(req, res) {
    try {
        const { id } = req.params;
        const [result] = await pool.query('DELETE FROM training_halls WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Training hall not found' });
        }

        res.json({ message: 'Training hall deleted successfully' });
    } catch (error) {
        // Check for foreign key constraint errors (if allocated to bookings)
        if (error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(400).json({ error: 'Cannot delete: This hall is allocated to bookings.' });
        }
        console.error('Error deleting training hall:', error);
        res.status(500).json({ error: 'Failed to delete training hall' });
    }
}

// Get allocations for a specific booking
export async function getBookingAllocations(req, res) {
    try {
        const { bookingId } = req.params;
        const [rows] = await pool.query(`
      SELECT th.* 
      FROM training_halls th
      JOIN booking_halls bh ON th.id = bh.hall_id
      WHERE bh.booking_id = ?
    `, [bookingId]);

        res.json(rows);
    } catch (error) {
        console.error('Error fetching allocations:', error);
        res.status(500).json({ error: 'Failed to fetch allocations' });
    }
}

// Get schedule for a specific hall (Future & Current)
// Get schedule for a specific hall (Future & Current)
export async function getHallSchedule(req, res) {
    try {
        const { id } = req.params;
        const { startFrom } = req.query; // Expects ISO string

        // Default to *now* server-time if not provided, but ideally client sends their "start of day"
        const queryStart = startFrom || new Date().toISOString();

        const query = `
            SELECT b.id, b.department_agency, b.start_date, b.end_date, b.contact_person_name
            FROM bookings b
            JOIN booking_halls bh ON b.id = bh.booking_id
            WHERE bh.hall_id = ?
            AND b.end_date >= ?
            ORDER BY b.start_date ASC
        `;

        const [rows] = await pool.query(query, [id, queryStart]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching hall schedule:', error);
        res.status(500).json({ error: 'Failed to fetch hall schedule' });
    }
}

// Remove allocation
export async function deleteHallAllocation(req, res) {
    try {
        const { hallId, bookingId } = req.params;
        await pool.query(
            'DELETE FROM booking_halls WHERE hall_id = ? AND booking_id = ?',
            [hallId, bookingId]
        );
        res.json({ message: 'Allocation removed successfully' });
    } catch (error) {
        console.error('Error removing allocation:', error);
        res.status(500).json({ error: 'Failed to remove allocation' });
    }
}

// Check hall availability for a date range
export async function checkHallAvailability(req, res) {
    try {
        const { startDate, endDate, excludeBookingId } = req.query;

        if (!startDate || !endDate) {
            return res.status(400).json({ error: 'Start date and end date are required' });
        }

        let query = `
            SELECT DISTINCT bh.hall_id
            FROM booking_halls bh
            JOIN bookings b ON bh.booking_id = b.id
            WHERE (
                (b.start_date < ? AND b.end_date > ?)
            )
        `;
        const params = [endDate, startDate];

        if (excludeBookingId) {
            query += ' AND b.id != ?';
            params.push(excludeBookingId);
        }

        const [rows] = await pool.query(query, params);
        const occupiedHallIds = rows.map(row => row.hall_id);

        res.json({ occupiedHallIds });
    } catch (error) {
        console.error('Error checking availability:', error);
        res.status(500).json({ error: 'Failed to check availability' });
    }
}
