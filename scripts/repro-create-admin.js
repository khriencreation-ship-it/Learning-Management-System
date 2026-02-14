
// Native fetch is available in modern Node.js

async function run() {
    const url = 'http://localhost:3000/api/admin/sub-admins';
    // Generate a random email to avoid collision initially
    const email = `test-admin-${Date.now()}@example.com`;

    console.log(`Attempting to create admin with email: ${email}`);

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: email,
                password: 'Password!123',
                fullName: 'Test Admin',
                phone: '1234567890'
            })
        });

        const text = await res.text();
        console.log('Status:', res.status);
        console.log('Response Body:', text);

    } catch (e) {
        console.error('Fetch Error:', e);
    }
}

// Check if fetch is available (Node 18+), else warn
if (!global.fetch) {
    console.log('Node environment might need fetch polyfill, trying anyway...');
}

run();
