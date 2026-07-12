const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hello_db';

app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log('Hello Service connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.get('/api/hello', (req, res) => {
  res.json({ message: "Hello from the AKS database-connected microservice!" });
});

app.listen(PORT, () => {
  console.log(`Hello service running on port ${PORT}`);
});
