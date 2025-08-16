// DELETE!!!

// A quick script to generate a bcrypt hash for a password.
const bcrypt = require('bcryptjs');

// IMPORTANT: Replace 'password123' with the password you want to use for your static test user.
const password = 'password123';
const saltRounds = 10;
const hash = bcrypt.hashSync(password, saltRounds);

console.log('Password to hash:', password);
console.log('Generated Bcrypt Hash:', hash);