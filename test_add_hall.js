import fetch from 'node-fetch';

async function testAddHall() {
    try {
        const res = await fetch('http://localhost:3001/api/training-halls', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: "Test Hall " + Date.now(),
                code: "TH" + Date.now(),
                floor: "First Floor",
                capacity: 100,
                is_active: true
            })
        });

        const text = await res.text();
        console.log("Status:", res.status);
        try {
            const data = JSON.parse(text);
            console.log("Response:", JSON.stringify(data, null, 2));
        } catch {
            console.log("Response (Text):", text.substring(0, 500));
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

testAddHall();
