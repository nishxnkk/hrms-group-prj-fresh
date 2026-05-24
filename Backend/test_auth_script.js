import http from 'http';

const makeRequest = (path, method, body, token) => {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({ status: res.statusCode, body: JSON.parse(data || '{}') });
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

const runTests = async () => {
    try {
        console.log("Starting Auth Tests...");
        const timestamp = Date.now();
        const user = {
            fullname: `Test User ${timestamp}`,
            email: `test${timestamp}@example.com`,
            password: "password123"
        };

        // 1. Signup
        console.log("\n1. Testing Signup...");
        const signupRes = await makeRequest('/api/users/signup', 'POST', user);
        console.log("Signup Status:", signupRes.status);
        if (signupRes.status !== 201) throw new Error("Signup failed");

        // 2. Login
        console.log("\n2. Testing Login...");
        const loginRes = await makeRequest('/api/users/login', 'POST', { email: user.email, password: user.password });
        console.log("Login Status:", loginRes.status);
        if (loginRes.status !== 200) throw new Error("Login failed");
        const token = loginRes.body.token;
        if (!token) throw new Error("No token received");
        console.log("Token received");

        // 3. Access Protected Route (Logout is protected)
        // We'll use logout as the protected route test for now, but ideally we'd have another one.
        // But since logout invalidates the token, we can test that.

        // 4. Logout
        console.log("\n3. Testing Logout (Protected Route)...");
        const logoutRes = await makeRequest('/api/users/logout', 'POST', {}, token);
        console.log("Logout Status:", logoutRes.status);
        if (logoutRes.status !== 200) throw new Error("Logout failed");

        // 5. Access Protected Route with Blacklisted Token
        console.log("\n4. Testing Access with Blacklisted Token...");
        const failRes = await makeRequest('/api/users/logout', 'POST', {}, token);
        console.log("Access Status:", failRes.status);
        if (failRes.status !== 401) throw new Error("Blacklist check failed");
        console.log("Access correctly denied");

        console.log("\n✅ All tests passed successfully!");
    } catch (error) {
        console.error("\n❌ Test Failed:", error.message);
    }
};

// Wait for server to start (manual delay if needed, but we assume server is running)
// For this script, we assume the server is ALREADY running.
runTests();
