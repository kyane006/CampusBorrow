async function runUpdateTests() {
    console.log('Starting Update Route Security Tests...\n');
    const baseUrl = 'http://localhost:3001/api';

    const userA_email = `owner_${Date.now()}@ucr.edu`;
    const userB_email = `hacker_${Date.now()}@ucr.edu`;

    let tokenA = '';
    let tokenB = '';
    let savedItemId = '';

    try {
        // Create and Login User A 
        const regA = await fetch(`${baseUrl}/users/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Owner', email: userA_email, password: 'password123' })
        });
        if (!regA.ok) {
            const text = await regA.text();
            throw new Error(`Register A failed (${regA.status}): ${text}`);
        }

        const loginA = await fetch(`${baseUrl}/users/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userA_email, password: 'password123' })
        });
        if (!loginA.ok) {
            const text = await loginA.text();
            throw new Error(`Login A failed (${loginA.status}): ${text}`);
        }
        tokenA = (await loginA.json()).token;

        //  User A creates an item
        const itemRes = await fetch(`${baseUrl}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
            body: JSON.stringify({ title: 'Original Title', category: 'Electronics', price: 50, description: 'Testing updates', photo: '/noimage.jpg' })
        });
        if (!itemRes.ok) {
            const text = await itemRes.text();
            throw new Error(`Create item failed (${itemRes.status}): ${text}`);
        }
        savedItemId = (await itemRes.json())._id;
        console.log(`-> Setup Complete: User A created item ID ${savedItemId}\n`);

        // TEST 1: User A updates their own item 
        console.log('Test 1: User A attempts to update their own item...');
        const updateRes = await fetch(`${baseUrl}/items/${savedItemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenA}` },
            body: JSON.stringify({ price: 40 })
        });

        if (updateRes.ok) {
            console.log('-> PASS: Server allowed User A to update the item.\n');
        } else {
            const text = await updateRes.text();
            console.log(`-> FAIL: Something went wrong (${updateRes.status}): ${text}\n`);
        }

        // SETUP: Create and Login User B 
        const regB = await fetch(`${baseUrl}/users/register`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Hacker', email: userB_email, password: 'password123' })
        });
        if (!regB.ok) {
            const text = await regB.text();
            throw new Error(`Register B failed (${regB.status}): ${text}`);
        }

        const loginB = await fetch(`${baseUrl}/users/login`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userB_email, password: 'password123' })
        });
        if (!loginB.ok) {
            const text = await loginB.text();
            throw new Error(`Login B failed (${loginB.status}): ${text}`);
        }
        tokenB = (await loginB.json()).token;

        // User B tries to update User A's item 
        console.log('Test 2: User B attempts to update User A\'s item...');
        const hackRes = await fetch(`${baseUrl}/items/${savedItemId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${tokenB}` },
            body: JSON.stringify({ price: 1 })
        });

        if (hackRes.status === 403) {
            console.log('-> PASS: Security worked. Server blocked User B from editing.\n');
        } else {
            const text = await hackRes.text();
            console.log(`-> FAIL: Security hole! (${hackRes.status}): ${text}\n`);
        }

    } catch (error) {
        console.error('TEST SCRIPT CRASHED:', error.message);
    }
}

runUpdateTests();