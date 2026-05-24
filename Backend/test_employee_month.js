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
                try {
                    const parsedBody = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, body: parsedBody });
                } catch (e) {
                    console.error("Failed to parse response:", data);
                    resolve({ status: res.statusCode, body: data });
                }
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
        console.log("Starting Employee of Month API Tests...");
        const timestamp = Date.now();
        const user = {
            fullname: `Test Manager ${timestamp}`,
            email: `manager${timestamp}@example.com`,
            password: "password123",
            designation: "Manager"
        };

        const employee = {
            fullname: `Star Employee ${timestamp}`,
            email: `employee${timestamp}@example.com`,
            password: "password123",
            designation: "Employee"
        };

        // 1. Signup Manager
        console.log("\n1. creating Manager...");
        const signupRes = await makeRequest('/api/users/signup', 'POST', user);
        if (signupRes.status !== 201) throw new Error(`Signup failed: ${JSON.stringify(signupRes.body)}`);
        const managerId = signupRes.body.user.id;

        // 2. Signup Employee
        console.log("\n2. Creating Employee...");
        const empSignupRes = await makeRequest('/api/users/signup', 'POST', employee);
        if (empSignupRes.status !== 201) throw new Error("Employee signup failed");
        const employeeId = empSignupRes.body.user.id;

        // 3. Login Manager
        console.log("\n3. Logging in Manager...");
        const loginRes = await makeRequest('/api/users/login', 'POST', { email: user.email, password: user.password });
        if (loginRes.status !== 200) throw new Error("Login failed");
        const token = loginRes.body.token;
        console.log("Token received");

        // 4. Get All Users
        console.log("\n4. Testing Get All Users...");
        const usersRes = await makeRequest('/api/users', 'GET', null, token);
        console.log("Get Users Status:", usersRes.status);
        if (usersRes.status !== 200) throw new Error("Get users failed");
        if (!Array.isArray(usersRes.body)) throw new Error("Users not array");
        console.log(`Found ${usersRes.body.length} users`);

        // 5. Create Employee of Month
        console.log("\n5. Creating Employee of Month...");
        const eomData = {
            userId: employeeId,
            description: "Exceptional performance this month!",
            month: "December 2025",
            teamMembers: [
                { userId: managerId, role: "Mentor" }
            ]
        };
        const createRes = await makeRequest('/api/employee-of-month', 'POST', eomData, token);
        console.log("Create EOM Status:", createRes.status);
        if (createRes.status !== 201) throw new Error(`Create EOM failed: ${JSON.stringify(createRes.body)}`);
        const eomId = createRes.body.data.id;
        console.log("Created EOM ID:", eomId);

        // 6. Get Current Employee of Month
        console.log("\n6. Fetching Current EOM...");
        const getRes = await makeRequest('/api/employee-of-month/current', 'GET', null, token);
        console.log("Get Current Status:", getRes.status);
        if (getRes.status !== 200) throw new Error("Get current EOM failed");
        if (getRes.body.data.id !== eomId) throw new Error("ID mismatch");
        if (getRes.body.data.team.length !== 1) throw new Error("Team count mismatch");
        console.log("Verified Current EOM and Team");

        // 7. Add Team Member
        console.log("\n7. Adding Team Member...");
        const teamRes = await makeRequest(`/api/employee-of-month/${eomId}/team`, 'POST', {
            userId: employeeId, // Adding self as a joke/test
            role: "Self-Motivator"
        }, token);
        console.log("Add Team Status:", teamRes.status);
        if (teamRes.status !== 201) throw new Error("Add team member failed");
        const teamMemberId = teamRes.body.data.id;

        // 8. Delete Team Member
        console.log("\n8. Deleting Team Member...");
        const delRes = await makeRequest(`/api/employee-of-month/team/${teamMemberId}`, 'DELETE', null, token);
        console.log("Delete Status:", delRes.status);
        if (delRes.status !== 200) throw new Error("Delete team member failed");

        console.log("\n✅ All Employee of Month backend tests passed!");
    } catch (error) {
        console.error("\n❌ Test Failed:", error.message);
        if (error.stack) console.error(error.stack);
    }
};

runTests();
