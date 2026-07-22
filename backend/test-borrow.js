async function runBorrowTests() {
    console.log('Starting Borrow & Review Route Tests...\n');
    const baseUrl = 'http://localhost:3001/api';
    
    const lenderEmail = `lender_${Date.now()}@student.edu`;
    const borrowerEmail = `borrower_${Date.now()}@student.edu`;
    let lenderToken, borrowerToken, lenderId, borrowerId, listingId, borrowId;

    try {
        // --- 1. SETUP: Create Lender & Borrower ---
        console.log('Setup: Registering Lender and Borrower...');
        
        // Register & Login Lender
        await fetch(`${baseUrl}/users/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Lender Guy', email: lenderEmail, password: 'password123' }) });
        const lenderLogin = await fetch(`${baseUrl}/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: lenderEmail, password: 'password123' }) });
        const lenderData = await lenderLogin.json();
        lenderToken = lenderData.token;
        lenderId = lenderData.userId;

        // Register & Login Borrower
        await fetch(`${baseUrl}/users/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: 'Borrower Dude', email: borrowerEmail, password: 'password123' }) });
        const borrowerLogin = await fetch(`${baseUrl}/users/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: borrowerEmail, password: 'password123' }) });
        const borrowerData = await borrowerLogin.json();
        borrowerToken = borrowerData.token;
        borrowerId = borrowerData.userId;

        // Create a Listing (Owned by Lender) - Added photo field to satisfy Mongoose
        const itemRes = await fetch(`${baseUrl}/items`, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lenderToken}` },
            body: JSON.stringify({ 
                title: 'Test Calculator', 
                category: 'Electronics', 
                price: 10, 
                description: 'Works fine', 
                photo: '/noimage.jpg', 
                isAvailable: true 
            })
        });
        
        const itemData = await itemRes.json();
        
        // Check if item creation failed
        if (!itemRes.ok) {
            throw new Error(`Item creation failed! Check your Listing schema rules: ${JSON.stringify(itemData)}`);
        }
        
        listingId = itemData._id;
        console.log('-> Setup Complete. Users and Item created.\n');


        // --- TEST 1: Request to Borrow ---
        console.log('Test 1: Borrower requests the item (POST /api/borrows)...');
        const borrowRes = await fetch(`${baseUrl}/borrows`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${borrowerToken}` },
            body: JSON.stringify({ 
                listingId: listingId, 
                lenderId: lenderId, 
                pickupDate: new Date().toISOString(), 
                returnDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
            })
        });
        
        const borrowText = await borrowRes.text();
        if (borrowRes.ok) {
            borrowId = JSON.parse(borrowText).borrow._id;
            console.log('-> PASS: Borrow request created with status Pending.\n');
        } else {
            console.log(`-> FAIL: ${borrowRes.status}: ${borrowText}\n`);
            return; 
        }


        // --- TEST 2: Approve the Borrow Request ---
        console.log('Test 2: Lender approves the request (PUT /api/borrows/:id)...');
        const approveRes = await fetch(`${baseUrl}/borrows/${borrowId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lenderToken}` },
            body: JSON.stringify({ status: 'Approved' })
        });

        if (approveRes.ok) {
            console.log('-> PASS: Borrow status changed to Approved.\n');
        } else {
            console.log(`-> FAIL: ${approveRes.status}: ${await approveRes.text()}\n`);
        }


        // --- TEST 3: Complete the Transaction ---
        console.log('Test 3: Mark transaction as Completed (PUT /api/borrows/:id)...');
        const completeRes = await fetch(`${baseUrl}/borrows/${borrowId}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${lenderToken}` },
            body: JSON.stringify({ status: 'Completed' })
        });

        if (completeRes.ok) {
            console.log('-> PASS: Borrow status changed to Completed.\n');
        } else {
            console.log(`-> FAIL: ${completeRes.status}: ${await completeRes.text()}\n`);
        }


        // --- TEST 4: Leave a Review ---
        console.log('Test 4: Borrower leaves a review for the Lender (POST /api/reviews)...');
        const reviewRes = await fetch(`${baseUrl}/reviews`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${borrowerToken}` },
            body: JSON.stringify({ 
                borrowId: borrowId, 
                revieweeId: lenderId, 
                rating: 5, 
                comment: 'Super fast and easy to borrow from!' 
            })
        });

        if (reviewRes.ok) {
            console.log('-> PASS: Review successfully saved.\n');
        } else {
            console.log(`-> FAIL: ${reviewRes.status}: ${await reviewRes.text()}\n`);
        }


        // --- TEST 5: Fetch Reviews ---
        console.log('Test 5: Lender checks their received reviews (GET /api/reviews/me)...');
        const getReviewsRes = await fetch(`${baseUrl}/reviews/me`, {
            method: 'GET', headers: { 'Authorization': `Bearer ${lenderToken}` }
        });

        if (getReviewsRes.ok) {
            const reviews = await getReviewsRes.json();
            console.log('-> PASS: Reviews fetched successfully.');
            console.log(`   Verification - Found ${reviews.length} review(s).`);
            console.log(`   Verification - Comment: "${reviews[0].comment}"\n`);
        } else {
            console.log(`-> FAIL: ${getReviewsRes.status}: ${await getReviewsRes.text()}\n`);
        }

    } catch (error) {
        console.error('\nTEST SCRIPT CRASHED:', error.message);
    }
}

runBorrowTests();