const express = require('express')
const mongoose = require('mongoose')
const path = require('path')
const port = 8080

const app = express();
app.use(express.static(path.join(__dirname, 'frontend')));

app.use(express.urlencoded({extended:true}))
app.use(express.json());

mongoose.connect('mongodb+srv://sarvagra:0625udaandb@cluster0.s6n2c5m.mongodb.net/udaan?retryWrites=true&w=majority&appName=Cluster0')
const db = mongoose.connection
db.once('open',()=>{
    console.log("✅ Mongodb connection successful")
})


// registration route
const registrations = new mongoose.Schema({
    name:String,
    email:String,
    phone:String,
    ticket_id:String
})

const Users = mongoose.model("registrations", registrations);

app.get('/',(req,res)=>{
    res.sendFile(path.join(__dirname,'frontend/index.html'))
})

// generate ticket id 
function generateTicketId(length = 10) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let ticketId = '';
    for (let i = 0; i < length; i++) {
        ticketId += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return ticketId;
}

app.post('/post', async (req, res) => {
    const { name, email, phone } = req.body;

    // Check if same user already registered
    const exactUser = await Users.findOne({ name, email, phone });
    if (exactUser) {
        return res.status(400).json({
            message: "✅ User already registered, please check your Gmail for the ticket."
        });
    }

    // Count how many times phone/email exists
    const usedCount = await Users.countDocuments({
        $or: [{ phone }, { email }]
    });

    if (usedCount >= 3) {
        return res.status(400).json({
            message: "‼️ This phone number or email has already been used 3 times. ‼️"
        });
    }

    // ✅ Otherwise, proceed to register
    let ticket_id;
    let isUnique = false;
    while (!isUnique) {
        ticket_id = generateTicketId();
        const exists = await Users.findOne({ ticket_id });
        if (!exists) isUnique = true;
    }

    const user = new Users({ name, email, phone, ticket_id });
    await user.save();
    console.log(user);

    try {
        await sendTicket({ name, email, ticket_id });
        console.log("-end-");
    } catch (error) {
        console.error("❌ Failed to send email:", error);
    }

    res.json({
        message: "🎉 Thank you for joining us on this event.\nCheck your email/contact-sms for ticket.",
        ticket_id
    });
});



// mail the ticket 
const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

async function sendTicket({ name, email, ticket_id }) {
    const qrImageBuffer = await QRCode.toBuffer(ticket_id, { type: 'png', scale:10 }); // Generate QR as buffer

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'udaan.techy@gmail.com',
            pass: 'uuneafhcqpzljegt'
        }
    });

    const mailOptions = {
        from: '"Udaan Tech" <udaan.techy@gmail.com>',
        to: email,
        subject: '🎉 Your UDAAN Ticket 🎉',
        html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8f8f8;">
            <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(to right, #4e54c8, #8f94fb); color: white; padding: 20px; text-align: center;">
                    <h1>This is your Euphoria! 🐦‍🔥</h1>
                    <h3>Hi ${name}, your ticket is confirmed!</h3>
                </div>
                <div style="padding: 20px; text-align: center;">
                    <p>Show this ticket at the entry gate:</p>
                    <img src="cid:qrcode@ticket" alt="Ticket QR Code" style="border-radius:10px;"/>
                    
                </div>
                <div style="background: #f1f1f1; padding: 15px; text-align: center; font-size: 14px; color: #555;">
                    <p>Contact us at udaan.lpu@gmail.com for any queries</p>
                </div>
            </div>
        </div>
        `,
        attachments: [{
            filename: 'ticket.png',
            content: qrImageBuffer,
            cid: 'qrcode@ticket' // Reference ID used in the img src
        }]
    };

    await transporter.sendMail(mailOptions);
    console.log("🎟️ Ticket sent to:", email);
}


// ✅ LOGIN POST ROUTE

app.use((req, res, next) => {
    res.setHeader("Content-Security-Policy", "default-src 'self'; font-src 'self' https://at.alicdn.com; style-src 'self' 'unsafe-inline' https://at.alicdn.com;");
    next();
});

const core_team = new mongoose.Schema({
    name: String,
    email: String,
    password: String
});

const Members = mongoose.model("core_teams", core_team);

app.post('/login', async (req, res) => {
    const { name, email, pass } = req.body;

    if (!name || !email || !pass) {
        return res.status(400).json({ message: "‼️ All fields are required ‼️" });
    }

    try {
        // Corrected model name
        const member = await Members.findOne({ name, email, password: pass });

        if (member) {
            
            console.log("✅ DevZone Login Successful:", member);
            return res.json({ message: `Welcome back, ${name}!` });
        } else {
            return res.status(401).json({ message: "‼️ Invalid credentials. Access Denied ‼️" });
        }
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "‼️ Server error. Please try again ‼️" });
    }
});


// verify the ticket
const usedTicketsSchema = new mongoose.Schema({
    date: String,
    time: String,
    ticket_id: String
});
const UsedTickets = mongoose.model("used_tickets", usedTicketsSchema);

app.post('/verify-ticket', async (req, res) => {
    const { ticket_id } = req.body;

    if (!ticket_id) return res.status(400).json({ message: '❌ No ticket ID provided' });

    try {
        const usedTicket = await UsedTickets.findOne({ ticket_id });
        if (usedTicket) {
            return res.json({ status: 'denied', message: '❌ Entry not granted,\nTicket already used!' });
        }

        const validUser = await Users.findOne({ ticket_id });
        if (validUser) {
            const now = new Date();
            const date = now.toLocaleDateString('en-GB').split('/').join('-'); // DD-MM-YYYY
            const time = now.toLocaleTimeString('en-GB'); // HH:MM:SS

            // Save to used tickets
            await new UsedTickets({ ticket_id, date, time }).save();

            return res.json({ status: 'granted', message: `✅ Entry granted to ${validUser.name}!\nWelcome!` });
        } else {
            return res.json({ status: 'invalid', message: '❌ Invalid Ticket ID. Access Denied.' });
        }
    } catch (error) {
        console.error("Error verifying ticket:", error);
        return res.status(500).json({ message: '‼️ Server Error. Try Again.' });
    }
});


app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`);
});
