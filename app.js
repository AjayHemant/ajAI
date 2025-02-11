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

// API Keys
const MAIN_API_KEY = 'AIzaSyBFQV0r_yee2GXUeeEOxpLPcFUOoGRK4n0'; // Main API for response generation
const CYBER_SECURITY_API_KEY_1 = 'AIzaSyC-W-GYND0DNTfr72emFdupwF-hUlgzhnM'; // First API for cybersecurity check
const CYBER_SECURITY_API_KEY_2 = 'AIzaSyDkMr2ctSsBqVhPVpLac8psseHNvxIxviA'; // Second API for cybersecurity check
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

// Function to check if the input is related to cybersecurity
async function checkCyberSecurity(userInput) {
    try {
        // Use the first cybersecurity API
        const response1 = await fetch(`${API_URL}?key=${CYBER_SECURITY_API_KEY_1}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${userInput} Is this question related to cybersecurity? Answer strictly with 'yes' or 'no' only.`
                    }]
                }]
            })
        });

        const data1 = await response1.json();
        const answer1 = data1.candidates[0].content.parts[0].text.trim().toLowerCase();

        // If the first API returns 'yes', proceed
        if (answer1 === 'yes') {
            return true;
        }

        // If the first API returns 'no', use the second API for confirmation
        const response2 = await fetch(`${API_URL}?key=${CYBER_SECURITY_API_KEY_2}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `${userInput} Is this question related to cybersecurity? Answer strictly with 'yes' or 'no' only.`
                    }]
                }]
            })
        });

        const data2 = await response2.json();
        const answer2 = data2.candidates[0].content.parts[0].text.trim().toLowerCase();

        // If the second API also returns 'no', the question is not cybersecurity-related
        return answer2 === 'yes';
    } catch (error) {
        console.error('Cybersecurity check error:', error);
        return false;
    }
}

// Function to extract keywords from the input
function extractKeywords(text) {
    text = text.toLowerCase();
    return [...new Set([...text.matchAll(/\b\w+\b/g)].map(match => match[0]))].filter(word => word.length > 2);
}

// Function to insert user input and bot response into the database
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

// Function to retrieve a response from the database
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
        return null;
    } catch (error) {
        console.error('Retrieval error:', error);
        return null;
    }
}

// Function to fetch a response from the Gemini API
async function fetchFromGemini(userInput) {
    try {
        const response = await fetch(`${API_URL}?key=${MAIN_API_KEY}`, {
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

// Function to get the final response
async function getResponse(userInput) {
    // Check for "hi" and respond accordingly
    if (userInput.toLowerCase().trim() === 'hi') {
        return 'Hi there, how can I assist you today?';
    }

    // Check if the input is related to cybersecurity
    const isCyberSecurity = await checkCyberSecurity(userInput);
    if (!isCyberSecurity) {
        return 'dengithe shape out aithav';
    }

    // Proceed with normal flow
    let response = await getResponseFromDB(userInput);
    if (!response) {
        response = await fetchFromGemini(userInput);
        await insertResponse(userInput, response);
    }
    return response;
}

// UI Functions
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
