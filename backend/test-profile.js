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

        // --- 2. TEST 1: Update Profile Successfully (PUT) ---
        console.log('Test 1: Updating user profile (name, bio, location, and photo)...');
        const updateRes = await fetch(`${baseUrl}/users/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({ 
                name: 'Updated Tester',
                bio: 'I am a test user making sure the dashboard works.', 
                campusLocation: 'Main Library',
                photo: 'https://imgur.com/test-avatar.png'
            })
        });

        const updateText = await updateRes.text();
        if (updateRes.ok) {
            console.log('-> PASS: Server accepted the PUT request to update profile.\n');
        } else {
            console.log(`-> FAIL: Server returned status ${updateRes.status}: ${updateText}\n`);
        }

        // --- 3. TEST 2: Fetch Saved Profile Data (GET) ---
        console.log('Test 2: Fetching the saved user profile to verify data (GET)...');
        const getRes = await fetch(`${baseUrl}/users/profile`, {
            method: 'GET',
            headers: { 
                'Authorization': `Bearer ${token}` 
            }
        });

        const getText = await getRes.text();
        if (getRes.ok) {
            const data = JSON.parse(getText);
            console.log('-> PASS: Server successfully returned the profile.');
            console.log(`   Verification - Name: "${data.name}"`);
            console.log(`   Verification - Bio: "${data.bio}"`);
            console.log(`   Verification - Location: "${data.campusLocation}"`);
            console.log(`   Verification - Photo: "${data.photo}"\n`);
        } else {
            console.log(`-> FAIL: Server returned status ${getRes.status}: ${getText}\n`);
        }

        // --- 4. TEST 3: Reject Access without Token ---
        console.log('Test 3: Attempting to access profile without an auth token...');
        const noTokenRes = await fetch(`${baseUrl}/users/profile`, {
            method: 'GET', // Testing the GET route this time
            headers: { 'Content-Type': 'application/json' } 
        });

        const noTokenText = await noTokenRes.text();
        if (noTokenRes.status === 401 || noTokenRes.status === 403) {
            console.log('-> PASS: Security worked. Server blocked unauthorized profile access.\n');
        } else {
            console.log(`-> FAIL: Security hole! Expected 401/403 block, got ${noTokenRes.status}: ${noTokenText}\n`);
        }

    } catch (error) {
        console.error('TEST SCRIPT CRASHED:', error.message);
    }
}

runProfileTests();