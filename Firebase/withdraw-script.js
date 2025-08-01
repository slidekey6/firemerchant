// withdraw-script.js

// Your Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyDH0XsBZ4G-gC6Jou_0VNp6GmgqVOnGsjQ",
    authDomain: "merchant-23d56.firebaseapp.com",
    databaseURL: "https://merchant-23d56-default-rtdb.firebaseio.com",
    projectId: "merchant-23d56",
    storageBucket: "merchant-23d56.firebasestorage.app",
    messagingSenderId: "850984297830",
    appId: "1:850984297830:web:ecc1f2f333eee3741814a7", // Corrected appId from your facts
    measurementId: "G-EGFBQTLR3K"
};

// Initialize Firebase services
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// --- Global Variables & DOM Element References ---
let currentUserId = null;
// Initialize active currency. Assuming GBP is the default visible on page load.
let activeCurrency = 'GBP';
// Store all fetched balances here for quick access
// MODIFIED: Now includes a 'pendingAmount' property
let allUserBalances = { 
    GBP: { amount: 0, pendingAmount: 0 }, 
    EUR: { amount: 0, pendingAmount: 0 }, 
    USD: { amount: 0, pendingAmount: 0 } 
};

const witAmountInput = document.getElementById('witAmountInput');
const amountInput2 = document.getElementById('AmountInput2'); // This will now show the entered withdrawal amount
const proceedButton = document.getElementById('WithBut');

// References to the balance display inputs for each currency (in the hidden layers)
const gbpWitBalanceElement = document.getElementById('gbpWitBalance');
const eurWitBalanceElement = document.getElementById('eurWitBalance');
const usdWitBalanceElement = document.getElementById('usdWitBalance');

// References to the currency selection layers inside the dropdown
const gbpSelectLayer = document.getElementById('Layer7'); // BritishPounds (GBP)
const eurSelectLayer = document.getElementById('Layer11'); // Euro (EUR)
const usdSelectLayer = document.getElementById('Layer9'); // United State Dollar (USD)

// References to the main display elements that show which currency is active
const gbpMainDisplayLayer = document.getElementById('GbpButLayer');
const eurMainDisplayLayer = document.getElementById('EurButLayer');
const usdMainDisplayLayer = document.getElementById('UsdButLayer');

// References to the currency-specific balance display layers (gbpLayer, eurLayer, usdLayer)
const gbpBalanceLayer = document.getElementById('gbpLayer');
const eurBalanceLayer = document.getElementById('eurLayer');
const usdBalanceLayer = document.getElementById('usdLayer');

// The dropdown container itself
const dropdown = document.getElementById('DropDown');

// NEW: Variable for the full-page preloader
let pagePreloaderDiv;

// NEW: Reference to the pending amount message element
const balancePendingAmountMessage = document.getElementById('balancePendingAmountMessage');


// NEW: Function to hide the full-page preloader
const hidePagePreloader = () => {
    if (pagePreloaderDiv) {
        // Add a small delay for a smoother transition
        setTimeout(() => {
            pagePreloaderDiv.classList.add('hidden');
        }, 300); // Wait 300ms after data is ready before hiding
    }
};


// --- Helper function for toggling element visibility ---
// This function mimics the ShowObject behavior from your WYSIWYG Web Builder
function ShowObject(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.style.visibility = show ? 'visible' : 'hidden';
        element.style.display = show ? '' : 'none'; // Also manage display to affect layout
    }
    // No need to return anything, just modify the element
}


// --- Function to update the UI based on selected currency ---
function updateUIForSelectedCurrency(currency) {
    activeCurrency = currency;
    console.log(`Active currency set to: ${activeCurrency}`);

    // Hide all main currency display layers
    ShowObject('GbpButLayer', 0);
    ShowObject('EurButLayer', 0);
    ShowObject('UsdButLayer', 0);

    // Hide all 'D' suffix layers (these are presumably alternate display buttons in the dropdown)
    ShowObject('gbpButLayerD', 0);
    ShowObject('eurButLayerD', 0);
    ShowObject('usdButLayerD', 0);

    // Hide all currency-specific balance display layers (the small inputs with the amount)
    ShowObject('gbpLayer', 0);
    ShowObject('eurLayer', 0);
    ShowObject('usdLayer', 0);

    // Show only the selected currency's main display and its corresponding balance layer
    if (currency === 'GBP') {
        ShowObject('GbpButLayer', 1);
        ShowObject('gbpButLayerD', 1);
        ShowObject('gbpLayer', 1);
    } else if (currency === 'EUR') {
        ShowObject('EurButLayer', 1);
        ShowObject('eurButLayerD', 1);
        ShowObject('eurLayer', 1);
    } else if (currency === 'USD') {
        ShowObject('UsdButLayer', 1);
        ShowObject('usdButLayerD', 1);
        ShowObject('usdLayer', 1);
    }

    // Hide the dropdown menu after selection
    ShowObject('DropDown', 0);

    // NEW: Clear and hide the pending message when currency selection changes
    if (balancePendingAmountMessage) {
        balancePendingAmountMessage.style.display = 'none';
        balancePendingAmountMessage.textContent = '';
    }
}

