const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
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

/* ===== EMAIL CONFIGURATION (UPDATED) ===== */

let transporter;

if(process.env.EMAIL && process.env.EMAIL_PASS){
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",  // Explicit host
    port: 465,               // Secure Port 465 prevents timeouts on Render
    secure: true,            // TRUE for port 465
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS // Make sure this is your App Password
    },
    // Timeouts to prevent hanging
    connectionTimeout: 10000,
    greetingTimeout: 10000
  });

  // Verify connection on startup
  transporter.verify((error, success) => {
    if (error) {
      console.log("❌ Email Connection Failed:", error);
    } else {
      console.log("✅ Email System Ready");
    }
  });
}

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

    // 3. Send Email (Fail-Safe Block)
    if(transporter){
      try {
        await transporter.sendMail({
          from: process.env.EMAIL,
          to: process.env.EMAIL, // Sending to yourself
          subject: "New Photoshoot Request",
          text: `
New Request Received!
---------------------
Name: ${name}
Email: ${email}
Phone: ${phone}
Date: ${date}
Message: ${message}
`
        });
        console.log("✅ Email sent successfully");
      } catch (emailError) {
        // If email fails, we log it but do NOT crash the response
        console.error("⚠️ Email failed to send (but data is safe):", emailError.message);
      }
    }

    // 4. Send Success Response (Always reaches here if DB save works)
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

// Use Render's port if available, otherwise 8000
const PORT = process.env.PORT || 8000;

app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
