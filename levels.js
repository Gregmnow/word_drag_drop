/**
 * ==========================================
 *  GAME LEVELS CONFIGURATION
 * ==========================================
 * 
 * HOW TO EDIT THIS FILE:
 * 1. This file contains all the levels and questions for the game.
 * 2. Each "Level" is a number (1, 2, 3...).
 * 3. Inside each level, there is a list of challenges.
 * 
 * HOW TO MAKE A NEW CHALLENGE:
 * - "text": This is the paragraph. Put square brackets [ ] around the word you want to be the hidden answer.
 *           Example: "The sky is [blue] and the grass is green."
 * 
 * - "words": This is the list of word choices for the player.
 *            You must mark the correct answer with `correct: true`.
 * 
 * EXAMPLE:
 * {
 *   text: "Hello, my name is [Antigravity].",
 *   words: [
 *     { text: "Antigravity", correct: true },
 *     { text: "Bob",         correct: false }
 *   ]
 * }
 */

const GAME_DATA = {
    1: [ // Level 1: Basics
        {
            text: "Security is everyone's responsibility in the digital age. To keep your account safe, you should always use a strong [password] that is hard for others to guess, and never write it down where it can be seen.",
            words: [
                { text: "password", correct: true },
                { text: "username", correct: false },
                { text: "link", correct: false },
                { text: "wifi", correct: false }
            ]
        },
        {
            text: "Malware comes in many forms, but a [virus] is one of the most common types. It is a piece of malicious software designed to spread from computer to computer and damage data.",
            words: [
                { text: "virus", correct: true },
                { text: "browser", correct: false },
                { text: "screen", correct: false },
                { text: "keyboard", correct: false }
            ]
        },
        {
            text: "Workplace security is vital. You should never share your login credentials with anyone, not even your [manager], because they should have their own access responsibilities.",
            words: [
                { text: "manager", correct: true },
                { text: "computer", correct: false },
                { text: "pet", correct: false },
                { text: "chair", correct: false }
            ]
        },
        {
            text: "Physical security is just as important as digital security. Always [lock] your computer screen when you step away from your desk to prevent unauthorized access.",
            words: [
                { text: "lock", correct: true },
                { text: "break", correct: false },
                { text: "sell", correct: false },
                { text: "paint", correct: false }
            ]
        }
    ],
    2: [ // Level 2: Intermediate
        {
            text: "Cybercriminals use many tactics to trick users. [Phishing] emails often pretend to be from a legitimate company to steal your information by asking you to click on malicious links.",
            words: [
                { text: "Phishing", correct: true },
                { text: "Fishing", correct: false },
                { text: "Spamming", correct: false },
                { text: "Calling", correct: false }
            ]
        },
        {
            text: "Relying on passwords alone is often not enough. Two-factor [authentication] adds an extra layer of security effectively stopping many attacks by requiring a second form of verification.",
            words: [
                { text: "authentication", correct: true },
                { text: "authorization", correct: false },
                { text: "application", correct: false },
                { text: "automation", correct: false }
            ]
        },
        {
            text: "Protecting sensitive data in transit is crucial. Data [encryption] scrambles information so that unauthorized users cannot read it, ensuring privacy even if the data is intercepted.",
            words: [
                { text: "encryption", correct: true },
                { text: "deletion", correct: false },
                { text: "corruption", correct: false },
                { text: "connection", correct: false }
            ]
        },
        {
            text: "Network defenses are the first line of protection. A [firewall] monitors and controls incoming and outgoing network traffic based on predetermined security rules to block malicious activity.",
            words: [
                { text: "firewall", correct: true },
                { text: "waterfall", correct: false },
                { text: "brickwall", correct: false },
                { text: "fireball", correct: false }
            ]
        }
    ],
    3: [ // Level 3: Advanced
        {
            text: "Systems naturally decay over time without maintenance. A [vulnerability] is a weakness in a system that can be exploited by a threat actor to perform unauthorized actions.",
            words: [
                { text: "vulnerability", correct: true },
                { text: "strength", correct: false },
                { text: "durability", correct: false },
                { text: "capability", correct: false }
            ]
        },
        {
            text: "Proactive security measures are essential for robust defense. Penetration testing is a simulated cyber attack against your system to check for exploitable [vulnerabilities] before real attackers find them.",
            words: [
                { text: "vulnerabilities", correct: true },
                { text: "updates", correct: false },
                { text: "features", correct: false },
                { text: "users", correct: false }
            ]
        },
        {
            text: "Understanding the enemy is key to defense. [Malware] analysis involves dissecting malicious software to understand how it works, what it targets, and how to defeat it.",
            words: [
                { text: "Malware", correct: true },
                { text: "Hardware", correct: false },
                { text: "Software", correct: false },
                { text: "Freeware", correct: false }
            ]
        },
        {
            text: "Humans are often the weakest link in security. Social [engineering] relies on manipulating people into performing actions or divulging confidential information rather than hacking software directly.",
            words: [
                { text: "engineering", correct: true },
                { text: "marketing", correct: false },
                { text: "networking", correct: false },
                { text: "gathering", correct: false }
            ]
        }
    ]
};
