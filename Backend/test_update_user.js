import http from 'http';

const makeRequest = (path, method, body, token) => {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    if (token) options.headers['Authorization'] = `Bearer ${token}`;

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: data ? JSON.parse(data) : {} }); } catch (e) { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
};

const run = async () => {
  try {
    const timestamp = Date.now();
    const user = { fullname: `Tester ${timestamp}`, email: `tester${timestamp}@example.com`, password: 'password123', designation: 'Developer'};
    console.log('Signing up...');
    const s = await makeRequest('/api/users/signup','POST', user);
    console.log('Signup status', s.status, s.body?.message || s.body);
    if (s.status !== 201) return console.error('Signup failed');

    const token = s.body.token;
    const id = s.body.user.id;

    console.log('Updating user fullname...');
    const upd = await makeRequest(`/api/users/${id}`,'PUT',{ fullname: 'Updated Name', designation: 'Manager' }, token);
    console.log('Update status', upd.status, upd.body);

    console.log('Fetching users as proof of change...');
    const users = await makeRequest('/api/users','GET',null,token);
    console.log('Get users status', users.status);
    console.log('First user sample:', users.body?.users?.slice(-1)[0]);
  } catch (err) { console.error(err); }
};

run();