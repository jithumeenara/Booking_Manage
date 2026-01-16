
import fetch from 'node-fetch';

async function testUpdate() {
    try {
        // 1. Get a booking ID
        const listRes = await fetch('http://localhost:3001/api/bookings');
        const bookings = await listRes.json();

        if (bookings.length === 0) {
            console.log('No bookings found to update.');
            return;
        }

        const bookingId = bookings[0].id;
        console.log(`Testing with booking ID: ${bookingId}`);

        // 2. Initial state
        console.log('Initial Base:', bookings[0].bill_base_amount);
        console.log('Initial GST:', bookings[0].bill_gst_amount);

        // 3. Update with new values
        const payload = {
            bill_base_amount: 500.50,
            bill_gst_amount: 90.50,
            total_bill_amount: 591.00
        };

        const updateRes = await fetch(`http://localhost:3001/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const updateJson = await updateRes.json();
        console.log('Update Response:', updateJson);

        // 4. Verify update
        const verifyRes = await fetch(`http://localhost:3001/api/bookings/`); // List again to check
        const bookingsAfter = await verifyRes.json();
        const updated = bookingsAfter.find(b => b.id === bookingId);

        console.log('Updated Base:', updated.bill_base_amount);
        console.log('Updated GST:', updated.bill_gst_amount);

        if (updated.bill_base_amount == 500.50 && updated.bill_gst_amount == 90.50) {
            console.log('SUCCESS: API updated the fields correctly.');
        } else {
            console.log('FAILURE: Fields did not match expected values.');
        }

    } catch (err) {
        console.error('Test failed:', err);
    }
}

testUpdate();
