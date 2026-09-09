const express = require('express');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const PORT = 3000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// IN-MEMORY DATA STORES (MOCK DATABASE)
// ==========================================

// 1. Users Store
const users = [];

// 2. Volunteers Store
const volunteers = [
  {
    id: 1,
    full_name: 'Rahul Sharma',
    email: 'rahul.s@example.com',
    phone: '9876543210',
    message: 'I am a software engineer and would love to help teach digital literacy skills to young students.',
    status: 'Pending Review',
    created_at: new Date('2026-03-01T10:00:00Z').toISOString()
  },
  {
    id: 2,
    full_name: 'Anita Desai',
    email: 'anita.desai@example.com',
    phone: '9812345678',
    message: 'Interested in weekend meal distribution and organizing health awareness camps in rural communities.',
    status: 'Approved',
    created_at: new Date('2026-03-04T14:30:00Z').toISOString()
  }
];

// 3. Contact Inquiries Store
const inquiries = [
  {
    id: 1,
    name: 'Vikram Patel',
    email: 'vikram.p@example.com',
    phone: '9123456789',
    subject: 'Partnership Inquiry for Corporate CSR',
    message: 'We represent an IT firm looking to sponsor 10 digital classrooms under your Girls Education drive.',
    created_at: new Date('2026-03-05T09:15:00Z').toISOString()
  }
];

// 4. Donations Store
const donations = [
  { id: 1, donor_name: 'Rohan Gupta', donor_email: 'rohan.g@example.com', amount: 2500, cause: 'Girls Education', created_at: new Date('2026-03-02T11:00:00Z').toISOString() },
  { id: 2, donor_name: 'Sneha Kulkarni', donor_email: 'sneha.k@example.com', amount: 5000, cause: 'Child Nutrition', created_at: new Date('2026-03-06T16:20:00Z').toISOString() },
  { id: 3, donor_name: 'Aarav Mehta', donor_email: 'aarav@example.com', amount: 1000, cause: 'Elderly Care', created_at: new Date('2026-03-08T08:45:00Z').toISOString() }
];

// 5. About Us Dynamic Content Store
const aboutContent = {
  storyText: 'Founded in 2015, our journey started with a small group of passionate volunteers addressing local community issues. Over the years, we have grown into a fully dedicated NGO, reaching thousands of individuals across multiple regions and driving lasting social change.',
  storyImage: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=800&q=80',
  values: [
    { id: 1, name: 'Integrity', description: 'Operating transparently and responsibly in all actions.' },
    { id: 2, name: 'Respect', description: 'Valuing the diversity and dignity of every individual.' },
    { id: 3, name: 'Empathy', description: 'Understanding and addressing the challenges faced by our communities.' }
  ],
  programs: [
    { id: 1, name: 'Education & Child Support', description: 'Providing school supplies, scholarships, and free tutoring.' },
    { id: 2, name: 'Health & Nutrition', description: 'Organizing regular free health checkup camps and clean water distribution.' },
    { id: 3, name: 'Welfare & Development', description: 'Offering skill development and vocational training for women.' }
  ],
  team: [
    {
      id: 1,
      name: 'John Doe',
      designation: 'Founder & Executive Director',
      bio: 'John has over 12 years of experience managing non-profit organizations and overseeing community welfare projects globally.'
    },
    {
      id: 2,
      name: 'Jane Smith',
      designation: 'Program Coordinator',
      bio: 'Jane coordinates field operations, ensuring all resources reach the targeted communities efficiently.'
    }
  ]
};

