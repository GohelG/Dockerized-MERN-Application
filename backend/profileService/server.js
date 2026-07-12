const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/profile_db';

app.use(express.json());

mongoose.connect(MONGO_URI)
  .then(() => console.log('Profile Service connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const ProfileSchema = new mongoose.Schema({
  name: String,
  email: String,
  role: String
});
const Profile = mongoose.model('Profile', ProfileSchema);

app.get('/api/profile', async (req, res) => {
  try {
    let profile = await Profile.findOne();
    if (!profile) {
      profile = await Profile.create({
        name: "John Doe",
        email: "john.doe@azure.com",
        role: "Cloud Native Engineer (AKS & Jenkins)"
      });
    }
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Profile service running on port ${PORT}`);
});
