const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory mock database (as direct external TCP MySQL connection is unavailable in sandbox)
const users = [];

// Seed default administrator user
async function seedDefaultUsers() {
  const adminHash = await bcrypt.hash('admin123', 10);
  users.push({
    user_id: 1,
    full_name: 'Administrator',
    email: 'admin@ngo.org',
    password_hash: adminHash,
    role: 'admin',
    status: 'active',
    created_at: new Date().toISOString()
  });
  console.log('[AI Studio] Initialized mock database with demo user (admin@ngo.org / admin123)');
}
seedDefaultUsers();

// 1. User Registration Functionality (from login and registration schema)
app.post('/api/register', async (req, res) => {
  const { full_name, email, password, role } = req.body;

  // Field verification
  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields (Name, Email, Password, Role) are required." });
  }

  try {
    // Check if the user's email already exists
    const existingUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Secure password hashing before saving (bcryptjs)
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert new user into in-memory store
    const newUser = {
      user_id: users.length + 1,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      role: role.trim(),
      status: 'active',
      created_at: new Date().toISOString()
    };
    users.push(newUser);

    return res.status(201).json({
      message: "User registered successfully!",
      user: {
        user_id: newUser.user_id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// 2. User Login Functionality
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    return res.status(200).json({
      message: "Login successful!",
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        status: user.status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

// 3. User Listing (Admin oversight)
app.get('/api/users', (req, res) => {
  const sanitized = users.map(({ password_hash, ...rest }) => rest);
  res.json({ users: sanitized });
});

// Route aliases to ensure all links throughout the pages work consistently
const routeAliases = [
  { paths: ['/', '/index', '/index.html', '/ngo', '/ngo.html'], target: 'index.html' },
  { paths: ['/about', '/about.html', '/about%20us.html', '/about us.html'], target: 'about us.html' },
  { paths: ['/campaign', '/campaign.html', '/compaign', '/compaign.html'], target: 'compaign.html' },
  { paths: ['/contact', '/contact.html', '/contact-us.html', '/contact%20us.html', '/contact us.html'], target: 'contact us.html' },
  { paths: ['/join', '/join.html', '/join-us.html', '/join%20us.html', '/join us.html', '/contact-join.html'], target: 'join us.html' },
  { paths: ['/projects', '/projects.html', '/work', '/work.html'], target: 'projects.html' },
  { paths: ['/features', '/features.html'], target: 'features.html' },
  { paths: ['/media', '/media.html'], target: 'media.html' },
  { paths: ['/donate', '/donate.html'], target: 'donate.html' },
  { paths: ['/blog', '/blog.html'], target: 'blog.html' },
  { paths: ['/login', '/login.html'], target: 'login.html' },
  { paths: ['/register', '/register.html'], target: 'register.html' }
];

routeAliases.forEach(route => {
  route.paths.forEach(p => {
    app.get(p, (req, res) => {
      res.sendFile(path.join(__dirname, route.target));
    });
  });
});

// Serve static assets from project root
app.use(express.static(__dirname));

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}`);
});
