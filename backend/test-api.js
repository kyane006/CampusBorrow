// test-api.js
const API_URL = 'http://localhost:3001/api/items';

async function runTests() {
    console.log('Starting API Tests...\n');

    try {
   
        console.log('Running Test 1: GET /api/items');
        const getRes = await fetch(API_URL);
        if (getRes.ok) {
            console.log('PASS: Server responded with status 200 OK');
        } else {
            console.error('FAIL: Server rejected the GET request');
        }

        console.log('\nRunning Test 2: POST /api/items');
        const postRes = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                lenderId: '5f8d04b3b54764421b7156d1', 
                title: 'Automated Test Case Item',
                photo: 'https://example.com/test-image.jpg',
                category: 'Electronics',
                price: 5,
                description: 'Testing the POST route programmatically.',
                isAvailable: true
            })
        });

        let createdItemId = null;

        if (postRes.status === 201) {
            console.log('PASS: Server responded with status 201 Created');
            const createdItem = await postRes.json();
            createdItemId = createdItem._id;
            console.log(`   -> Item created with ID: ${createdItemId}`);
        } else {
            console.error('FAIL: Server failed to create the item');
            return; // Stop the script if we can't create an item
        }

        console.log(`\nRunning Test 3: DELETE /api/items/${createdItemId}`);
        const deleteRes = await fetch(`${API_URL}/${createdItemId}`, {
            method: 'DELETE'
        });

        if (deleteRes.ok) {
            console.log('PASS: Server responded with status 200 OK');
            console.log('   -> Item deleted successfully. Database is clean.');
        } else {
            console.error('FAIL: Server failed to delete the item');
        }

    } catch (error) {
        console.error('\n CRITICAL ERROR: Could not connect to the server.', error.message);
        console.log('Make sure "node server.js" is running in another terminal tab!');
    }
}

runTests();