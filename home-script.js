// home-script.js

(function() {
// Your Firebase project configuration
// It's good to have this here for clarity, even if another script also has it.
const firebaseConfig = {
  apiKey: "AIzaSyDH0XsBZ4G-gC6Jou_0VNp6GmgqVOnGsjQ",
  authDomain: "merchant-23d56.firebaseapp.com",
  databaseURL: "https://merchant-23d56-default-rtdb.firebaseio.com",
  projectId: "merchant-23d56",
  storageBucket: "merchant-23d56.firebasestorage.app",
  messagingSenderId: "850984297830",
  appId: "1:850984297830:web:ecc1f2f333eee3741814a7",
  measurementId: "G-EGFBQTLR3K"
};

// --- Firebase Initialization (Crucial for multi-script setup) ---
// This robust check ensures Firebase is initialized only ONCE.
// If another script (like dashboard_script.js) already initialized it,
// this script will simply get a reference to the existing app.
let app;
if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
    console.log("Firebase: home-script.js initialized the Firebase app.");
} else {
    app = firebase.app(); // Get the already initialized default app
    console.log("Firebase: home-script.js is using an already initialized Firebase app.");
}

const auth = firebase.auth();
const db = firebase.firestore();

// Function to fetch user balances from Firestore and update the UI
async function fetchAndDisplayBalances(uid) {
    console.log("Balances (home-script): Attempting to fetch balances for UID:", uid);
    try {
        const userDoc = await db.collection("users").doc(uid).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const balances = userData.balances;

            if (balances && typeof balances === 'object' && balances !== null) {
                const gbpData = balances.GBP;
                const gbpAmount = gbpData && gbpData.amount !== undefined ? Number(gbpData.amount) : 0;
                const gbpInput = document.getElementById('gbpBalance');
                if (gbpInput) gbpInput.value = '£ ' + gbpAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                else console.warn("Balances (home-script): 'gbpBalance' element not found.");

                const eurData = balances.EUR;
                const eurAmount = eurData && eurData.amount !== undefined ? Number(eurData.amount) : 0;
                const eurInput = document.getElementById('eurBalance');
                if (eurInput) eurInput.value = '€ ' + eurAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                else console.warn("Balances (home-script): 'eurBalance' element not found.");

                const usdData = balances.USD;
                const usdAmount = usdData && usdData.amount !== undefined ? Number(usdData.amount) : 0;
                const usdInput = document.getElementById('usdBalance');
                if (usdInput) usdInput.value = '$ ' + usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                else console.warn("Balances (home-script): 'usdBalance' element not found.");

                console.log("Balances (home-script): User balances displayed:", { gbp: gbpAmount, eur: eurAmount, usd: usdAmount });
            } else {
                console.warn("Balances (home-script): User document found but 'balances' field is missing or not an object. Defaulting to 0.00.");
                setBalanceDisplays('0.00');
            }
        } else {
            console.warn("Balances (home-script): User document not found for UID:", uid);
            setBalanceDisplays('Error: User data missing');
        }
    } catch (error) {
        console.error("Balances (home-script): Error fetching or displaying user balances:", error);
        setBalanceDisplays('Error loading');
    }
}

// Helper function to set all balance input values to a specific string
function setBalanceDisplays(value) {
    const gbpElement = document.getElementById('gbpBalance');
    const eurElement = document.getElementById('eurBalance');
    const usdElement = document.getElementById('usdBalance');

    const gbpSymbol = '£ ';
    const eurSymbol = '€ ';
    const usdSymbol = '$ ';

    if (gbpElement) gbpElement.value = gbpSymbol + value;
    if (eurElement) eurElement.value = eurSymbol + value;
    if (usdElement) usdElement.value = usdSymbol + value;
}

// --- DOM Content Loaded ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Loaded (home-script): Initializing auth state listener for balances.");

    // Set initial loading state for balances immediately
    setBalanceDisplays('Loading...');

    // Listen for Firebase authentication state changes
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            console.log("Auth State (home-script): User is signed in. Triggering balance fetch.");
            await fetchAndDisplayBalances(user.uid);
        } else {
            // No user is signed in, redirect them to the login page
            console.log("Auth State (home-script): No user is signed in. Redirecting to login page...");
            window.location.href = '../index.html'; // Adjust this path if needed
        }
    });
});

})();