async function runAuthTests() {
    console.log('Starting Auth Tests...\n');
    const baseUrl = 'http://localhost:3001/api/users';
    
    // Generates a unique email every time so the test doesn't crash on "email already exists"
    const testEmail = `testuser_${Date.now()}@ucr.edu`;

    try {
        // --- 1. TEST REGISTRATION ---
        console.log('Running Test 1: POST /api/users/register');
        const regResponse = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Auth Test User', email: testEmail, password: 'password123' })
        });
        const regData = await regResponse.json();
        
        if (regResponse.ok) {
            console.log(`PASS: Server responded with status ${regResponse.status}`);
            console.log(`   -> User registered with ID: ${regData.userId}\n`);
        } else {
            console.log(`FAIL: Registration rejected -> ${regData.message} | Reason: ${regData.error}\n`);
        }

        // --- 2. TEST LOGIN ---
        console.log('Running Test 2: POST /api/users/login');
        const loginResponse = await fetch(`${baseUrl}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: 'password123' })
        });
        const loginData = await loginResponse.json();

        if (loginResponse.ok) {
            console.log(`PASS: Server responded with status ${loginResponse.status}`);
            console.log(`   -> Logged in successfully! Retrieved User ID: ${loginData.userId}\n`);
        } else {
            console.log(`FAIL: Login rejected -> ${loginData.message}\n`);
        }

        console.log('--- AUTH TESTS COMPLETE ---');

    } catch (error) {
        console.error('TEST SCRIPT CRASHED:', error.message);
    }
}

runAuthTests();