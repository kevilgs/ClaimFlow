const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const authRoutes = require('./routes/authRoutes');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Essential Middleware
app.use(cors());
app.use(express.json()); // This allows your server to read JSON bodies from frontend requests

// A simple health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'Server is up and running!' });
});

app.use('/api', authRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});