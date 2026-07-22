// --- AUTHENTICATION TESTS ---
async function testAuth() {
    console.log('\nRunning Test 3: POST /api/users/register');
    
    // Generate a unique email so the test doesn't fail on repeat runs
    const testEmail = `testuser_${Date.now()}@ucr.edu`; 
    const testPassword = 'securepassword123';

    try {
        // 1. Test Registration
        const regRes = await fetch('http://localhost:3001/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Automated Tester',
                email: testEmail,
                password: testPassword
            })
        });
        
        const regData = await regRes.json();
        
        if (regRes.ok) {
            console.log(`PASS: User registered successfully (ID: ${regData.userId})`);
        } else {
            console.log('FAIL: Server rejected registration ->', regData.message);
            return; // Stop if registration fails
        }

        console.log('\nRunning Test 4: POST /api/users/login');
        
        // 2. Test Login
        const loginRes = await fetch('http://localhost:3001/api/users/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });
        
        const loginData = await loginRes.json();
        
        if (loginRes.ok) {
            console.log(`PASS: User logged in successfully (ID: ${loginData.userId})`);
        } else {
            console.log('FAIL: Server rejected login ->', loginData.message);
        }

    } catch (error) {
        console.error('CRITICAL ERROR during Auth Tests:', error.message);
    }
}

// Execute the auth tests
testAuth();