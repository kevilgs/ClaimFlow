const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getExpenses, getAllExpenses, createExpense, submitExpense, getManagerApprovals, decideExpense } = require('../controllers/expenseController');

const router = express.Router();

router.get('/all', authenticateToken, getAllExpenses);
router.get('/manager', authenticateToken, getManagerApprovals);
router.get('/', authenticateToken, getExpenses);
router.post('/', authenticateToken, createExpense);
router.patch('/:id/submit', authenticateToken, submitExpense);
router.patch('/:id/decide', authenticateToken, decideExpense);

module.exports = router;
