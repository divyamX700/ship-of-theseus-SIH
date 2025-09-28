const mongoose = require("mongoose");

mongoose.connect(
  "mongodb+srv://rajnandani31:RAJnand2005@sih.avsckh6.mongodb.net/test?retryWrites=true&w=majority&appName=SIH",
  { useNewUrlParser: true, useUnifiedTopology: true }
)
  .then(() => console.log("✅ Connected to MongoDB Atlas (test DB)"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

