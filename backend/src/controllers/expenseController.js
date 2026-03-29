const { eq, and, desc, ne, asc } = require('drizzle-orm');
const { db } = require('../db');
const { expenses, users, companies, approvalRules, approvalRuleApprovers, expenseApprovals } = require('../db/schema');

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
            description: exp.description || 'No Description',
            date: exp.expense_date ? (new Date(exp.expense_date).toString() !== 'Invalid Date' ? new Date(exp.expense_date).toISOString().split('T')[0] : 'N/A') : 'N/A',
            category: exp.category || 'other',
            paidBy: exp.paid_by || 'employee',
            remarks: exp.metadata?.remarks || '',
            amount: parseFloat(exp.amount) || 0,
            currency: exp.currency || 'USD',
            status: exp.status || 'draft',
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

        // Exchange Rate calculation
        const company = await db.select().from(companies).where(eq(companies.id, req.user.company_id));
        const baseCurrency = company[0]?.base_currency || 'USD';

        let baseCurrencyAmount = parseFloat(amount);
        let exchangeRateUsed = 1;

        if (currency.toUpperCase() !== baseCurrency.toUpperCase()) {
            try {
                const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${baseCurrency}`);
                const data = await response.json();
                if (data.rates && data.rates[currency.toUpperCase()]) {
                    exchangeRateUsed = data.rates[currency.toUpperCase()];
                    baseCurrencyAmount = parseFloat(amount) / exchangeRateUsed;
                }
            } catch (err) {
                console.error("Exchange rate fetch failed", err);
            }
        }

        const inserted = await db
            .insert(expenses)
            .values({
                company_id: req.user.company_id,
                employee_id: req.user.id,
                amount,
                currency,
                base_currency_amount: baseCurrencyAmount.toFixed(2),
                exchange_rate_used: exchangeRateUsed,
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

        const expenseId = Number(id);

        // 1. Fetch user rule
        const rules = await db.select().from(approvalRules).where(eq(approvalRules.target_user_id, req.user.id)).limit(1);

        let queue = [];
        let isSequential = true;

        if (rules.length > 0) {
            const rule = rules[0];
            isSequential = rule.is_sequential;

            console.log(`[SUBMIT] Rule found for user ${req.user.id}:`, {
                rule_id: rule.id,
                is_manager_approver: rule.is_manager_approver,
                manager_override_id: rule.manager_override_id,
                is_sequential: rule.is_sequential
            });

            if (rule.is_manager_approver) {
                const managerId = rule.manager_override_id ||
                    (await db.select().from(users).where(eq(users.id, req.user.id)))[0]?.manager_id;
                console.log(`[SUBMIT] Manager approver ID resolved to: ${managerId}`);
                if (managerId) {
                    queue.push({ user_id: managerId, sequence_order: 0 });
                }
            }

            const approvers = await db.select().from(approvalRuleApprovers).where(eq(approvalRuleApprovers.approval_rule_id, rule.id));
            console.log(`[SUBMIT] Additional approvers from rule:`, approvers.map(a => a.user_id));
            queue.push(...approvers);

            queue.sort((a, b) => a.sequence_order - b.sequence_order);
        } else {
            console.log(`[SUBMIT] No rule found for user ${req.user.id}, falling back to manager_id`);
            const emp = await db.select().from(users).where(eq(users.id, req.user.id));
            if (emp[0].manager_id) {
                queue.push({ user_id: emp[0].manager_id, sequence_order: 0 });
            }
        }

        console.log(`[SUBMIT] Final approval queue:`, queue);

        // Lock expense internally to trigger system lookup tracking explicitly
        await db.update(expenses)
            .set({ status: 'pending_approval', submitted_at: new Date() })
            .where(eq(expenses.id, expenseId));

        if (queue.length > 0) {
            // Seed approval tracks explicitly locking out chained approvers via sequentially mapped steps 
            for (let i = 0; i < queue.length; i++) {
                const isFirst = (i === 0);
                const stepStatus = (isSequential && !isFirst) ? 'draft' : 'pending_approval';

                await db.insert(expenseApprovals).values({
                    expense_id: expenseId,
                    approver_id: queue[i].user_id,
                    approval_step: i + 1,
                    status: stepStatus
                });
            }
        } else {
            // Auto approve if entirely no routing 
            await db.update(expenses).set({ status: 'approved' }).where(eq(expenses.id, expenseId));
        }

        res.status(200).json({ success: true, message: 'Expense efficiently captured into workflow matrix.' });
    } catch (err) {
        console.error('Submit Expense Error:', err);
        res.status(500).json({ error: 'Failed to submit expense' });
    }
};

const getManagerApprovals = async (req, res) => {
    try {
        console.log(`[MANAGER APPROVALS] Logged-in manager user ID: ${req.user.id}, role: ${req.user.role}`);
        const data = await db
            .select({
                id: expenses.id,
                subject: expenses.description,
                owner: users.name,
                category: expenses.category,
                status: expenseApprovals.status, // Return the exact internal status context 
                originalAmount: expenses.amount,
                originalCurrency: expenses.currency,
                baseAmount: expenses.base_currency_amount,
                baseCurrency: companies.base_currency,
            })
            .from(expenseApprovals)
            .innerJoin(expenses, eq(expenseApprovals.expense_id, expenses.id))
            .innerJoin(users, eq(expenses.employee_id, users.id))
            .innerJoin(companies, eq(expenses.company_id, companies.id))
            .where(
                and(
                    eq(expenseApprovals.approver_id, req.user.id),
                    ne(expenseApprovals.status, 'draft') // Only reveal if explicitly "pending_approval", "approved", or "rejected" step
                )
            )
            .orderBy(desc(expenses.created_at));

        const formatted = data.map(item => ({
            ...item,
            originalAmount: parseFloat(item.originalAmount),
            baseAmount: parseFloat(item.baseAmount).toFixed(2)
        }));

        res.status(200).json(formatted);
    } catch (err) {
        console.error('Fetch Manager Approvals Error:', err);
        res.status(500).json({ error: 'Failed to fetch approvals' });
    }
};

const decideExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { decision } = req.body;

        const expenseId = Number(id);

        if (!['approved', 'rejected'].includes(decision)) {
            return res.status(400).json({ error: 'Invalid decision status' });
        }

        // 1. Complete this manager's turn specifically
        const updatedStep = await db
            .update(expenseApprovals)
            .set({ status: decision })
            .where(and(
                eq(expenseApprovals.expense_id, expenseId),
                eq(expenseApprovals.approver_id, req.user.id)
            )).returning();

        if (updatedStep.length === 0) return res.status(404).json({ error: "Un-authorized or no step found." });

        // 2. Perform system propagation to determine next step  
        const expense = await db.select().from(expenses).where(eq(expenses.id, expenseId));
        const rules = await db.select().from(approvalRules).where(eq(approvalRules.target_user_id, expense[0].employee_id)).limit(1);

        // If instantly rejected -> Kill everything 
        if (decision === 'rejected') {
            await db.update(expenses).set({ status: 'rejected' }).where(eq(expenses.id, expenseId));
        } else if (decision === 'approved') {

            // Checking if there's sequentially trapped steps!
            const remainingSteps = await db.select().from(expenseApprovals)
                .where(and(
                    eq(expenseApprovals.expense_id, expenseId),
                    eq(expenseApprovals.status, 'draft')
                )).orderBy(asc(expenseApprovals.approval_step));

            const hasActivePending = await db.select().from(expenseApprovals)
                .where(and(
                    eq(expenseApprovals.expense_id, expenseId),
                    eq(expenseApprovals.status, 'pending_approval')
                ));

            if (remainingSteps.length > 0) {
                // Safely advance next strictly mapped step 
                await db.update(expenseApprovals)
                    .set({ status: 'pending_approval' })
                    .where(eq(expenseApprovals.id, remainingSteps[0].id));
            } else if (hasActivePending.length === 0) {
                // Matrix empty, complete lifecycle 
                await db.update(expenses).set({ status: 'approved' }).where(eq(expenses.id, expenseId));
            }
        }

        res.status(200).json({ success: true, message: `System execution progressed step!` });
    } catch (err) {
        console.error('Decision Error:', err);
        res.status(500).json({ error: 'Decision logic failed' });
    }
};

module.exports = { getExpenses, getAllExpenses, createExpense, submitExpense, getManagerApprovals, decideExpense };
