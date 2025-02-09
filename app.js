// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCIJGsw2Ge_kKBZJ1hbTsBNDn6mD2AyhPI",
    authDomain: "ajai-3cc8a.firebaseapp.com",
    projectId: "ajai-3cc8a",
    storageBucket: "ajai-3cc8a.firebasestorage.app",
    messagingSenderId: "1019114189855",
    appId: "1:1019114189855:web:bf282b01ceebdfda63d12a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// List of valid keywords
const validKeywords = [
    "hi", "hello", "help", "bot", "chat", "query", "response", "database", "gemini", "api",
    "recon", "responses", "reverse", "rkhunter", "rootkit", "sandboxing", "scraping", "security",
    "session", "setoolkit", "snort", "soc", "social", "socialscan", "spoofing", "spyware", "sql",
    "sqlmap", "steganography", "strings", "sublist3r", "tcpdump", "tell", "testing", "theharvester",
    "there", "threat", "trojan", "trust", "two", "uses", "volatility", "vpn", "web", "what", "wifi",
    "wireshark", "worm", "wpscan", "xss", "yara", "you", "your", "zap", "zero"
];

// Function to calculate Levenshtein Distance (for typo correction)
function levenshteinDistance(a, b) {
    const matrix = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(null));
    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,   // Deletion
                matrix[i][j - 1] + 1,   // Insertion
                matrix[i - 1][j - 1] + cost // Substitution
            );
        }
    }
    return matrix[a.length][b.length];
}

// Function to find the closest match for a word (typo correction only)
function correctTypos(word) {
    let closestMatch = word;
    let smallestDistance = Infinity;

    validKeywords.forEach(keyword => {
        const distance = levenshteinDistance(word, keyword);
        if (distance < smallestDistance && distance <= 2) { // Allow typo tolerance of 2
            closestMatch = keyword;
            smallestDistance = distance;
        }
    });

    return closestMatch;
}

// Extract keywords and correct typos
function extractKeywords(text) {
    text = text.toLowerCase(); // Convert text to lowercase
    const words = [...new Set([...text.matchAll(/\b\w+\b/g)].map(match => match[0]))];
    const mappedKeywords = words.map(correctTypos).filter(word => word.length > 2); // Fix typos and filter

    console.log("Mapped Keywords:", mappedKeywords); // Debugging
    return mappedKeywords;
}

// Insert response into Firebase Firestore
async function insertResponse(userInput, botResponse) {
    try {
        const keywords = extractKeywords(userInput);
        const batch = db.batch();

        keywords.forEach(keyword => {
            const docRef = db.collection(keyword).doc(userInput.toLowerCase());
            batch.set(docRef, {
                user_input: userInput,
                bot_response: botResponse
            });
        });

        await batch.commit();
        console.log("Response inserted successfully!");
    } catch (error) {
        console.error("Insert error:", error);
    }
}

// Retrieve response from Firebase Firestore
async function getResponseFromDB(userInput) {
    try {
        const keywords = extractKeywords(userInput);

        for (const keyword of keywords) {
            const querySnapshot = await db.collection(keyword).get();
            if (!querySnapshot.empty) {
                for (const doc of querySnapshot.docs) {
                    if (userInput.toLowerCase().includes(doc.id.toLowerCase())) {
                        return doc.data().bot_response;
                    }
                }
            }
        }

        return null; // No match found
    } catch (error) {
        console.error("Retrieval error:", error);
        return null;
    }
}

// Fetch a fallback response using Gemini API (Optional)
const API_KEY = "AIzaSyBFQV0r_yee2GXUeeEOxpLPcFUOoGRK4n0";
const API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

async function fetchFromGemini(userInput) {
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${userInput} give ethical response within 2 lines`
                    }]
                }]
            })
        });

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("Gemini API error:", error);
        return "Sorry, I encountered an error. Please try again.";
    }
}

// Main function to get a response
async function getResponse(userInput) {
    // Check for simple greetings
    if (userInput.toLowerCase().trim() === "hi") {
        return "Hi there, how can I assist you today?";
    }

    // Check database
    let response = await getResponseFromDB(userInput);
    if (!response) {
        // Fallback to Gemini API if no response in DB
        response = await fetchFromGemini(userInput);
        await insertResponse(userInput, response); // Store response in DB for future
    }
    return response;
}

// Add messages to the chat interface
function addMessage(message, isUser = true) {
    const chatBox = document.getElementById("chat-box");
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isUser ? "user-message" : "bot-message"}`;
    messageDiv.innerHTML = isUser ? `&gt; ${message}` : message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Handle sending messages
async function sendMessage() {
    const userInput = document.getElementById("user-input");
    const text = userInput.value.trim();

    if (text) {
        addMessage(text, true);
        userInput.value = "";
        const response = await getResponse(text);
        addMessage(response, false);
    }
}

// Event listeners for both Enter key and Send button
document.getElementById("user-input").addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
});

document.getElementById("send-button").addEventListener("click", () => {
    sendMessage();
});
