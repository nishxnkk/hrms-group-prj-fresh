const API_URL = 'http://localhost:3000/api/users';

async function runTest() {
    try {
        const timestamp = Date.now();
        // User 1
        const user1 = {
            fullname: `User One ${timestamp}`,
            email: `user1_${timestamp}@example.com`,
            password: 'Password123!',
            designation: 'Tester'
        };

        // User 2
        const user2 = {
            fullname: `User Two ${timestamp}`,
            email: `user2_${timestamp}@example.com`,
            password: 'Password123!',
            designation: 'Tester'
        };

        console.log('--- CREATING USERS ---');
        // Signup User 1
        const res1 = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user1)
        });
        const data1 = await res1.json();
        console.log(`User 1 Created: ID ${data1.user.id}`);

        // Signup User 2
        const res2 = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user2)
        });
        const data2 = await res2.json();
        console.log(`User 2 Created: ID ${data2.user.id}`);


        console.log('\n--- TESTING USER 2 ACCESS ---');
        // Login User 2
        const loginRes2 = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: user2.email, password: user2.password })
        });
        const loginData2 = await loginRes2.json();
        const token2 = loginData2.token;
        console.log('User 2 Logged In. Token:', token2 ? 'Received' : 'MISSING');

        // User 2 Fetch All Users
        const usersRes = await fetch(`${API_URL}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token2}` }
        });

        if (!usersRes.ok) throw new Error(`Fetch failed: ${usersRes.status}`);

        const usersData = await usersRes.json();
        console.log(`User 2 Fetched Users: Found ${usersData.users.length}`);

        const canSeeUser1 = usersData.users.find(u => u.id === data1.user.id);
        console.log(`User 2 can see User 1? ${canSeeUser1 ? 'YES' : 'NO'}`);

    } catch (error) {
        console.error('TEST FAILED:', error);
    }
}

runTest();
