const assert = require('node:assert/strict');
const app = require('../server');
const { db } = require('../database');

const server = app.listen(0);
const baseUrl = `http://127.0.0.1:${server.address().port}`;

async function request(path, options = {}, cookie) {
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${baseUrl}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await response.json() : await response.text();
  return { response, body, cookie: response.headers.get('set-cookie') };
}

(async () => {
  try {
    let result = await request('/healthz');
    assert.equal(result.response.status, 200);
    assert.equal(result.body.database, 'sqlite');

    for (const route of ['/', '/about', '/campaign', '/contact', '/join', '/projects', '/features', '/media', '/donate', '/blog', '/login', '/register']) {
      result = await request(route);
      assert.equal(result.response.status, 200, `Expected ${route} to be available`);
    }

    for (const endpoint of ['/api/about', '/api/media', '/api/projects', '/api/stats']) {
      result = await request(endpoint);
      assert.equal(result.response.status, 200, `Expected ${endpoint} to be public`);
    }

    result = await request('/api/users');
    assert.equal(result.response.status, 401);

    const uniqueEmail = `smoke-${Date.now()}@example.com`;
    result = await request('/api/volunteers', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ full_name: 'Smoke Volunteer', email: uniqueEmail, phone: '1234567890', message: 'Smoke test application' })
    });
    assert.equal(result.response.status, 201);

    result = await request('/api/contact', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Smoke Contact', email: uniqueEmail, message: 'Smoke test inquiry' })
    });
    assert.equal(result.response.status, 201);

    result = await request('/api/donations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ donor_name: 'Smoke Donor', donor_email: uniqueEmail, amount: 10, cause: 'Testing' })
    });
    assert.equal(result.response.status, 201);

    result = await request('/api/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ full_name: 'Smoke Tester', email: uniqueEmail, password: 'StrongPass123!', role: 'Member' })
    });
    assert.equal(result.response.status, 201);
    const userId = result.body.user.user_id;

    result = await request('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'StrongPass123!' })
    });
    assert.equal(result.response.status, 200);
    let userCookie = result.cookie.split(';')[0];

    result = await request('/api/me/password', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ current_password: 'StrongPass123!', new_password: 'NewStrongPass123!' })
    }, userCookie);
    assert.equal(result.response.status, 200);
    userCookie = result.cookie.split(';')[0];

    result = await request('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'StrongPass123!' })
    });
    assert.equal(result.response.status, 401);

    result = await request('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'NewStrongPass123!' })
    });
    assert.equal(result.response.status, 200);

    result = await request('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'admin@ngo.org', password: process.env.ADMIN_PASSWORD || 'admin123' })
    });
    assert.equal(result.response.status, 200);
    const cookie = result.cookie.split(';')[0];

    result = await request('/api/users', {}, cookie);
    assert.equal(result.response.status, 200);
    assert.ok(Array.isArray(result.body.users));

    result = await request(`/api/users/${userId}/status`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status: 'inactive' })
    }, cookie);
    assert.equal(result.response.status, 200);

    result = await request('/api/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: uniqueEmail, password: 'NewStrongPass123!' })
    });
    assert.equal(result.response.status, 401);

    result = await request('/api/me', {}, userCookie);
    assert.equal(result.response.status, 401);

    result = await request('/api/projects', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title: 'Unauthorised project', description: 'Should not be accepted' })
    });
    assert.equal(result.response.status, 401);

    result = await request('/api/donations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ donor_name: 'Smoke Tester', donor_email: uniqueEmail, amount: -1 })
    });
    assert.equal(result.response.status, 400);

    result = await request('/api/donations', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ donor_name: 'Verified Donor', donor_email: uniqueEmail, amount: 25, cause: 'Phase 5 test', currency: 'USD' })
    });
    assert.equal(result.response.status, 201);
    assert.equal(result.body.donation.status, 'pending');
    const pendingDonationId = result.body.donation.id;

    result = await request(`/api/donations/${pendingDonationId}/verify`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ provider_id: 'manual_provider_123', provider_status: 'paid', currency: 'USD' })
    }, cookie);
    assert.equal(result.response.status, 200);
    assert.equal(result.body.donation.status, 'paid');
    assert.ok(result.body.donation.receipt_number);

    result = await request('/api/donations');
    assert.equal(result.response.status, 200);
    assert.ok(result.body.donations.some(donation => donation.id === pendingDonationId && donation.status === 'paid'));

    console.log('API smoke tests passed.');
  } finally {
    server.close();
    db.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});