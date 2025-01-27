require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Rate limiter
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100 // limit 100 request per windowMs
});
app.use(limiter);

// Proxy endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.HF_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(req.body)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'API Error');
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hanya izinkan domain yang diinginkan
app.use(cors({
  origin: ['https://your-render-app-url.onrender.com']
}));

// Blokir akses langsung ke API key
app.get('/api/chat', (req, res) => {
  res.status(403).json({ error: 'Method not allowed' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
