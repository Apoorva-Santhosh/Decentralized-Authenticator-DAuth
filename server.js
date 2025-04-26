// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from the dist folder
app.use(express.static(path.join(__dirname, 'dist')));

// Parse incoming JSON requests (important for API later)
app.use(express.json());

// Example backend route (for later blockchain work)
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express backend!' });
});

// All other routes -> serve index.html (for React Router)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