// --- Function to fetch user balances from Firestore and update all relevant UI elements ---
async function fetchAndDisplayBalances(uid) {
    try {
        const userDoc = await db.collection("users").doc(uid).get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const balances = userData.balances;

            if (balances && typeof balances === 'object' && balances !== null) {
                // MODIFIED: Store fetched balances and pending amounts
                allUserBalances.GBP.amount = balances.GBP && balances.GBP.amount !== undefined ? Number(balances.GBP.amount) : 0;
                allUserBalances.GBP.pendingAmount = balances.GBP && balances.GBP.pendingAmount !== undefined ? Number(balances.GBP.pendingAmount) : 0;
                allUserBalances.GBP.currency = balances.GBP?.currency || 'GBP';

                allUserBalances.EUR.amount = balances.EUR && balances.EUR.amount !== undefined ? Number(balances.EUR.amount) : 0;
                allUserBalances.EUR.pendingAmount = balances.EUR && balances.EUR.pendingAmount !== undefined ? Number(balances.EUR.pendingAmount) : 0;
                allUserBalances.EUR.currency = balances.EUR?.currency || 'EUR';

                allUserBalances.USD.amount = balances.USD && balances.USD.amount !== undefined ? Number(balances.USD.amount) : 0;
                allUserBalances.USD.pendingAmount = balances.USD && balances.USD.pendingAmount !== undefined ? Number(balances.USD.pendingAmount) : 0;
                allUserBalances.USD.currency = balances.USD?.currency || 'USD';


                const currencyFormatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 };

                // Update all individual currency balance display inputs with symbols
                if (gbpWitBalanceElement) gbpWitBalanceElement.value = '£ ' + allUserBalances.GBP.amount.toLocaleString('en-US', currencyFormatOptions);
                if (document.getElementById('gbpWitBalance1')) document.getElementById('gbpWitBalance1').value = '£ ' + allUserBalances.GBP.amount.toLocaleString('en-US', currencyFormatOptions);

                if (eurWitBalanceElement) eurWitBalanceElement.value = '€ ' + allUserBalances.EUR.amount.toLocaleString('en-US', currencyFormatOptions);
                if (document.getElementById('eurWitBalance1')) document.getElementById('eurWitBalance1').value = '€ ' + allUserBalances.EUR.amount.toLocaleString('en-US', currencyFormatOptions);

                if (usdWitBalanceElement) usdWitBalanceElement.value = '$ ' + allUserBalances.USD.amount.toLocaleString('en-US', currencyFormatOptions);
                if (document.getElementById('usdWitBalance1')) document.getElementById('usdWitBalance1').value = '$ ' + allUserBalances.USD.amount.toLocaleString('en-US', currencyFormatOptions);

                console.log("User balances loaded:", allUserBalances);

                updateUIForSelectedCurrency(activeCurrency);

            } else {
                console.warn("User document found but 'balances' field is missing or not an object. Defaulting to 0.00.");
                // Reset global balances and update UI
                allUserBalances = { 
                    GBP: { amount: 0, pendingAmount: 0, currency: 'GBP' }, 
                    EUR: { amount: 0, pendingAmount: 0, currency: 'EUR' }, 
                    USD: { amount: 0, pendingAmount: 0, currency: 'USD' } 
                };
                setAllBalanceInputs('0.00'); // Helper to update all relevant fields
                updateUIForSelectedCurrency(activeCurrency);
            }
        } else {
            console.warn("User document not found for UID:", uid);
            // Reset global balances and update UI
            allUserBalances = { 
                GBP: { amount: 0, pendingAmount: 0, currency: 'GBP' }, 
                EUR: { amount: 0, pendingAmount: 0, currency: 'EUR' }, 
                USD: { amount: 0, pendingAmount: 0, currency: 'USD' } 
            };
            setAllBalanceInputs('Error: User data missing'); // Helper to update all relevant fields
            updateUIForSelectedCurrency(activeCurrency);
        }
    } catch (error) {
        console.error("Error fetching or displaying user balances:", error);
        allUserBalances = { 
            GBP: { amount: 0, pendingAmount: 0, currency: 'GBP' }, 
            EUR: { amount: 0, pendingAmount: 0, currency: 'EUR' }, 
            USD: { amount: 0, pendingAmount: 0, currency: 'USD' } 
        };
        setAllBalanceInputs('Error loading');
        updateUIForSelectedCurrency(activeCurrency);
    } finally {
        hidePagePreloader(); // <--- IMPORTANT: Hide the full page preloader here!
        // NEW: Ensure message is cleared on balance load
        if (balancePendingAmountMessage) {
            balancePendingAmountMessage.style.display = 'none';
            balancePendingAmountMessage.textContent = '';
        }
    }
}

