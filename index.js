// Import required modules
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors

// Initialize Express app
const app = express();
app.use(express.json());
app.use(cors()); // Use cors middleware

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI , {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Define User schema
const credSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Create User model
const User = mongoose.model('Cred', credSchema);

app.get("/" , async (req, res) => {
    res.send("access denied")
})

// Define a route to create a new user
app.post('/users', async (req, res) => {
    try {
        const { username, password } = req.body;
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).send({ msg: 'pass', _id: newUser._id.toString(), username: newUser.username });
    } catch (error) {
        if (error.code === 11000) { // Duplicate key error
            res.status(400).send({ msg: 'fail', error: 'Username already exists' });
        } else {
            res.status(400).send({ msg: 'fail', error: error.message });
        }
    }
});

// Define a route to retrieve userId by username and password
app.post('/users/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username, password });
        if (user) {
            res.status(200).send({ msg: 'pass', _id: user._id.toString() , username: username });
        } else {
            res.status(404).send({ msg: 'fail', error: 'Invalid username or password' });
        }
    } catch (error) {
        res.status(400).send({ msg: 'fail', error: error.message });
    }
});

app.post("/summarize", async (req, res) => {
    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: "Content is required" });
      }
  
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "user",
              content: `Create a detailed bullet points summary for the mentioned content. 
              - Each bullet point should start with a hyphen and end with a full stop.
              - No nested bullet points.
              
              Content: ${content}`,
            },
          ],
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
        }
      );
  
      res.json(response.data);
    } catch (error) {
      console.error("Error fetching data from OpenAI:", error);
      res.status(500).json({ error: "Failed to fetch summary" });
    }
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
