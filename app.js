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

function extractKeywords(text) {
    text = text.toLowerCase(); // Convert text to lowercase
    return [...new Set([...text.matchAll(/\b\w+\b/g)].map(match => match[0]))].filter(word => word.length > 2);
}

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

async function getResponseFromDB(userInput) {
    try {
        const keywords = extractKeywords(userInput); // Extract all words from the input
        for (const keyword of keywords) {
            // Check if the keyword exists in the database
            const querySnapshot = await db.collection(keyword).get();
            if (!querySnapshot.empty) {
                // Iterate through all documents in the collection
                for (const doc of querySnapshot.docs) {
                    // Check if the user input contains the document ID (keyword)
                    if (userInput.toLowerCase().includes(doc.id.toLowerCase())) {
                        return doc.data().bot_response; // Return the response if a match is found
                    }
                }
            }
        }
        return null; // Return null if no match is found
    } catch (error) {
        console.error('Retrieval error:', error);
        return null;
    }
}

async function fetchFromGemini(userInput) {
    try {
        const response = await fetch(${API_URL}?key=${API_KEY}, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: ${userInput} give ethical response within 2 lines
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


function addMessage(message, isUser = true) {
    const chatBox = document.getElementById('chat-box');
    const messageDiv = document.createElement('div');
    messageDiv.className = message ${isUser ? 'user-message' : 'bot-message'};
    messageDiv.innerHTML = isUser ? &gt; ${message} : message;
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

database details
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
