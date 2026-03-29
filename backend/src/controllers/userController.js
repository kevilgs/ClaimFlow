const bcrypt = require('bcrypt');
const { eq, and, ne } = require('drizzle-orm');
const { db } = require('../db');
const { users } = require('../db/schema');
const { sendWelcomeEmail } = require('../services/emailService');

const getUsers = async (req, res) => {
  try {
    const companyId = req.user.company_id;
    const data = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        manager_id: users.manager_id,
        is_active: users.is_active,
      })
      .from(users)
      .where(and(eq(users.company_id, companyId), ne(users.id, req.user.id)));
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const createUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can create users' });
    }

    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = String(req.body.role || '').trim();
    const manager_id = req.body.manager_id ?? null;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const inserted = await db
      .insert(users)
      .values({
        name,
        email,
        role,
        manager_id,
        password: hashedPassword,
        company_id: req.user.company_id,
      })
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        manager_id: users.manager_id,
        is_active: users.is_active,
        company_id: users.company_id,
      });

    const user = inserted[0];

    try {
      await sendWelcomeEmail({ to: email, name, tempPassword });
    } catch (emailErr) {
      console.error('Welcome email failed to send:', emailErr);
    }

    res.status(201).json({ user, tempPassword });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const updateUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update users' });
    }

    const { id } = req.params;
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const role = String(req.body.role || '').trim();
    const manager_id = req.body.manager_id ?? null;

    if (!name || !email || !role) {
      return res.status(400).json({ error: 'Name, email, and role are required' });
    }

    const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, email));
    if (existing.length > 0 && String(existing[0].id) !== String(id)) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const updated = await db
      .update(users)
      .set({
        name,
        email,
        role,
        manager_id
      })
      .where(eq(users.id, Number(id)))
      .returning({
        id: users.id,
        name: users.name,
        email: users.email,
        role: users.role,
        manager_id: users.manager_id,
        is_active: users.is_active,
      });

    if (updated.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    const { id } = req.params;

    if (String(req.user.id) === String(id)) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const deleted = await db.delete(users).where(eq(users.id, Number(id))).returning({ id: users.id });

    if (deleted.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
