require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_NAME || 'Administrator';

    let user = await User.findOne({ email });
    if (user) {
      // make sure existing admin has a name
      if (!user.name) {
        user.name = adminName;
        await user.save();
        console.log('Added missing name to existing admin');
      }
      console.log('Admin user already exists:', email);
      process.exit(0);
    }

    const hashed = bcrypt.hashSync(password, 10);
    user = new User({ name: adminName, email, password: hashed, role: 'admin' });
    await user.save();
    console.log('Admin user created:', email, 'password:', password);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
