const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const ocrRoutes = require('./routes/ocrRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const approvalRuleRoutes = require('./routes/approvalRuleRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json())

// A simple health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is up and running!' });
});

app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ocr', ocrRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/approval-rules', approvalRuleRoutes);


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});