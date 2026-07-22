async function runProfileTests() {
    console.log('Starting User Profile Route Tests...\n');
    const baseUrl = 'http://localhost:3001/api';
    
    const userEmail = `profile_test_${Date.now()}@student.edu`;
    let token = '';

    try {
        // --- 1. SETUP: Create and Login User ---
        console.log('Setup: Registering and logging in new user...');
        const regRes = await fetch(`${baseUrl}/users/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Profile Tester', email: userEmail, password: 'password123' })
        });
        if (!regRes.ok) {
            throw new Error(`Register failed (${regRes.status}): ${await regRes.text()}`);
        }

        const loginRes = await fetch(`${baseUrl}/users/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userEmail, password: 'password123' })
        });
        if (!loginRes.ok) {
            throw new Error(`Login failed (${loginRes.status}): ${await loginRes.text()}`);
        }
        
        token = (await loginRes.json()).token;
        console.log('-> Setup Complete.\n');

        // --- 2. TEST 1: Update Profile Successfully ---
        console.log('Test 1: Updating user profile (bio and location)...');
        const updateRes = await fetch(`${baseUrl}/users/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                bio: 'I am a test user making sure the dashboard works.', 
                campusLocation: 'Main Library',
                name: 'Updated Tester'
            })
        });

        const updateText = await updateRes.text();
        if (updateRes.ok) {
            console.log('-> PASS: Profile updated successfully.');
            const data = JSON.parse(updateText);
            console.log(`   Verification - Bio saved as: "${data.user.bio}"`);
            console.log(`   Verification - Location saved as: "${data.user.campusLocation}"\n`);
        } else {
            console.log(`-> FAIL: Server returned status ${updateRes.status}: ${updateText}\n`);
        }

        // --- 3. TEST 2: Reject Update without Token ---
        console.log('Test 2: Attempting to update profile without an auth token...');
        const noTokenRes = await fetch(`${baseUrl}/users/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' }, // Intentionally omitting the Bearer token
            body: JSON.stringify({ bio: 'Hacker trying to bypass security' })
        });

        const noTokenText = await noTokenRes.text();
        if (noTokenRes.status === 401 || noTokenRes.status === 403) {
            console.log('-> PASS: Security worked. Server blocked unauthorized profile edit.\n');
        } else {
            console.log(`-> FAIL: Security hole! Expected 401/403 block, got ${noTokenRes.status}: ${noTokenText}\n`);
        }

    } catch (error) {
        console.error('TEST SCRIPT CRASHED:', error.message);
    }
}

runProfileTests();