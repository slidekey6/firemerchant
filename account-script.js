// account-script.js

// Your Firebase project configuration
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

// Initialize Firebase services
// This ensures Firebase is initialized and its services are available for this page.
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Function to fetch user balances from Firestore and update the UI
async function fetchAndDisplayBalances(uid) {
    try {
        const userDoc = await db.collection("users").doc(uid).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const balances = userData.balances; // This should now be an object/map

            // Check if balances is a non-null object
            if (balances && typeof balances === 'object' && balances !== null) {
                // Process GBP balances
                const gbpData = balances.GBP; // Direct access
                const gbpAmount = gbpData && gbpData.amount !== undefined ? Number(gbpData.amount) : 0;
                const gbpPendingAmount = gbpData && gbpData.pendingAmount !== undefined ? Number(gbpData.pendingAmount) : 0;

                const gbpBalanceElement = document.getElementById('gbpBalance');
                const gbpPendingElement = document.getElementById('gbpPending');

                if (gbpBalanceElement) {
                    gbpBalanceElement.value = '£ ' + gbpAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                if (gbpPendingElement) {
                    gbpPendingElement.value = '£ ' + gbpPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }

                // Process EUR balances
                const eurData = balances.EUR; // Direct access
                const eurAmount = eurData && eurData.amount !== undefined ? Number(eurData.amount) : 0;
                const eurPendingAmount = eurData && eurData.pendingAmount !== undefined ? Number(eurData.pendingAmount) : 0;

                const eurBalanceElement = document.getElementById('eurBalance');
                const eurPendingElement = document.getElementById('eurPending');

                if (eurBalanceElement) {
                    eurBalanceElement.value = '€ ' + eurAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                if (eurPendingElement) {
                    eurPendingElement.value = '€ ' + eurPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }

                // Process USD balances
                const usdData = balances.USD; // Direct access
                const usdAmount = usdData && usdData.amount !== undefined ? Number(usdData.amount) : 0;
                const usdPendingAmount = usdData && usdData.pendingAmount !== undefined ? Number(usdData.pendingAmount) : 0;

                const usdBalanceElement = document.getElementById('usdBalance');
                const usdPendingElement = document.getElementById('usdPending');

                if (usdBalanceElement) {
                    usdBalanceElement.value = '$ ' + usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                if (usdPendingElement) {
                    usdPendingElement.value = '$ ' + usdPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }

                console.log("User balances displayed:", {
                    gbp: gbpAmount,
                    eur: eurAmount,
                    usd: usdAmount,
                    gbpPending: gbpPendingAmount,
                    eurPending: eurPendingAmount,
                    usdPending: usdPendingAmount
                });
            } else {
                console.warn("User document found but 'balances' field is missing or not an object. Defaulting to 0.00 for all.");
                setAllBalanceDisplays('0.00'); // Set all to default if balances object is missing/malformed
            }
        } else {
            console.warn("User document not found for UID:", uid);
            setAllBalanceDisplays('Error: User data missing'); // Indicate data not found
        }
    } catch (error) {
        console.error("Error fetching or displaying user balances:", error);
        setAllBalanceDisplays('Error loading'); // Indicate an error occurred
    }
}

// Helper function to set all balance input values (available and pending) to a specific string
function setAllBalanceDisplays(value) {
    // Check if the elements exist before trying to set their value
    const elementsToUpdate = [
        document.getElementById('gbpBalance'),
        document.getElementById('eurBalance'),
        document.getElementById('usdBalance'),
        document.getElementById('gbpPending'),
        document.getElementById('eurPending'),
        document.getElementById('usdPending')
    ];

    // Added currency symbols for the "Loading..." or "Error" states too for consistency
    const currencyMap = {
        'gbpBalance': '£ ',
        'gbpPending': '£ ',
        'eurBalance': '€ ',
        'eurPending': '€ ',
        'usdBalance': '$ ',
        'usdPending': '$ '
    };

    elementsToUpdate.forEach(element => {
        if (element) {
            const currencySymbol = currencyMap[element.id] || ''; // Get symbol based on ID
            element.value = currencySymbol + value;
        }
    });
}


// Ensure the DOM is fully loaded before trying to access elements
document.addEventListener('DOMContentLoaded', () => {
    // Listen for Firebase authentication state changes
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            // User is signed in, fetch and display their balance
            console.log("Firebase: User is signed in. Fetching balances...");
            await fetchAndDisplayBalances(user.uid);
        } else {
            // No user is signed in, redirect them to the login page
            console.log("Firebase: No user is signed in. Redirecting to login page...");
            // Assuming your login page (e.g., signup.html or index.html) is in the parent directory
            window.location.href = '../index.html'; // Adjust this path if your login page is elsewhere
        }
    });

    // Optionally set initial loading state for balances
    setAllBalanceDisplays('Loading...');
});
