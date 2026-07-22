async function runJwtTests() {
    console.log('Starting JWT Security Tests...\n');
    const baseUrl = 'http://localhost:3001/api';
    
    // Create a random email so the test works every time you run it
    const testEmail = `jwt_user_${Date.now()}@ucr.edu`;
    let savedToken = '';
    let savedItemId = '';

    try {
        // register
        console.log('Test 1: POST /api/users/register');
        const regRes = await fetch(`${baseUrl}/users/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Security Tester', email: testEmail, password: 'password123' })
        });
        await regRes.json();
        console.log('-> User registered.\n');

        // LOGIN (Grab the token
        console.log('Test 2: POST /api/users/login');
        const loginRes = await fetch(`${baseUrl}/users/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: testEmail, password: 'password123' })
        });
        const loginData = await loginRes.json();
        savedToken = loginData.token; 
        console.log(`-> Logged in! Grabbed VIP Token: ${savedToken.substring(0, 15)}...\n`);

        // Use the token to pass the bouncer
        console.log('Test 3: POST /api/items (With Token)');
        const itemRes = await fetch(`${baseUrl}/items`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${savedToken}` 
            },
            body: JSON.stringify({
                title: 'CS110 Notes',
                category: 'Supplies',
                price: 15,
                description: 'Testing the JWT lock',
                photo: '/noimage.jpg'
            })
        });
        const itemData = await itemRes.json();
        
        if (itemRes.ok) {
            savedItemId = itemData._id;
            console.log(`-> PASS: Bouncer accepted token. Item created! ID: ${savedItemId}\n`);
        } else {
           console.log(`-> FAIL: MongoDB rejected it: ${itemData.error}\n`);
        }

        // delete item
        console.log(`Test 4: DELETE /api/items/${savedItemId} (With Token)`);
        const delRes = await fetch(`${baseUrl}/items/${savedItemId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${savedToken}`
            }
        });
        
        if (delRes.ok) {
            console.log('-> PASS: Bouncer accepted token. Item deleted!\n');
        } else {
            console.log('-> FAIL: Bouncer blocked deletion.\n');
        }

    } catch (error) {
        console.error('TEST SCRIPT CRASHED:', error);
    }
}

runJwtTests();