// Helper function to set all balance input values to a specific string
function setAllBalanceInputs(value) {
    const elementsToUpdate = [
        gbpWitBalanceElement, document.getElementById('gbpWitBalance1'),
        eurWitBalanceElement, document.getElementById('eurWitBalance1'),
        usdWitBalanceElement, document.getElementById('usdWitBalance1'),
        // amountInput2 is intentionally NOT included here as it will now mirror witAmountInput
    ];

    // Map element IDs to their respective currency symbols
    const currencySymbolMap = {
        'gbpWitBalance': '£ ',
        'gbpWitBalance1': '£ ',
        'eurWitBalance': '€ ',
        'eurWitBalance1': '€ ',
        'usdWitBalance': '$ ',
        'usdWitBalance1': '$ '
    };

    elementsToUpdate.forEach(element => {
        if (element) {
            const prefix = currencySymbolMap[element.id] || ''; // Get the correct symbol for the element
            element.value = prefix + value;
        }
    });
}


// --- Input Formatting Logic ---
let currentWitAmountRawValue = ''; // Global variable to store the raw numeric value

function setCursorPosition(el, pos) {
    if (el.setSelectionRange) {
        el.setSelectionRange(pos, pos);
    } else if (el.createTextRange) {
        const range = el.createTextRange();
        range.collapse(true);
        range.moveEnd('character', pos);
        range.moveStart('character', pos);
        range.select();
    }
}

function formatForInputDisplay(value) {
    let cleanedValue = value.replace(/[^\d.]/g, '');
    const parts = cleanedValue.split('.');
    if (parts.length > 2) {
        cleanedValue = parts[0] + '.' + parts.slice(1).join('');
    }
    if (cleanedValue.length > 1 && cleanedValue.startsWith('0') && cleanedValue[1] !== '.') {
        cleanedValue = parseFloat(cleanedValue).toString();
    }
    if (cleanedValue === '' || cleanedValue === '.') {
        return cleanedValue;
    }
    let numberPart = parseFloat(cleanedValue);
    if (isNaN(numberPart)) {
        return cleanedValue;
    }
    let formattedInteger = Math.floor(numberPart).toLocaleString('en-US');
    if (cleanedValue.endsWith('.') && parts.length > 1) {
        return formattedInteger + '.';
    } else if (parts.length > 1) {
        if (cleanedValue.startsWith('.')) {
            formattedInteger = '0';
        }
        return formattedInteger + '.' + parts[1];
    } else {
        return formattedInteger;
    }
}

