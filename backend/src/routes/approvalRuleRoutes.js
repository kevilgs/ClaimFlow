const express = require('express');
const { authenticateToken } = require('../middleware/authMiddleware');
const { createOrUpdateRule, getRule } = require('../controllers/approvalRuleController');

const router = express.Router();

router.get('/:targetUserId', authenticateToken, getRule);
router.post('/', authenticateToken, createOrUpdateRule);

module.exports = router;
