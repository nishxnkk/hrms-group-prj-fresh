import pool from '../db/db.js';
// Using global fetch (Node 18+)
const fetchGlobal = global.fetch || fetch;

const API = 'http://localhost:3000/api';

const randomEmail = `admin.test.${Date.now()}@example.com`;

const signup = async () => {
  const res = await fetchGlobal(`${API}/users/signup`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ fullname: 'Script Admin', email: randomEmail, password: 'Password1!', role: 'Admin' })
  });
  return res.json();
};

const login = async (email) => {
  const res = await fetchGlobal(`${API}/users/login`, {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ email, password: 'Password1!' })
  });
  return res.json();
};

const fetchUsers = async (token) => {
  const res = await fetchGlobal(`${API}/users`, { headers: { Authorization: `Bearer ${token}` } });
  return res.json();
};

const main = async () => {
  try {
    console.log('Signing up temporary admin...');
    const s = await signup();
    if (!s || !s.token) {
      console.log('Signup might have failed (maybe admin exists), attempt to login with existing email');
      // Try to find any admin in DB
      const { rows } = await pool.query("SELECT email FROM users WHERE role='Admin' LIMIT 1");
      const email = rows[0]?.email;
      if (!email) { console.error('No admin exists and signup failed.'); process.exit(1); }
      const l = await login(email);
      const token = l.token;
      const users = await fetchUsers(token);
      console.log('API response sample:', users.success ? users.users.slice(0,5) : users);
      const counts = {};
      if (users.success && users.users) {
        users.users.forEach(u => { counts[u.status] = (counts[u.status] || 0) + 1; });
        console.table(counts);
      }
      process.exit(0);
    }

    console.log('Logging in newly created admin...');
    const l = await login(randomEmail);
    const token = l.token;
    const users = await fetchUsers(token);
    console.log('API response sample:', users.success ? users.users.slice(0,5) : users);
    const counts = {};
    if (users.success && users.users) {
      users.users.forEach(u => { counts[u.status] = (counts[u.status] || 0) + 1; });
      console.table(counts);
    }
    process.exit(0);
  } catch (err) {
    console.error('Error checking presence API', err);
    process.exit(1);
  }
};

main();
