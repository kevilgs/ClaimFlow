const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { getExpenses, getAllExpenses, createExpense, submitExpense } = require('../controllers/expenseController');

const router = express.Router();

router.get('/all', authenticateToken, getAllExpenses);
router.get('/', authenticateToken, getExpenses);
router.post('/', authenticateToken, createExpense);
router.patch('/:id/submit', authenticateToken, submitExpense);

module.exports = router;
