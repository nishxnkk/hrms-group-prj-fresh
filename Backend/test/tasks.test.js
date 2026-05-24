import request from 'supertest';
import { expect } from 'chai';
import app from '../app.js';
import pool from '../db/db.js';

let adminToken;
let userId;
let taskId;

describe('Tasks API', function() {
  this.timeout(10000);

  before(async () => {
    // create an admin user via signup
    const adminRes = await request(app).post('/api/users/signup').send({ fullname: 'Admin', email: `admin-${Date.now()}@test`, password: 'Password1!', role: 'Admin' });
    expect(adminRes.status).to.equal(201);
    adminToken = adminRes.body.token;

    // create a normal user to assign to
    const userRes = await request(app).post('/api/users/signup').send({ fullname: 'Worker', email: `worker-${Date.now()}@test`, password: 'Password1!' });
    expect(userRes.status).to.equal(201);
    userId = userRes.body.user.id;
  });

  after(async () => {
    // cleanup tasks and users created
    try {
      if (taskId) await pool.query('DELETE FROM tasks WHERE id = $1', [taskId]);
      await pool.query('DELETE FROM users WHERE email LIKE $1 OR email LIKE $2', [`admin-%@test`, `worker-%@test`]);
    } catch (err) {
      console.error('Cleanup error', err);
    }
  });

  it('should allow admin to create a task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Test Task', description: 'desc', assigned_to: userId, due_date: new Date().toISOString().split('T')[0] });

    expect(res.status).to.equal(201);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.have.property('id');
    taskId = res.body.data.id;
  });

  it('should return tasks for admin', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array');
  });

  it('should allow a normal user to view another user\'s tasks when specified', async () => {
    // create another user and a task assigned to them
    const otherRes = await request(app).post('/api/users/signup').send({ fullname: 'Other', email: `other-${Date.now()}@test`, password: 'Password1!' });
    expect(otherRes.status).to.equal(201);
    const otherId = otherRes.body.user.id;

    const taskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ title: 'Other Task', assigned_to: otherId, due_date: new Date().toISOString().split('T')[0] });
    expect(taskRes.status).to.equal(201);

    // Login as a normal user (worker) and request other user's tasks
    const { rows } = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    const jwt = await import('jsonwebtoken');
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    const res = await request(app).get(`/api/tasks?assignedTo=${otherId}`).set('Authorization', `Bearer ${token}`);
    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data).to.be.an('array');
    // cleanup
    await pool.query('DELETE FROM tasks WHERE assigned_to = $1', [otherId]);
    await pool.query('DELETE FROM users WHERE id = $1', [otherId]);
  });

  it('should allow assigned user to update status to completed', async () => {
    // get worker token by signing a JWT for the user id
    const { rows } = await pool.query('SELECT id, role FROM users WHERE id = $1', [userId]);
    const user = rows[0];
    const jwtLib = await import('jsonwebtoken');
    const token = jwtLib.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1h' });

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed', percent_completed: 100 });

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.status).to.equal('completed');
  });

  it('should let admin certify when marking as completed', async () => {
    // decode admin token to get admin id
    const jwtLib = await import('jsonwebtoken');
    const decoded = jwtLib.verify(adminToken, process.env.JWT_SECRET || 'secret');
    const adminId = decoded.id;

    const res = await request(app)
      .put(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'completed' });

    expect(res.status).to.equal(200);
    expect(res.body.success).to.equal(true);
    expect(res.body.data.status).to.equal('completed');
    expect(res.body.data.certified_by).to.equal(adminId);
    expect(res.body.data.certified_at).to.not.equal(null);
  });
});
