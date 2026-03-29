const { eq, and, desc } = require('drizzle-orm');
const { db } = require('../db');
const { expenses, users } = require('../db/schema');

const getExpenses = async (req, res) => {
    try {
        const data = await db
            .select()
            .from(expenses)
            .where(eq(expenses.employee_id, req.user.id))
            .orderBy(desc(expenses.created_at));

        // Format for frontend mapping
        const formatted = data.map(exp => ({
            id: exp.id,
            description: exp.description,
            date: new Date(exp.expense_date).toISOString().split('T')[0],
            category: exp.category,
            paidBy: exp.paid_by,
            remarks: exp.metadata?.remarks || '',
            amount: parseFloat(exp.amount),
            currency: exp.currency,
            status: exp.status,
        }));

        res.status(200).json(formatted);
    } catch (err) {
        console.error('Fetch Expenses Error:', err);
        res.status(500).json({ error: 'Failed to fetch expenses' });
    }
};

const getAllExpenses = async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Only admins can view all expenses' });
        }

        const data = await db
            .select({
                id: expenses.id,
                date: expenses.expense_date,
                employeeName: users.name,
                description: expenses.description,
                amount: expenses.amount,
                status: expenses.status
            })
            .from(expenses)
            .leftJoin(users, eq(expenses.employee_id, users.id))
            .where(eq(expenses.company_id, req.user.company_id))
            .orderBy(desc(expenses.created_at));

        const formatted = data.map(exp => ({
            ...exp,
            date: new Date(exp.date).toISOString().split('T')[0],
            amount: parseFloat(exp.amount)
        }));

        res.status(200).json(formatted);
    } catch (err) {
        console.error('Fetch All Expenses Error:', err);
        res.status(500).json({ error: 'Failed to fetch all expenses' });
    }
};

const createExpense = async (req, res) => {
    try {
        const { amount, currency, description, category, date, remarks, status } = req.body;

        if (!amount || !currency || !description || !category || !date) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        let mappedCategory = category.toLowerCase().replace(' ', '_');
        const validCategories = ['travel', 'meals', 'accommodation', 'office_supplies', 'equipment', 'software_licenses', 'professional_services', 'utilities', 'maintenance', 'other'];
        if (!validCategories.includes(mappedCategory)) mappedCategory = 'other';

        const inserted = await db
            .insert(expenses)
            .values({
                company_id: req.user.company_id,
                employee_id: req.user.id,
                amount,
                currency,
                base_currency_amount: amount,
                category: mappedCategory,
                description,
                expense_date: new Date(date),
                metadata: { remarks },
                status: status || 'draft',
            })
            .returning();

        res.status(201).json(inserted[0]);
    } catch (err) {
        console.error('Create Expense Error:', err);
        res.status(500).json({ error: 'Failed to create expense' });
    }
};

const submitExpense = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await db.select().from(expenses).where(and(eq(expenses.id, Number(id)), eq(expenses.employee_id, req.user.id)));
        if (existing.length === 0) return res.status(404).json({ error: 'Expense not found' });

        if (existing[0].status !== 'draft') {
            return res.status(400).json({ error: 'Only drafts can be submitted' });
        }

        const updated = await db
            .update(expenses)
            .set({ status: 'submitted', submitted_at: new Date() })
            .where(eq(expenses.id, Number(id)))
            .returning();

        res.status(200).json(updated[0]);
    } catch (err) {
        console.error('Submit Expense Error:', err);
        res.status(500).json({ error: 'Failed to submit expense' });
    }
};

module.exports = { getExpenses, getAllExpenses, createExpense, submitExpense };
