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

const API_KEY = 'AIzaSyBFQV0r_yee2GXUeeEOxpLPcFUOoGRK4n0';
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

function levenshteinDistance(a, b) {
    const dp = Array(a.length + 1).fill(null).map(() => Array(b.length + 1).fill(0));
    
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
        }
    }

    return dp[a.length][b.length];
}

function correctTypos(text) {
    const dictionary = ["hi", "hello", "help", "bot", "chat", "query", "response", "database", "gemini", "api",
        "recon", "responses", "reverse", "rkhunter", "rootkit", "sandboxing", "scraping", "security", "session", "setoolkit", 
        "snort", "soc", "social", "socialscan", "spoofing", "spyware", "sql", "sqlmap", "steganography", "strings", 
        "sublist3r", "tcpdump", "tell", "testing", "theharvester", "there", "threat", "trojan", "trust", "two", "uses", 
        "volatility", "vpn", "web", "what", "wifi", "wireshark", "worm", "wpscan", "xss", "yara", "you", "your", "zap", "zero"];
    return text.split(" ").map(word => {
        let closestMatch = dictionary.reduce((a, b) => 
            levenshteinDistance(word, a) < levenshteinDistance(word, b) ? a : b
        );
        return levenshteinDistance(word, closestMatch) <= 2 ? closestMatch : word;
    }).join(" ");
}

function extractKeywords(text) {
    text = text.toLowerCase();
    return [...new Set([...text.matchAll(/\b\w+\b/g)].map(match => match[0]))].filter(word => word.length > 2);
}

async function insertResponse(userInput, botResponse) {
    try {
        userInput = correctTypos(userInput);
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

async function getResponseFromDB(userInput) {
    try {
        userInput = correctTypos(userInput);
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
        return null;
    } catch (error) {
        console.error('Retrieval error:', error);
        return null;
    }
}

async function fetchFromGemini(userInput) {
    try {
        userInput = correctTypos(userInput);
        const response = await fetch(`${API_URL}?key=${API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: `${userInput} give ethical response within 2 lines` }]
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

async function getResponse(userInput) {
    userInput = correctTypos(userInput);
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

function addMessage(message, isUser = true) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    messageDiv.innerHTML = isUser ? `&gt; ${message}` : message;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

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

document.getElementById('user-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
