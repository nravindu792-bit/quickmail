const API = "/.netlify/functions/inbox";

let currentEmail = "";
let currentToken = "";
let currentMessages = [];


// ===============================
// CREATE NEW TEMPORARY EMAIL
// ===============================

async function generateEmail() {
    try {
        const response = await fetch(`${API}/api/inbox`, {
            method: "POST"
        });

        if (!response.ok) {
            throw new Error("Inbox creation failed");
        }

        const data = await response.json();

        currentEmail = data.address;
        currentToken = data.token;

        localStorage.setItem("quickmail_email", currentEmail);
        localStorage.setItem("quickmail_token", currentToken);

        document.getElementById("email").textContent = currentEmail;

        await refreshInbox();

    } catch (error) {
        console.error("Create inbox error:", error);
        alert("Could not create temporary email.");
    }
}


// ===============================
// REFRESH INBOX
// ===============================

async function refreshInbox() {
    if (!currentToken) return;

    try {
        const response = await fetch(`${API}/api/messages`, {
            headers: {
                Authorization: `Bearer ${currentToken}`
            }
        });

        if (!response.ok) return;

        const data = await response.json();

        console.log("API DATA:", data);

        const messages = Array.isArray(data)
            ? data
            : (data.messages || data.data || []);

        currentMessages = messages;

        const countElement = document.getElementById("message-count");

        if (countElement) {
            countElement.textContent = messages.length;
        }

        const container = document.getElementById("messages");

        if (!container) return;

        if (messages.length === 0) {
            container.innerHTML = `
                <div class="empty-inbox">
                    <div class="empty-icon">📭</div>
                    <h3>Your inbox is empty</h3>
                    <p>New messages will appear here automatically.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = messages.map((message, index) => `
            <div class="message" onclick="openMessage(${index})">

                <h3>
                    ${escapeHtml(message.subject || "No subject")}
                </h3>

                <p>
                    <strong>From:</strong>
                    ${escapeHtml(message.from || "Unknown sender")}
                </p>

                <p>
                    ${escapeHtml(message.intro || "")}
                </p>

                <small>Click to open →</small>

            </div>
        `).join("");

    } catch (error) {
        console.error("Inbox error:", error);
    }
}


// ===============================
// OPEN FULL EMAIL
// ===============================

async function openMessage(index) {

    const message = currentMessages[index];

    if (!message) return;

    // Show basic email information
    document.getElementById("modal-subject").textContent =
        message.subject || "No subject";

    document.getElementById("modal-from").textContent =
        message.from || "Unknown sender";

    document.getElementById("modal-date").textContent =
        message.date
            ? new Date(message.date).toLocaleString()
            : "-";

    // Show loading message
    document.getElementById("modal-message").textContent =
        "Loading full message...";

    // Open modal
    document.getElementById("email-modal").classList.add("show");


    try {

        // Get full email
        const response = await fetch(
            `${API}/api/messages/${message.id}`,
            {
                headers: {
                    Authorization: `Bearer ${currentToken}`
                }
            }
        );

        if (!response.ok) {
            throw new Error("Could not load full message");
        }

        const fullMessage = await response.json();

        console.log("FULL MESSAGE:", fullMessage);


        // Display full email text
        document.getElementById("modal-message").textContent =
            fullMessage.text ||
            message.intro ||
            "No message content.";


    } catch (error) {

        console.error("Full message error:", error);

        document.getElementById("modal-message").textContent =
            message.intro ||
            "Could not load full message.";
    }
}


// ===============================
// CLOSE EMAIL MODAL
// ===============================

function closeMessage() {

    document
        .getElementById("email-modal")
        .classList.remove("show");
}


// ===============================
// COPY EMAIL
// ===============================

async function copyEmail() {

    if (!currentEmail) return;

    try {

        await navigator.clipboard.writeText(currentEmail);

        alert("Email copied!");

    } catch (error) {

        alert("Could not copy email.");
    }
}


// ===============================
// SECURITY
// ===============================

function escapeHtml(text) {

    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ===============================
// LOAD SAVED EMAIL
// ===============================

const savedEmail =
    localStorage.getItem("quickmail_email");

const savedToken =
    localStorage.getItem("quickmail_token");


if (savedEmail && savedToken) {

    currentEmail = savedEmail;
    currentToken = savedToken;

    document.getElementById("email").textContent =
        currentEmail;

    refreshInbox();

} else {

    generateEmail();
}


// ===============================
// AUTO REFRESH EVERY 10 SECONDS
// ===============================

setInterval(refreshInbox, 10000);