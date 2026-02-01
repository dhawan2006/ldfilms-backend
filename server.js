const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.disable("x-powered-by");
app.set("trust proxy", true);

/* ===== MIDDLEWARE ===== */

app.use(cors({
  origin: "*"
}));

app.use(express.json());

/* ===== TEST ROUTE ===== */
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Backend is working 🚀"
  });
});

/* ===== DATABASE ===== */

mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("✅ Database Connected"))
.catch(err => console.log("❌ Database Error:", err));

/* ===== MODEL ===== */

const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  phone: String,
  date: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Contact = mongoose.model("Contact", contactSchema);

/* ===== ROUTE ===== */

app.post("/contact", async (req, res) => {

  console.log("Received:", req.body);

  try {

    const { name, email, phone, date, message } = req.body;

    // 1. Validation
    if (!name || !email || !phone) {
      return res.json({
        success: false,
        message: "Fill required fields"
      });
    }

    // 2. Save to Database
    const newContact = new Contact({
      name,
      email,
      phone,
      date,
      message
    });

    await newContact.save();
    console.log("✅ Data saved to MongoDB");

    // 3. Send Success Response
    res.json({
      success: true,
      message: "Request sent successfully"
    });

  } catch (err) {
    console.log("❌ Server Error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error"
    });
  }
});

/* ===== START ===== */

const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
