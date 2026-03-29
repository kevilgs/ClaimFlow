const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { eq } = require('drizzle-orm');
const { db } = require('../db');
const { users, companies } = require('../db/schema');

const signup = async (req, res) => {
  try {
    const { name, email, password, country, base_currency } = req.body;

    if (!name || !email || !password || !country || !base_currency) {
      return res
        .status(400)
        .json({ error: 'Name, email, password, country, and base_currency are required' });
    }

    const normalizedName = String(name).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedCountry = String(country).trim();
    const normalizedBaseCurrency = String(base_currency).trim().toUpperCase();

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await db.transaction(async (tx) => {
      const insertedCompanies = await tx
        .insert(companies)
        .values({
          name: `${normalizedName}'s Company`,
          country: normalizedCountry,
          base_currency: normalizedBaseCurrency,
        })
        .returning({ id: companies.id });

      const company = insertedCompanies[0];

      const insertedUsers = await tx
        .insert(users)
        .values({
          name: normalizedName,
          email: normalizedEmail,
          password: hashedPassword,
          company_id: company.id,
          role: 'admin',
        })
        .returning({
          id: users.id,
          name: users.name,
          email: users.email,
          role: users.role,
          company_id: users.company_id,
        });

      const user = insertedUsers[0];

      await tx
        .update(companies)
        .set({ admin_id: user.id })
        .where(eq(companies.id, company.id));

      return { user };
    });

    const token = jwt.sign({ id: result.user.id, role: result.user.role }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: result.user,
    });
  } catch (error) {
    console.error('Signup Error:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Email already in use' });
    }
    res.status(500).json({ error: 'Internal server error' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    const userArray = await db.select().from(users).where(eq(users.email, normalizedEmail));
    if (userArray.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userArray[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account disabled' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, company_id: user.company_id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;

    res.status(200).json({
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { signup, login };