/// This function removes trailing .00 if the number is an integer
function formatAmountForWitInputOnBlur(num) {
    if (isNaN(num)) return '';
    // Format the number to a maximum of 2 decimal places, then apply locale-specific formatting
    // with thousands separators. It will also remove trailing .00 for whole numbers.
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// --- Toast Notification Function ---
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.textContent = message;
    toast.style.position = 'fixed';
    toast.style.bottom = '20px';
    toast.style.left = '50%';
    toast.style.transform = 'translateX(-50%)';
    toast.style.padding = '10px 20px';
    toast.style.borderRadius = '5px';
    toast.style.color = 'white';
    toast.style.zIndex = '1000';
    toast.style.fontSize = '16px';
    toast.style.textAlign = 'center';
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.5s ease-in-out';
    toast.style.whiteSpace = 'nowrap';

    if (type === 'success') {
        toast.style.backgroundColor = '#4CAF50';
    } else if (type === 'error') {
        toast.style.backgroundColor = '#f44336';
    } else {
        toast.style.backgroundColor = '#333';
    }

    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '1';
    }, 10);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => {
            toast.remove();
        }, 500);
    }, 3000);
}


// --- Main DOM Content Loaded Event Listener ---
document.addEventListener('DOMContentLoaded', () => {

    // Get the page preloader div (it's already in the HTML and visible by default)
    pagePreloaderDiv = document.getElementById('page-preloader');

    // --- Firebase Authentication State Observer ---
    auth.onAuthStateChanged(async (user) => {
        if (user) {
            currentUserId = user.uid;
            console.log("User is signed in. UID:", currentUserId);
            proceedButton.disabled = false; // Enable the withdraw button
            await fetchAndDisplayBalances(currentUserId); // fetchAndDisplayBalances will handle preloader hiding
        } else {
            currentUserId = null;
            console.log("No user is signed in. Redirecting to login page...");
            // Hide preloader if user is not logged in and we're redirecting
            hidePagePreloader();
            // Optionally redirect to login or show a message
            setTimeout(() => { // Add a small delay for UX consistency
                window.location.href = '../index.html'; // Example redirect
            }, 300);
            proceedButton.disabled = true; // Disable the withdraw button
            setAllBalanceInputs('Log in to view');
        }
    });

    // Initial setup: ensure all balance inputs show 'Loading...'
    setAllBalanceInputs('Loading...');
    // And ensure amountInput2 is initially empty, as it mirrors witAmountInput
    amountInput2.value = '';

    // --- Input and Formatting Event Listeners ---
    witAmountInput.addEventListener('input', (event) => {
        let value = event.target.value;
        let oldCursorPos = event.target.selectionStart;
        let oldValue = value;

        let cleanedForParse = value.replace(/[^0-9.]/g, '');
        const parts = cleanedForParse.split('.');
        if (parts.length > 2) {
            cleanedForParse = parts[0] + '.' + parts.slice(1).join('');
        }
        if (cleanedForParse.length > 1 && cleanedForParse.startsWith('0') && cleanedValue[1] !== '.') {
            cleanedValue = parseFloat(cleanedValue).toString(); // Corrected variable name here
        }

        currentWitAmountRawValue = cleanedForParse;

        let formattedValueForWitInput = formatForInputDisplay(cleanedForParse);
        event.target.value = formattedValueForWitInput;
        amountInput2.value = formattedValueForWitInput; // <-- Update AmountInput2

        let newNumCommas = (formattedValueForWitInput.match(/,/g) || []).length;
        let oldNumCommas = (oldValue.match(/,/g) || []).length;
        let numCommasDiff = newNumCommas - oldNumCommas;
        let newCursorPos = oldCursorPos + numCommasDiff;
        setCursorPosition(event.target, newCursorPos);
    });

    witAmountInput.addEventListener('blur', () => {
        let num = parseFloat(currentWitAmountRawValue);
        if (!isNaN(num) && currentWitAmountRawValue !== '') {
            // Use the modified formatAmountForWitInputOnBlur
            witAmountInput.value = formatAmountForWitInputOnBlur(num);
            amountInput2.value = witAmountInput.value; // <-- Update AmountInput2 on blur as well
        } else {
            witAmountInput.value = '';
            amountInput2.value = ''; // <-- Clear AmountInput2 if witAmountInput is empty
        }
    });


    // --- Currency Selection Event Listeners (Dropdown Options) ---
    // Make sure these match the onclick attributes in your HTML for the dropdown
    // Layers (Layer11, Layer7, Layer9)
    eurSelectLayer.addEventListener('click', () => {
        updateUIForSelectedCurrency('EUR');
    });

    gbpSelectLayer.addEventListener('click', () => {
        updateUIForSelectedCurrency('GBP');
    });

    usdSelectLayer.addEventListener('click', () => {
        updateUIForSelectedCurrency('USD');
    });

    // Also add event listeners to the main currency display buttons to open the dropdown
    gbpMainDisplayLayer.addEventListener('click', () => ShowObject('DropDown', 1));
    eurMainDisplayLayer.addEventListener('click', () => ShowObject('DropDown', 1));
    usdMainDisplayLayer.addEventListener('click', () => ShowObject('DropDown', 1));


    // --- PROCEED Button Click Listener ---
    proceedButton.addEventListener('click', async () => {
        // NEW: Clear any previous pending message before processing
        if (balancePendingAmountMessage) {
            balancePendingAmountMessage.style.display = 'none';
            balancePendingAmountMessage.textContent = '';
        }

        if (!currentUserId) {
            showToast("Please log in to make a withdrawal.", 'error');
            return;
        }

        // Get the current available balance and pending amount for the active currency
        const currentCurrencyData = allUserBalances[activeCurrency];
        const currentUserBalance = currentCurrencyData.amount;
        const currentPendingAmount = currentCurrencyData.pendingAmount; // Get the pending amount

        const enteredAmount = parseFloat(currentWitAmountRawValue);
        const MIN_WITHDRAWAL_AMOUNT = 5; // Example minimum withdrawal amount

        // Input validation
        if (isNaN(enteredAmount) || enteredAmount <= 0) {
            showToast("Please enter a valid positive amount to withdraw.", 'error');
            return;
        }

        // NEW: Check for pending amount for the selected currency
        if (currentPendingAmount > 0) {
            const formattedPendingAmount = currentPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const formattedAvailableBalance = currentUserBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

            let symbol = '';
            if (activeCurrency === 'GBP') symbol = '£';
            if (activeCurrency === 'EUR') symbol = '€';
            if (activeCurrency === 'USD') symbol = '$';

            // Display the message using the dedicated element
            if (balancePendingAmountMessage) {
                balancePendingAmountMessage.textContent = 
                    `KINDLY PAY PENDING AMOUNT OF ${symbol} ${formattedPendingAmount} TO WITHDRAW YOUR AVAILABLE BALANCE OF ${symbol} ${formattedAvailableBalance}.`;
                balancePendingAmountMessage.style.display = 'block'; // Make it visible
            }
            // showToast("Please clear your pending amount before new withdrawals.", 'error'); // REMOVED THIS TOAST
            return; // Stop the withdrawal process
        }


        // Check conditions for withdrawal (these will only run if no pending amount)
        if (currentUserBalance < MIN_WITHDRAWAL_AMOUNT && currentUserBalance !== 0) {
            showToast(`Insufficient Balance: Minimum required balance for ${activeCurrency} is ${MIN_WITHDRAWAL_AMOUNT}.`, 'error');
        } else if (currentUserBalance === 0) {
            showToast("Insufficient Balance: Your balance is 0.", 'error');
        } else if (enteredAmount < MIN_WITHDRAWAL_AMOUNT) {
            showToast(`Minimum Withdrawal Amount for ${activeCurrency} is ${MIN_WITHDRAWAL_AMOUNT}.`, 'error');
        } else if (enteredAmount > currentUserBalance) {
            showToast("Insufficient Balance: You are trying to withdraw more than you have.", 'error');
        } else {
            // All client-side checks passed, proceed with Firebase withdrawal
            try {
                // Disable button to prevent double-submission
                proceedButton.disabled = true;
                showToast("Processing withdrawal...", 'info');

                const userDocRef = db.collection('users').doc(currentUserId);

                await db.runTransaction(async (transaction) => {
                    const userDoc = await transaction.get(userDocRef);

                    if (!userDoc.exists) {
                        throw new Error("User data not found. Please contact support.");
                    }

                    const userData = userDoc.data();
                    // Get existing balances object, or initialize if missing
                    const currentBalances = userData.balances || {};

                    const currentBalanceInDb = currentBalances[activeCurrency]?.amount || 0;
                    const currentPendingInDb = currentBalances[activeCurrency]?.pendingAmount || 0; // Get pending from DB
                    
                    const currentCurrencySymbol = currentBalances[activeCurrency]?.currency || activeCurrency;

                    // Re-check balance from DB to ensure no race condition before update
                    if (currentBalanceInDb < enteredAmount) {
                        throw new Error(`Insufficient funds (DB check). Your current ${activeCurrency} balance is ${currentBalanceInDb.toFixed(2)}.`);
                    }
                    // Re-check pending from DB for safety, though UI check already handles this
                    if (currentPendingInDb > 0) {
                        throw new Error(`Pending amount found (DB check). Please clear pending funds.`);
                    }


                    const newBalanceValue = currentBalanceInDb - enteredAmount;
                    const newPendingValue = currentPendingInDb + enteredAmount; // Add to pending

                    const updatedBalances = {
                        ...currentBalances, // Spread existing balances to preserve other currencies
                        [activeCurrency]: {
                            amount: newBalanceValue,
                            currency: currentCurrencySymbol,
                            pendingAmount: newPendingValue // Update pending amount in DB
                        }
                    };

                    transaction.update(userDocRef, {
                        balances: updatedBalances
                    });
                });

                // Transaction successful - Now record the transaction in the 'transactions' subcollection
                try {
                    let currencySymbol = '';
                    switch (activeCurrency) {
                        case 'GBP':
                            currencySymbol = '£';
                            break;
                        case 'EUR':
                            currencySymbol = '€';
                            break;
                        case 'USD':
                            currencySymbol = '$';
                            break;
                        default:
                            currencySymbol = activeCurrency; // Fallback to currency code if no symbol
                    }

                    // Format the numeric part with commas and two decimal places
                    const formattedNumericAmount = enteredAmount.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });

                    // Combine symbol, space, and formatted amount
                    const formattedAmountWithSymbolAndSpace = `${currencySymbol} ${formattedNumericAmount}`;

                    await db.collection('users').doc(currentUserId).collection('transactions').add({
                        DATE: firebase.firestore.FieldValue.serverTimestamp(),
                        AMOUNT: formattedAmountWithSymbolAndSpace,
                        TYPE: 'Withdrawal', // Changed to Withdrawal for clarity
                        DESCRIPTION: 'Pending Withdrawal', // Generic description for pending
                        STATUS: 'pending' 
                    });
                    console.log("Transaction record added successfully under user's subcollection with server timestamp and PENDING status!");

                    showToast("Withdrawal request submitted. Status: Pending.", 'info'); // Show pending toast
                    witAmountInput.value = ''; // Clear input
                    amountInput2.value = ''; // Clear AmountInput2 after successful withdrawal
                    currentWitAmountRawValue = ''; // Clear raw value
                    await fetchAndDisplayBalances(currentUserId); // Reload and display updated balances

                    // Navigate after a short delay to allow toast to be seen
                    setTimeout(() => {
                        window.location.href = './../dashboard/accounts.html'; // Navigate to accounts page
                    }, 1500); // 1.5 seconds delay

                } catch (transactionError) {
                    console.error("Error adding transaction record to subcollection:", transactionError);
                    showToast("Withdrawal successful, but failed to record transaction. Please contact support.", 'error');
                }

            } catch (error) {
                console.error("Withdrawal Failed:", error);
                let errorMessage = "Withdrawal failed. Please try again.";
                if (error.message.includes("Insufficient funds")) {
                    errorMessage = error.message; // Use specific error from transaction
                } else if (error.message.includes("Pending amount found")) { // Catch our custom error
                    errorMessage = "A pending withdrawal exists. Please clear it first.";
                } else if (error.code === 'permission-denied') {
                    // Provide a helpful message for permission issues
                    errorMessage = "KINDLY CHECK YOUR INTERNET CONNECTION AND ENSURE YOU ARE CONNECTED TO THE INTERNET.";
                }
                showToast(errorMessage, 'error');

            } finally {
                proceedButton.disabled = false; // Re-enable button
            }
        }
    });

    // Initial setup: ensure the correct currency display is visible on load.
    // This calls updateUIForSelectedCurrency which also updates AmountInput2.
    // It's called here to correctly set initial state before auth finishes.
    updateUIForSelectedCurrency(activeCurrency);

    // Initialize withdrawal amount inputs to be empty on page load
    witAmountInput.value = '';
    amountInput2.value = ''; // Ensure AmountInput2 is also empty on load to reflect witAmountInput
});

// The submitAmount_Input function from your HTML remains separate and
// handles form submission validation. If you want it to trigger the Firebase logic,
// you'd call proceedButton.click() from within it after its own checks.
// For now, the PROCEED button's direct click listener handles the Firebase interaction.
