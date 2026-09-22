const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

app.use(express.static(__dirname));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// =====================================
// MAIL.TM API
// =====================================

const MAIL_API = "https://api.mail.tm";

// =====================================
// CREATE NEW TEMPORARY INBOX
// =====================================

app.post("/api/inbox", async (req, res) => {
    console.log("POST /api/inbox received");

    try {
        // Get available domain
        const domainResponse = await fetch(`${MAIL_API}/domains`);

        if (!domainResponse.ok) {
            throw new Error("Could not get email domain");
        }

        const domainData = await domainResponse.json();

        const domains = domainData["hydra:member"] || [];

        if (!domains.length) {
            throw new Error("No email domains available");
        }

        const domain = domains[0].domain;

        // Generate random username and password
        const username =
            "quickmail" +
            Date.now() +
            Math.floor(Math.random() * 10000);

        const password =
            "Qm!" +
            Math.random().toString(36).slice(2) +
            "9X";

        const address = `${username}@${domain}`;

        // Create account
        const accountResponse = await fetch(
            `${MAIL_API}/accounts`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    address: address,
                    password: password
                })
            }
        );

        const accountData = await accountResponse.json();

        if (!accountResponse.ok) {
            console.error("Account creation failed:", accountData);

            return res.status(accountResponse.status).json(accountData);
        }

        // Get token
        const tokenResponse = await fetch(
            `${MAIL_API}/token`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    address: address,
                    password: password
                })
            }
        );

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error("Token creation failed:", tokenData);

            return res.status(tokenResponse.status).json(tokenData);
        }

        console.log("CREATE INBOX:", address);

        res.json({
            address: address,
            token: tokenData.token
        });

    } catch (error) {
        console.error("Create inbox error:", error);

        res.status(500).json({
            error: "Could not create temporary email."
        });
    }
});

// =====================================
// GET MESSAGES
// =====================================

app.get("/api/messages", async (req, res) => {
    try {
        const response = await fetch(
            `${MAIL_API}/messages`,
            {
                headers: {
                    Authorization: req.headers.authorization || ""
                }
            }
        );

        const data = await response.json();

        const messages = data["hydra:member"] || [];

        const formattedMessages = messages.map(message => ({
            id: message.id,
            subject: message.subject || "No subject",
            from: message.from
                ? `${message.from.name || ""} <${message.from.address}>`
                : "Unknown sender",
            intro: message.intro || "",
            date: message.createdAt || ""
        }));

        res.status(response.status).json(formattedMessages);

    } catch (error) {
        console.error("Messages error:", error);

        res.status(500).json({
            error: "Could not load messages."
        });
    }
});

// =====================================
// GET FULL MESSAGE
// =====================================

app.get("/api/messages/:id", async (req, res) => {
    try {
        const response = await fetch(
            `${MAIL_API}/messages/${req.params.id}`,
            {
                headers: {
                    Authorization: req.headers.authorization || ""
                }
            }
        );

        const data = await response.json();

        res.status(response.status).json(data);

    } catch (error) {
        console.error("Full message error:", error);

        res.status(500).json({
            error: "Could not load message."
        });
    }
});

// =====================================
// START SERVER
// =====================================

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`QuickMail server running on port ${PORT}`);
});