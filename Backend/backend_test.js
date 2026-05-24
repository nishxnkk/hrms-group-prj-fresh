const API_URL = 'http://localhost:3000/api/users';

async function runTest() {
    try {
        const timestamp = Date.now();
        const newUser = {
            fullname: `Test User ${timestamp}`,
            email: `test${timestamp}@example.com`,
            password: 'Password123!',
            designation: 'Tester'
        };

        console.log('1. Signing up new user...');
        const signupRes = await fetch(`${API_URL}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newUser)
        });

        if (!signupRes.ok) {
            throw new Error(`Signup failed: ${signupRes.status} ${await signupRes.text()}`);
        }
        const signupData = await signupRes.json();
        console.log('   Signup successful. ID:', signupData.user.id);

        console.log('2. Logging in...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: newUser.email, password: newUser.password })
        });

        if (!loginRes.ok) {
            throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
        }
        const loginData = await loginRes.json();
        const token = loginData.token;
        console.log('   Login successful. Token received.');

        console.log('3. Fetching all users...');
        const usersRes = await fetch(`${API_URL}`, {
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('   Response status:', usersRes.status);

        if (!usersRes.ok) {
            throw new Error(`Fetch users failed: ${usersRes.status} ${await usersRes.text()}`);
        }

        const usersData = await usersRes.json();
        console.log('   Response data keys:', Object.keys(usersData));

        if (usersData.users) {
            console.log('   Users found:', usersData.users.length);
            if (usersData.users.length > 0) {
                console.log('   First user sample:', JSON.stringify(usersData.users[0]));
            }
        } else {
            console.error('   ERROR: "users" key missing in response!');
            console.log('   Full response:', JSON.stringify(usersData, null, 2));
        }

    } catch (error) {
        console.error('Script Error:', error.message);
    }
}

runTest();
