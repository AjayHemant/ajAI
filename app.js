// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCIJGsw2Ge_kKBZJ1hbTsBNDn6mD2AyhPI",
    authDomain: "ajai-3cc8a.firebaseapp.com",
    projectId: "ajai-3cc8a",
    storageBucket: "ajai-3cc8a.appspot.com",
    messagingSenderId: "1019114189855",
    appId: "1:1019114189855:web:bf282b01ceebdfda63d12a"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Gemini API Configuration
const API_KEY = 'AIzaSyBFQV0r_yee2GXUeeEOxpLPcFUOoGRK4n0';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Predefined Cybersecurity Keywords (lowercase)
const CYBERSEC_KEYWORDS = new Set([
    "hi", "hello", "help", "bot", "chat", "query", "response", "database", "gemini", "api",
    "recon", "responses", "reverse", "rkhunter", "rootkit", "sandboxing", "scraping", "security", 
    "session", "setoolkit", "snort", "soc", "social", "socialscan", "spoofing", "spyware", "sql", 
    "sqlmap", "steganography", "strings", "sublist3r", "tcpdump", "tell", "testing", "theharvester", 
    "there", "threat", "trojan", "trust", "two", "uses", "volatility", "vpn", "web", "what", "wifi", 
    "wireshark", "worm", "wpscan", "xss", "yara", "you", "your", "zap", "zero"
].map(k => k.toLowerCase()));

// Levenshtein Distance Algorithm
function levenshteinDistance(a, b) {
    const matrix = Array(b.length + 1).fill(null).map(() => 
                     Array(a.length + 1).fill(null));
    
    for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= b.length; j++) {
        for (let i = 1; i <= a.length; i++) {
            const cost = a[i-1] === b[j-1] ? 0 : 1;
            matrix[j][i] = Math.min(
                matrix[j][i-1] + 1,
                matrix[j-1][i] + 1,
                matrix[j-1][i-1] + cost
            );
        }
    }
    return matrix[b.length][a.length];
}

// Find Closest Keyword from Cybersecurity List
function findClosestSecurityKeyword(input) {
    const inputLower = input.toLowerCase();
    let closest = { word: input, distance: Infinity };
    
    CYBERSEC_KEYWORDS.forEach(keyword => {
        const distance = levenshteinDistance(inputLower, keyword);
        if (distance < closest.distance && distance <= 2) {
            closest = { word: keyword, distance };
        }
    });
    
    return closest.word;
}

// Extract Keywords with Typo Correction
function extractKeywords(text) {
    const words = [...text.toLowerCase().matchAll(/\b\w{3,}\b/g)].map(m => m[0]);
    const processed = words.map(word => {
        return CYBERSEC_KEYWORDS.has(word) ? word : findClosestSecurityKeyword(word);
    });
    
    return [...new Set(processed)];
}

// Insert User Input and Bot Response into Firestore
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
    } catch (error) {
        console.error('Insert error:', error);
    }
}

// Retrieve Response from Firestore
async function getResponseFromDB(userInput) {
    try {
        const keywords = extractKeywords(userInput);
        
        for (const keyword of keywords) {
            const corrected = findClosestSecurityKeyword(keyword);
            const snapshot = await db.collection(corrected)
                .where('user_input', '==', userInput.toLowerCase())
                .limit(1)
                .get();

            if (!snapshot.empty) {
                return snapshot.docs[0].data().bot_response;
            }
        }
        return null;
    } catch (error) {
        console.error('Database error:', error);
        return null;
    }
}

// Fetch Response from Gemini API
async function fetchFromGemini(userInput) {
    try {
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        console.error('Gemini API error:', error);
        return 'Sorry, I encountered an error. Please try again.';
    }
}

// Get Response (Combines DB and Gemini)
async function getResponse(userInput) {
    // Check for "hi" and respond accordingly
    if (userInput.toLowerCase().trim() === 'hi') {
        return 'Hi there, how can I assist you today?';
    }

    let response = await getResponseFromDB(userInput);
    if (!response) {
        response = await fetchFromGemini(userInput);
        await insertResponse(userInput, response);
    }
    return response;
}

// Add Message to Chat UI
function addMessage(message, isUser = true) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.innerHTML = isUser ? `&gt; ${message}` : message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Send Message Handler
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const text = userInput.value.trim();

    if (text) {
        addMessage(text, true);
        userInput.value = '';
        const response = await getResponse(text);
        addMessage(response, false);
    }
}

// Event Listener for Enter Key
document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