// 6. Media Store
const mediaData = {
  pressReleases: [
    { id: 1, title: 'NGO Launched Digital Classrooms Initiative', date: '2026-01-15', description: 'Supporting underprivileged children with tablets and interactive multimedia learning kits in 15 rural schools.' },
    { id: 2, title: 'Annual Healthcare Camp Treats 5,000+ Villagers', date: '2026-02-20', description: 'Free cardiology, dental, and general diagnostic camps conducted with partner medical teams.' }
  ],
  mediaCoverage: [
    { id: 1, title: 'National Daily: The Grassroots Movement Transforming Education', url: 'https://example.com/press/education-feature' },
    { id: 2, title: 'Social Impact Awards 2025: Best Community Outreach', url: 'https://example.com/awards/ngo-spotlight' }
  ],
  galleryImages: [
    { id: 1, url: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&w=600&q=80' },
    { id: 2, url: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80' },
    { id: 3, url: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=600&q=80' },
    { id: 4, url: 'https://images.unsplash.com/photo-1542810634-71277d95dcbb?auto=format&fit=crop&w=600&q=80' }
  ]
};

// 7. Projects Store
const projectsData = [
  {
    id: 1,
    title: 'Digital Classrooms for Rural Girls',
    description: 'Providing solar-powered digital tablets and certified educational curricula to primary schools.',
    status: 'Ongoing',
    startDate: '2026-01-10',
    endDate: '2026-08-15',
    location: 'Community Center Alpha, Pune',
    imageUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 2,
    title: 'Clean Drinking Water Filtration Project',
    description: 'Installation of high-capacity RO filtration plants delivering 20,000 liters of safe drinking water daily.',
    status: 'Completed',
    startDate: '2025-03-01',
    endDate: '2025-11-20',
    location: 'Rural Sector South, Nashik',
    imageUrl: 'https://images.unsplash.com/photo-1541252260730-0412e8e2108e?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 3,
    title: 'Mobile Health Clinics for Senior Citizens',
    description: 'Scheduled weekly wellness visits with medical supplies, free diagnostic kits, and geriatric care.',
    status: 'Upcoming',
    startDate: '2026-10-01',
    endDate: '2027-02-28',
    location: 'Metro Suburbs, Mumbai',
    imageUrl: 'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?auto=format&fit=crop&w=600&q=80'
  }
];

// Seed default administrator user
async function seedDefaultUsers() {
  const adminHash = await bcrypt.hash('admin123', 10);
  users.push({
    user_id: 1,
    full_name: 'Administrator',
    email: 'admin@ngo.org',
    password_hash: adminHash,
    role: 'Admin',
    status: 'active',
    created_at: new Date().toISOString()
  });
  console.log('[AI Studio] Initialized mock database with demo user (admin@ngo.org / admin123)');
}
seedDefaultUsers();

// ==========================================
// 1. AUTHENTICATION & USERS APIS
// ==========================================

// User Registration
app.post('/api/register', async (req, res) => {
  const { full_name, email, password, role } = req.body;

  if (!full_name || !email || !password || !role) {
    return res.status(400).json({ message: "All fields (Name, Email, Password, Role) are required." });
  }

  try {
    const existingUser = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

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

// User Login
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

// Get registered users (for admin panel)
app.get('/api/users', (req, res) => {
  const sanitized = users.map(({ password_hash, ...rest }) => rest);
  res.json({ users: sanitized });
});

// ==========================================
// 2. VOLUNTEERS API (JOIN US)
// ==========================================

app.get('/api/volunteers', (req, res) => {
  res.json({ volunteers });
});

app.post('/api/volunteers', (req, res) => {
  const { full_name, email, phone, message } = req.body;

  if (!full_name || !email || !phone || !message) {
    return res.status(400).json({ message: "All fields are required to apply as a volunteer." });
  }

  const newVolunteer = {
    id: Date.now(),
    full_name: full_name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    message: message.trim(),
    status: 'Pending Review',
    created_at: new Date().toISOString()
  };

  volunteers.push(newVolunteer);
  res.status(201).json({
    message: "Thank you for applying to volunteer! Our team will contact you shortly.",
    volunteer: newVolunteer
  });
});

// ==========================================
// 3. CONTACT INQUIRIES API
// ==========================================

app.get('/api/contact', (req, res) => {
  res.json({ inquiries });
});

app.post('/api/contact', (req, res) => {
  const { name, email, phone, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email, and message are required." });
  }

  const newInquiry = {
    id: Date.now(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: (phone || '').trim(),
    subject: (subject || 'General Inquiry').trim(),
    message: message.trim(),
    created_at: new Date().toISOString()
  };

  inquiries.push(newInquiry);
  res.status(201).json({
    message: "Your message has been sent successfully. We will be in touch soon!",
    inquiry: newInquiry
  });
});

// ==========================================
// 4. DONATIONS & IMPACT STATS API
// ==========================================

app.get('/api/donations', (req, res) => {
  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  res.json({
    donations,
    totalCount: donations.length,
    totalAmount
  });
});

app.post('/api/donations', (req, res) => {
  const { donor_name, donor_email, amount, cause } = req.body;

  if (!donor_name || !donor_email || !amount) {
    return res.status(400).json({ message: "Name, email, and amount are required." });
  }

  const parsedAmount = parseFloat(amount);
  if (isNaN(parsedAmount) || parsedAmount <= 0) {
    return res.status(400).json({ message: "Please enter a valid donation amount." });
  }

  const newDonation = {
    id: Date.now(),
    donor_name: donor_name.trim(),
    donor_email: donor_email.trim().toLowerCase(),
    amount: parsedAmount,
    cause: cause || 'General Fund',
    created_at: new Date().toISOString()
  };

  donations.push(newDonation);
  const totalAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);

  res.status(201).json({
    message: `Thank you for your generous donation of ₹${parsedAmount}! Your tax receipt has been generated.`,
    donation: newDonation,
    totalRaised: totalAmount
  });
});

// Overall NGO Live Stats
app.get('/api/stats', (req, res) => {
  const totalDonationsAmount = donations.reduce((sum, d) => sum + Number(d.amount), 0);
  res.json({
    campaignsHosted: 3067,
    studentsReceived: '10,000+',
    patientsTreated: '50,000+',
    activeVolunteers: volunteers.length + 2000,
    totalRaised: totalDonationsAmount + 50000,
    registeredUsersCount: users.length
  });
});

// ==========================================
// 5. ABOUT US DYNAMIC CONTENT API
// ==========================================

app.get('/api/about', (req, res) => {
  res.json(aboutContent);
});

app.put('/api/about/story', (req, res) => {
  const { storyText, storyImage } = req.body;
  if (storyText) aboutContent.storyText = storyText;
  if (storyImage) aboutContent.storyImage = storyImage;
  res.json({ message: "Story section updated successfully!", aboutContent });
});

// Values CRUD
app.post('/api/about/values', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Value name is required" });
  const val = {
    id: Date.now(),
    name: name.trim(),
    description: (description || 'Promoting community integrity and service.').trim()
  };
  aboutContent.values.push(val);
  res.status(201).json({ message: "Core value added successfully!", value: val, values: aboutContent.values });
});

app.put('/api/about/values/:id', (req, res) => {
  const id = Number(req.params.id);
  const val = aboutContent.values.find(v => v.id === id);
  if (!val) return res.status(404).json({ message: "Value not found" });
  if (req.body.name) val.name = req.body.name;
  if (req.body.description) val.description = req.body.description;
  res.json({ message: "Value updated successfully", values: aboutContent.values });
});

app.delete('/api/about/values/:id', (req, res) => {
  const id = Number(req.params.id);
  aboutContent.values = aboutContent.values.filter(v => v.id !== id);
  res.json({ message: "Core value removed", values: aboutContent.values });
});

// Programs CRUD
app.post('/api/about/programs', (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ message: "Program name is required" });
  const prog = {
    id: Date.now(),
    name: name.trim(),
    description: (description || 'Targeted program providing resources and direct field assistance.').trim()
  };
  aboutContent.programs.push(prog);
  res.status(201).json({ message: "Program added successfully!", program: prog, programs: aboutContent.programs });
});

app.put('/api/about/programs/:id', (req, res) => {
  const id = Number(req.params.id);
  const prog = aboutContent.programs.find(p => p.id === id);
  if (!prog) return res.status(404).json({ message: "Program not found" });
  if (req.body.name) prog.name = req.body.name;
  if (req.body.description) prog.description = req.body.description;
  res.json({ message: "Program updated successfully", programs: aboutContent.programs });
});

app.delete('/api/about/programs/:id', (req, res) => {
  const id = Number(req.params.id);
  aboutContent.programs = aboutContent.programs.filter(p => p.id !== id);
  res.json({ message: "Program deleted successfully", programs: aboutContent.programs });
});

// Team Members CRUD
app.post('/api/about/team', (req, res) => {
  const { name, designation, bio } = req.body;
  if (!name || !designation) return res.status(400).json({ message: "Name and designation are required" });
  const member = {
    id: Date.now(),
    name: name.trim(),
    designation: designation.trim(),
    bio: (bio || 'Dedicated team member driving grassroots social welfare and community outreach.').trim()
  };
  aboutContent.team.push(member);
  res.status(201).json({ message: "Team member added successfully!", member, team: aboutContent.team });
});

app.put('/api/about/team/:id', (req, res) => {
  const id = Number(req.params.id);
  const member = aboutContent.team.find(m => m.id === id);
  if (!member) return res.status(404).json({ message: "Team member not found" });
  if (req.body.name) member.name = req.body.name;
  if (req.body.designation) member.designation = req.body.designation;
  if (req.body.bio) member.bio = req.body.bio;
  res.json({ message: "Team member updated successfully", team: aboutContent.team });
});

app.delete('/api/about/team/:id', (req, res) => {
  const id = Number(req.params.id);
  aboutContent.team = aboutContent.team.filter(m => m.id !== id);
  res.json({ message: "Team member deleted", team: aboutContent.team });
});

// ==========================================
// 6. MEDIA API (PRESS, COVERAGE, GALLERY)
// ==========================================

app.get('/api/media', (req, res) => {
  res.json(mediaData);
});

app.post('/api/media/press', (req, res) => {
  const { title, date, description } = req.body;
  if (!title || !date || !description) return res.status(400).json({ message: "Title, date, and description are required" });
  const item = { id: Date.now(), title: title.trim(), date, description: description.trim() };
  mediaData.pressReleases.unshift(item);
  res.status(201).json({ message: "Press release published successfully", item });
});

app.delete('/api/media/press/:id', (req, res) => {
  const id = Number(req.params.id);
  mediaData.pressReleases = mediaData.pressReleases.filter(i => i.id !== id);
  res.json({ message: "Press release removed" });
});

app.post('/api/media/coverage', (req, res) => {
  const { title, url } = req.body;
  if (!title || !url) return res.status(400).json({ message: "Title and URL are required" });
  const item = { id: Date.now(), title: title.trim(), url: url.trim() };
  mediaData.mediaCoverage.unshift(item);
  res.status(201).json({ message: "Media coverage entry added", item });
});

app.delete('/api/media/coverage/:id', (req, res) => {
  const id = Number(req.params.id);
  mediaData.mediaCoverage = mediaData.mediaCoverage.filter(i => i.id !== id);
  res.json({ message: "Media coverage entry removed" });
});

app.post('/api/media/gallery', (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ message: "Image URL is required" });
  const item = { id: Date.now(), url: url.trim() };
  mediaData.galleryImages.unshift(item);
  res.status(201).json({ message: "Gallery image uploaded successfully", item });
});

app.delete('/api/media/gallery/:id', (req, res) => {
  const id = Number(req.params.id);
  mediaData.galleryImages = mediaData.galleryImages.filter(i => i.id !== id);
  res.json({ message: "Gallery image removed" });
});

// ==========================================
// 7. PROJECTS API
// ==========================================

app.get('/api/projects', (req, res) => {
  res.json({ projects: projectsData });
});

app.post('/api/projects', (req, res) => {
  const { title, description, status, location, startDate, endDate, imageUrl } = req.body;
  if (!title || !description) return res.status(400).json({ message: "Title and description are required" });
  const newProject = {
    id: Date.now(),
    title: title.trim(),
    description: description.trim(),
    status: status || 'Ongoing',
    location: location || 'Pune, India',
    startDate: startDate || new Date().toISOString().split('T')[0],
    endDate: endDate || 'Ongoing',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=600&q=80'
  };
  projectsData.unshift(newProject);
  res.status(201).json({ message: "Project added successfully", project: newProject });
});

// ==========================================
// ROUTE ALIASES & STATIC SERVING
// ==========================================

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
  console.log(`NGO Portal Server running at http://0.0.0.0:${PORT}`);
});

