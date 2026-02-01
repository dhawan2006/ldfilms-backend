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
.then(() => console.log("Database Connected"))
.catch(err => console.log(err));

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

/* ===== EMAIL (OPTIONAL) ===== */

let transporter;

if(process.env.EMAIL && process.env.EMAIL_PASS){
  transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});


}

/* ===== ROUTE ===== */

app.post("/contact", async (req, res) => {

  console.log("Received:", req.body);

  try {

    const { name, email, phone, date, message } = req.body;

    if (!name || !email || !phone) {
      return res.json({
        success: false,
        message: "Fill required fields"
      });
    }

    const newContact = new Contact({
      name,
      email,
      phone,
      date,
      message
    });

    await newContact.save();

    // Send mail only if setup
    if(transporter){
      await transporter.sendMail({
        from: process.env.EMAIL,
        to: process.env.EMAIL,
        subject: "New Photoshoot Request",
        text: `
Name: ${name}
Email: ${email}
Phone: ${phone}
Date: ${date}
Message: ${message}
`
      });
    }

    res.json({
      success: true,
      message: "Request sent"
    });

  } catch (err) {

    console.log(err);

    res.json({
      success: false,
      message: "Server Error"
    });
  }
});

/* ===== START ===== */

const PORT = 8000;

app.listen(PORT, () => {
  console.log("Server running on " + PORT);
});
