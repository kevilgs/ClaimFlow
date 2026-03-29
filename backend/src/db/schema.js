const {
  pgTable,
  pgEnum,
  serial,
  text,
  varchar,
  timestamp,
  decimal,
  integer,
  boolean,
  jsonb,
} = require('drizzle-orm/pg-core');
const { relations } = require('drizzle-orm');

const userRoleEnum = pgEnum('user_role', ['admin', 'manager', 'employee', 'finance', 'cfo']);
const expenseStatusEnum = pgEnum('expense_status', ['draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'reimbursed', 'cancelled']);
const paidByEnum = pgEnum('paid_by', ['employee', 'company_card']);
const expenseCategoryEnum = pgEnum('expense_category', [
  'travel', 'meals', 'accommodation', 'office_supplies', 'equipment',
  'software_licenses', 'professional_services', 'utilities', 'maintenance', 'other'
]);

const companies = pgTable('companies', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  base_currency: varchar('base_currency', { length: 3 }).notNull().default('USD'),
  country: varchar('country', { length: 100 }),
  admin_id: integer('admin_id'),
  approval_timeout_days: integer('approval_timeout_days').default(7),

  created_at: timestamp('created_at').defaultNow().notNull(),
});

const users = pgTable('users', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  role: userRoleEnum('role').notNull().default('employee'),
  company_id: integer('company_id').references(() => companies.id),
  manager_id: integer('manager_id'),
  is_active: boolean('is_active').notNull().default(true),
  reset_token: text('reset_token'),
  reset_token_expires: timestamp('reset_token_expires'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

const expenses = pgTable('expenses', {
  id: serial('id').primaryKey(),
  company_id: integer('company_id').references(() => companies.id).notNull(),
  employee_id: integer('employee_id').references(() => users.id).notNull(),

  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull(),
  base_currency_amount: decimal('base_currency_amount', { precision: 15, scale: 2 }).notNull(),
  exchange_rate_used: decimal('exchange_rate_used', { precision: 19, scale: 10 }),
  paid_by: paidByEnum('paid_by').notNull().default('employee'),

  category: expenseCategoryEnum('category').notNull(),
  description: text('description').notNull(),
  receipt_url: text('receipt_url'),
  metadata: jsonb('metadata').default('{}'),

  status: expenseStatusEnum('status').notNull().default('draft'),
  rejection_reason: text('rejection_reason'),
  expense_date: timestamp('expense_date').notNull(),
  submitted_at: timestamp('submitted_at'),
  reimbursement_date: timestamp('reimbursement_date'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

const exchangeRates = pgTable('exchange_rates', {
  id: serial('id').primaryKey(),
  from_currency: varchar('from_currency', { length: 3 }).notNull(),
  to_currency: varchar('to_currency', { length: 3 }).notNull(),
  rate: decimal('rate', { precision: 19, scale: 10 }).notNull(),
  rate_date: timestamp('rate_date').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

const approvalRules = pgTable('approval_rules', {
  id: serial('id').primaryKey(),
  company_id: integer('company_id').references(() => companies.id).notNull(),

  target_user_id: integer('target_user_id').references(() => users.id).notNull(),
  description: text('description').notNull(),
  manager_override_id: integer('manager_override_id').references(() => users.id),

  is_manager_approver: boolean('is_manager_approver').notNull().default(false),
  is_sequential: boolean('is_sequential').notNull().default(false),
  min_approval_percentage: integer('min_approval_percentage'),

  created_at: timestamp('created_at').defaultNow().notNull(),
});

const approvalRuleApprovers = pgTable('approval_rule_approvers', {
  id: serial('id').primaryKey(),
  approval_rule_id: integer('approval_rule_id').references(() => approvalRules.id).notNull(),
  user_id: integer('user_id').references(() => users.id).notNull(),

  sequence_order: integer('sequence_order').notNull(),
  is_required: boolean('is_required').notNull().default(false),
  is_active: boolean('is_active').notNull().default(true),

  created_at: timestamp('created_at').defaultNow().notNull(),
});

const expenseApprovals = pgTable('expense_approvals', {
  id: serial('id').primaryKey(),
  expense_id: integer('expense_id').references(() => expenses.id).notNull(),
  approver_id: integer('approver_id').references(() => users.id).notNull(),

  approval_step: integer('approval_step'),
  status: expenseStatusEnum('status').notNull(),
  comments: text('comments'),

  created_at: timestamp('created_at').defaultNow().notNull(),
});

const approvalRulesRelations = relations(approvalRules, ({ many, one }) => ({
  approvers: many(approvalRuleApprovers),
  targetUser: one(users, { fields: [approvalRules.target_user_id], references: [users.id] }),
}));

const approvalRuleApproversRelations = relations(approvalRuleApprovers, ({ one }) => ({
  rule: one(approvalRules, { fields: [approvalRuleApprovers.approval_rule_id], references: [approvalRules.id] }),
  user: one(users, { fields: [approvalRuleApprovers.user_id], references: [users.id] }),
}));

const expenseApprovalsRelations = relations(expenseApprovals, ({ one }) => ({
  expense: one(expenses, { fields: [expenseApprovals.expense_id], references: [expenses.id] }),
  approver: one(users, { fields: [expenseApprovals.approver_id], references: [users.id] }),
}));

module.exports = {
  companies,
  users,
  expenses,
  exchangeRates,
  approvalRules,
  approvalRuleApprovers,
  expenseApprovals,
  userRoleEnum,
  expenseStatusEnum,
  paidByEnum,
  expenseCategoryEnum,
  approvalRulesRelations,
  approvalRuleApproversRelations,
  expenseApprovalsRelations
};