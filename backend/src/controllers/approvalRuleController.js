const { db } = require('../db');
const { approvalRules, approvalRuleApprovers } = require('../db/schema');
const { eq } = require('drizzle-orm');

const getRule = async (req, res) => {
    try {
        const { targetUserId } = req.params;
        const [rule] = await db.select().from(approvalRules).where(eq(approvalRules.target_user_id, Number(targetUserId))).limit(1);
        if (!rule) {
            return res.status(200).json(null);
        }
        const approvers = await db.select().from(approvalRuleApprovers).where(eq(approvalRuleApprovers.approval_rule_id, rule.id));
        res.status(200).json({ rule, approvers });
    } catch (err) {
        console.error('Fetch Rule Error:', err);
        res.status(500).json({ error: 'Failed to fetch rule' });
    }
};

const createOrUpdateRule = async (req, res) => {
    try {
        const { target_user_id, description, manager_id, is_manager_approver, is_sequential, min_approval_percentage, approvers } = req.body;

        if (!target_user_id) {
            return res.status(400).json({ error: "Missing Target User ID" });
        }

        const existingRules = await db.select().from(approvalRules).where(eq(approvalRules.target_user_id, Number(target_user_id)));
        for (const rule of existingRules) {
            await db.delete(approvalRuleApprovers).where(eq(approvalRuleApprovers.approval_rule_id, rule.id));
            await db.delete(approvalRules).where(eq(approvalRules.id, rule.id));
        }

        const [rule] = await db.insert(approvalRules).values({
            company_id: req.user.company_id,
            target_user_id: Number(target_user_id),
            description: description || 'Automatic routing rule',
            manager_override_id: (manager_id && manager_id !== 'unassigned') ? Number(manager_id) : null,
            is_manager_approver: is_manager_approver || false,
            is_sequential: is_sequential || false,
            min_approval_percentage: min_approval_percentage || 100
        }).returning();

        if (approvers && approvers.length > 0) {
            const approversData = approvers.map(a => ({
                approval_rule_id: rule.id,
                user_id: Number(a.user_id),
                sequence_order: Number(a.sequence_order),
                is_required: a.is_required || false
            }));
            await db.insert(approvalRuleApprovers).values(approversData);
        }

        res.status(201).json({ success: true, message: 'Rule Activated' });
    } catch (err) {
        console.error('Approval Rule Save Error:', err);
        res.status(500).json({ error: 'Failed to process rule' });
    }
};

module.exports = { createOrUpdateRule, getRule };
