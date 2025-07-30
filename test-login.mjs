import fetch from 'node-fetch';

async function main() {
  const email = 'test@example.com';
  const password = 'password';

  // 1. Get CSRF token
  const csrfRes = await fetch('http://localhost:3001/api/auth/csrf');
  const { csrfToken } = await csrfRes.json();
  const cookie = csrfRes.headers.get('set-cookie');

  // 2. Sign in
  const res = await fetch('http://localhost:3001/api/auth/callback/credentials', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cookie': cookie,
    },
    body: new URLSearchParams({
      email,
      password,
      csrfToken,
      callbackUrl: 'http://localhost:3001/tasks',
      redirect: false,
    }),
  });

  console.log('Login response:', res.status, res.statusText);
  const sessionCookie = res.headers.get('set-cookie');
  console.log('Session cookie:', sessionCookie);

  // 3. Check session
  const sessionRes = await fetch('http://localhost:3001/api/auth/session', {
    headers: {
      'Cookie': sessionCookie
    }
  });
  const session = await sessionRes.json();
  console.log('Session:', session);
}

main();
