// List of valid keywords (including synonyms)
const validKeywords = [
    "hi", "hello", "help", "bot", "chat", "query", "response", "database", "gemini", "api",
    "recon", "responses", "reverse", "rkhunter", "rootkit", "sandboxing", "scraping", "security",
    "session", "setoolkit", "snort", "soc", "social", "socialscan", "spoofing", "spyware", "sql",
    "sqlmap", "steganography", "strings", "sublist3r", "tcpdump", "tell", "testing", "theharvester",
    "there", "threat", "trojan", "trust", "two", "uses", "volatility", "vpn", "web", "what", "wifi",
    "wireshark", "worm", "wpscan", "xss", "yara", "you", "your", "zap", "zero"
];

// Synonym Mapping
const synonyms = {
    "hi": "hello",
    "hey": "hello",
    "howdy": "hello",
    "greetings": "hello",
    "bot": "chat",
    "chatbot": "chat",
    "assistant": "chat",
    "thanks": "thank you",
    "thx": "thank you",
    "thankyou": "thank you",
    "wifi": "network",
    "wireless": "network",
    "connection": "network",
    "xss": "cross-site scripting",
    "cross site scripting": "cross-site scripting",
    "sql": "database",
    "db": "database",
    "recon": "reconnaissance",
    "reconnaissance": "reconnaissance",
    "social": "social engineering",
    "phishing": "social engineering",
    "spying": "social engineering",
    "security": "protection",
    "protection": "security",
    "sandbox": "sandboxing",
    "network": "vpn",
    "virtual private network": "vpn",
    "password": "hashing",
    "encryption": "hashing",
    "spoofing": "fake",
    "forgery": "fake",
    "spyware": "malware",
    "virus": "malware",
    "trojan": "malware",
    "worm": "malware",
    "testing": "pen testing",
    "pentest": "pen testing",
    "sqlmap": "database scanner",
    "theharvester": "recon tool",
    "tcpdump": "network analysis",
    "wireshark": "network analysis",
    "vpn": "secure connection",
    "steganography": "hidden data",
    "data hiding": "hidden data",
    "strings": "text",
    "rkhunter": "rootkit scanner",
    "zap": "owasp zap",
    "burpsuite": "security testing",
    "wpscan": "wordpress scanner",
    "yara": "malware analysis",
    "firewall": "protection",
    "zero-day": "vulnerability",
    "trust": "secure",
    "privacy": "secure",
    "help": "support",
    "guide": "support",
    "tutorial": "support",
    "info": "information",
    "information": "details",
    "what": "query",
    "how": "query",
    "where": "query",
    "why": "query",
    "tell": "explain",
    "explain": "describe",
    "reverse": "reverse engineering",
    "debugging": "reverse engineering",
};

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

// Function to find the closest match for a word
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

// Function to map words to their main keywords and fix typos
function mapToKeywords(word) {
    const correctedWord = correctTypos(word); // Fix typos
    return synonyms[correctedWord] || correctedWord; // Map to main keyword
}

// Modify `extractKeywords` to handle synonyms and fix typos
function extractKeywords(text) {
    text = text.toLowerCase(); // Convert text to lowercase
    const words = [...new Set([...text.matchAll(/\b\w+\b/g)].map(match => match[0]))];
    return words.map(mapToKeywords).filter(word => word.length > 2); // Map to main keywords and filter
}

// The rest of the code remains the same
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
            const querySnapshot = await db.collection(keyword).get();
            if (!querySnapshot.empty) {
                for (const doc of querySnapshot.docs) {
                    if (userInput.toLowerCase().includes(doc.id.toLowerCase())) {
                        return doc.data().bot_response;
                    }
                }
            }
        }
        return null; // Return null if no match is found
    } catch (error) {
        console.error('Retrieval error:', error);
        return null;
    }
}// List of valid keywords (including synonyms)
const validKeywords = [
    "hi", "hello", "help", "bot", "chat", "query", "response", "database", "gemini", "api",
    "recon", "responses", "reverse", "rkhunter", "rootkit", "sandboxing", "scraping", "security",
    "session", "setoolkit", "snort", "soc", "social", "socialscan", "spoofing", "spyware", "sql",
    "sqlmap", "steganography", "strings", "sublist3r", "tcpdump", "tell", "testing", "theharvester",
    "there", "threat", "trojan", "trust", "two", "uses", "volatility", "vpn", "web", "what", "wifi",
    "wireshark", "worm", "wpscan", "xss", "yara", "you", "your", "zap", "zero"
];

// Synonym Mapping
const synonyms = {
    "hi": "hello",
    "hey": "hello",
    "howdy": "hello",
    "greetings": "hello",
    "bot": "chat",
    "chatbot": "chat",
    "assistant": "chat",
    "thanks": "thank you",
    "thx": "thank you",
    "thankyou": "thank you",
    "wifi": "network",
    "wireless": "network",
    "connection": "network",
    "xss": "cross-site scripting",
    "cross site scripting": "cross-site scripting",
    "sql": "database",
    "db": "database",
    "recon": "reconnaissance",
    "reconnaissance": "reconnaissance",
    "social": "social engineering",
    "phishing": "social engineering",
    "spying": "social engineering",
    "security": "protection",
    "protection": "security",
    "sandbox": "sandboxing",
    "network": "vpn",
    "virtual private network": "vpn",
    "password": "hashing",
    "encryption": "hashing",
    "spoofing": "fake",
    "forgery": "fake",
    "spyware": "malware",
    "virus": "malware",
    "trojan": "malware",
    "worm": "malware",
    "testing": "pen testing",
    "pentest": "pen testing",
    "sqlmap": "database scanner",
    "theharvester": "recon tool",
    "tcpdump": "network analysis",
    "wireshark": "network analysis",
    "vpn": "secure connection",
    "steganography": "hidden data",
    "data hiding": "hidden data",
    "strings": "text",
    "rkhunter": "rootkit scanner",
    "zap": "owasp zap",
    "burpsuite": "security testing",
    "wpscan": "wordpress scanner",
    "yara": "malware analysis",
    "firewall": "protection",
    "zero-day": "vulnerability",
    "trust": "secure",
    "privacy": "secure",
    "help": "support",
    "guide": "support",
    "tutorial": "support",
    "info": "information",
    "information": "details",
    "what": "query",
    "how": "query",
    "where": "query",
    "why": "query",
    "tell": "explain",
    "explain": "describe",
    "reverse": "reverse engineering",
    "debugging": "reverse engineering",
};

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

// Function to find the closest match for a word
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

// Function to map words to their main keywords and fix typos
function mapToKeywords(word) {
    const correctedWord = correctTypos(word); // Fix typos
    return synonyms[correctedWord] || correctedWord; // Map to main keyword
}

// Modify `extractKeywords` to handle synonyms and fix typos
function extractKeywords(text) {
    text = text.toLowerCase(); // Convert text to lowercase
    const words = [...new Set([...text.matchAll(/\b\w+\b/g)].map(match => match[0]))];
    return words.map(mapToKeywords).filter(word => word.length > 2); // Map to main keywords and filter
}

// The rest of the code remains the same
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
            const querySnapshot = await db.collection(keyword).get();
            if (!querySnapshot.empty) {
                for (const doc of querySnapshot.docs) {
                    if (userInput.toLowerCase().includes(doc.id.toLowerCase())) {
                        return doc.data().bot_response;
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
