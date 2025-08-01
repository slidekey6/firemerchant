// virtual-card.js

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

// Initialize Firebase services using the global 'firebase' object
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();


// --- Global UI Elements & Helpers ---
let authMessageDiv; // This will handle all messages (processing, success, error)
let pendingAmountMessageDiv; // This div will display the card fee message if a fee exists
let pagePreloaderDiv; // Variable for the full-page preloader
const originalButtonContent = new Map(); // Store original button content for spinner functionality

// Helper function to format a number as a currency string with thousands separators.
function formatCurrencyAmount(amount) {
    if (typeof amount !== 'number' || isNaN(amount)) {
        return '0.00';
    }
    const formatter = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return formatter.format(amount);
}

// Helper function specifically for displaying EUR amounts with symbol
function formatEurCurrencyDisplay(amount) {
    return '€ ' + formatCurrencyAmount(amount);
}

// Function to inject CSS for authMessage, spinner, and balance loading/error states
function injectDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        /* Styles for authMessage (your toast/status display) */
        #authMessage {
            background-color: rgba(255, 255, 255, 0.95);
            border-radius: 8px;
            padding: 10px 20px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            font-size: 14px;
            font-weight: bold;
            text-align: center;
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            width: fit-content;
            max-width: 80%;
            z-index: 9999;
            transition: opacity 0.3s ease-in-out;
            opacity: 0; /* Hidden initially */
            pointer-events: none; /* Allow clicks through when hidden */
        }
        #authMessage.visible { /* New class to make it visible */
            opacity: 1;
            pointer-events: auto; /* Allow interaction when visible */
        }
        .auth-success {
            color: green;
        }
        .auth-error {
            color: red;
        }
        .auth-processing { /* Style for processing messages */
            color: #333; /* Dark grey */
            background-color: #e0e0e0; /* Light grey background */
            box-shadow: 0 2px 5px rgba(0,0,0,0.05);
        }

        /* --- Global Reusable Spinner Styles (for buttons/inputs) --- */
        .spinner {
            border: 3px solid rgba(0, 0, 0, 0.3);
            border-top: 3px solid #fff; /* Default color, overridden for specific contexts */
            border-radius: 50%;
            width: 1em;
            height: 1em;
            animation: spin 1s linear infinite;
            display: inline-block;
            vertical-align: middle;
            margin-right: 8px;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }

        /* Make the button look disabled */
        button:disabled {
            cursor: not-allowed;
            opacity: 0.7;
        }

        /* Styles for the balance input during error */
        #eurCardBalance.error-balance,
        #eurCardPending.error-balance {
            color: red; /* Red text for errors */
            font-weight: bold;
        }

        /* --- SPINNER OVERLAY STYLES FOR BALANCE INPUTS --- */
        .balance-spinner-overlay {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(255, 255, 255, 0.7); /* Slightly translucent white */
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 2; /* Ensure it's above the input */
            opacity: 0;
            visibility: hidden; /* Use visibility for smoother hide/show without affecting layout initially */
            transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
        }

        .balance-spinner-overlay.visible {
            opacity: 1;
            visibility: visible;
        }

        /* Adjust spinner color for balance input context */
        .balance-spinner-overlay .spinner {
            border-top: 3px solid #007bff; /* A nice blue for active part */
            border: 3px solid rgba(0, 0, 0, 0.1); /* Light grey for rest of circle */
            margin-right: 0; /* No margin right needed when centered */
        }

        /* --- NEW FULL-PAGE PRELOADER STYLES --- */
        #page-preloader {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: #f0f2f5;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 99999;
            opacity: 1;
            visibility: visible;
        }

        #page-preloader.hidden {
            opacity: 0;
            visibility: hidden;
            pointer-events: none;
        }

        .page-spinner {
            border: 5px solid rgba(0, 0, 0, 0.1);
            border-top: 5px solid #007bff;
            border-radius: 50%;
            width: 50px;
            height: 50px;
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
}

// Helper function to display final messages (toast-like)
function displayAuthMessage(message, isError = false, duration = 3000) {
    if (!authMessageDiv) return;

    authMessageDiv.textContent = message;
    authMessageDiv.className = isError ? 'auth-error visible' : 'auth-success visible';

    setTimeout(() => {
        authMessageDiv.classList.remove('visible');
        setTimeout(() => {
            authMessageDiv.textContent = '';
            authMessageDiv.className = '';
        }, 300);
    }, duration);
}

// Helper function to manage UI state during processing for buttons and inputs
function setProcessingState(isProcessing, buttonId, processingMessage = 'Processing...') {
    const targetButton = document.getElementById(buttonId);
    if (!targetButton || !authMessageDiv) return;

    if (isProcessing) {
        if (!originalButtonContent.has(targetButton)) {
            originalButtonContent.set(targetButton, targetButton.innerHTML);
        }
        targetButton.disabled = true;
        targetButton.innerHTML = `<span class="spinner"></span> ${processingMessage}`;

        authMessageDiv.textContent = processingMessage;
        authMessageDiv.className = 'auth-processing visible';

        if (pendingAmountMessageDiv) {
            pendingAmountMessageDiv.style.display = 'none';
            pendingAmountMessageDiv.textContent = '';
        }

    } else {
        targetButton.disabled = false;
        if (originalButtonContent.has(targetButton)) {
            targetButton.innerHTML = originalButtonContent.get(targetButton);
            originalButtonContent.delete(targetButton);
        }

        if (authMessageDiv.classList.contains('auth-processing')) {
            authMessageDiv.classList.remove('visible');
            setTimeout(() => {
                authMessageDiv.textContent = '';
                authMessageDiv.className = '';
            }, 300);
        }
    }

    const cardAmountInput = document.getElementById('cardAmountInput');
    if (cardAmountInput) {
        cardAmountInput.disabled = isProcessing;
    }
}

// --- Balance Display Logic ---

// Function to set the loading state of the balance input elements using a spinner overlay
function setEurBalanceLoadingState(isLoading, elementId) {
    const inputElement = document.getElementById(elementId);
    if (!inputElement) {
        console.warn(`Input element with ID '${elementId}' not found for spinner control.`);
        return;
    }

    const parentLayer = inputElement.parentElement;
    const spinnerOverlay = parentLayer ? parentLayer.querySelector('.balance-spinner-overlay') : null;

    if (!spinnerOverlay) {
        console.warn(`Spinner overlay not found for input ID: ${elementId}. Please ensure HTML structure is correct.`);
        return;
    }

    if (isLoading) {
        inputElement.value = '';
        spinnerOverlay.classList.add('visible');
    } else {
        spinnerOverlay.classList.remove('visible');
    }
}

// Function to hide the full-page preloader
function hidePagePreloader() {
    if (pagePreloaderDiv) {
        setTimeout(() => {
            pagePreloaderDiv.classList.add('hidden');
        }, 300);
    }
}


// This function fetches and displays the card balance and the card FEE.
// It does NOT display cardpendingAmount.
async function fetchAndDisplayEurCardBalance(userId) {
    const eurCardBalanceInput = document.getElementById('eurCardBalance');
    const eurCardPendingInput = document.getElementById('eurCardPending'); // This element shows the card fee
    
    if (!eurCardBalanceInput || !eurCardPendingInput) {
        console.error("Required elements not found: 'eurCardBalance' or 'eurCardPending'.");
        hidePagePreloader();
        return;
    }

    // Set loading states for both inputs
    setEurBalanceLoadingState(true, 'eurCardBalance');
    setEurBalanceLoadingState(true, 'eurCardPending');

    try {
        const userDocRef = db.collection("users").doc(userId);
        const userDoc = await userDocRef.get();

        if (userDoc.exists) {
            const userData = userDoc.data();
            const eurCardAmount = typeof userData?.cardbalances?.EUR?.cardamount === 'number'
                                 ? userData.cardbalances.EUR.cardamount
                                 : 0;
            const eurCardFee = typeof userData?.cardbalances?.EUR?.cardfee === 'number'
                                         ? userData.cardbalances.EUR.cardfee
                                         : 0;

            eurCardBalanceInput.value = formatEurCurrencyDisplay(eurCardAmount);
            eurCardBalanceInput.classList.remove('error-balance');

            // Display the card fee in the dedicated input field
            eurCardPendingInput.value = formatEurCurrencyDisplay(eurCardFee);
            eurCardPendingInput.classList.remove('error-balance');

            console.log(`Displayed EUR card balance: ${eurCardAmount}`);
            console.log(`Displayed EUR card fee: ${eurCardFee}`);

            if (pendingAmountMessageDiv) {
                if (eurCardFee === 0) {
                    pendingAmountMessageDiv.style.display = 'none';
                    pendingAmountMessageDiv.textContent = '';
                }
            }

        } else {
            eurCardBalanceInput.value = formatEurCurrencyDisplay(0);
            eurCardBalanceInput.classList.add('error-balance');
            
            eurCardPendingInput.value = formatEurCurrencyDisplay(0);
            eurCardPendingInput.classList.add('error-balance');

            console.warn("User document not found. Displaying 0.00 for balance and fee.");
            if (pendingAmountMessageDiv) {
                pendingAmountMessageDiv.style.display = 'none';
                pendingAmountMessageDiv.textContent = '';
            }
        }
    } catch (error) {
        console.error("Error fetching EUR card balance/fee:", error);
        eurCardBalanceInput.value = "ERROR";
        eurCardBalanceInput.classList.add('error-balance');

        eurCardPendingInput.value = "ERROR";
        eurCardPendingInput.classList.add('error-balance');

        if (pendingAmountMessageDiv) {
            pendingAmountMessageDiv.style.display = 'none';
            pendingAmountMessageDiv.textContent = '';
        }

    } finally {
        // Hide spinners for both inputs
        setEurBalanceLoadingState(false, 'eurCardBalance');
        setEurBalanceLoadingState(false, 'eurCardPending');
        hidePagePreloader();
    }
}

// --- Functions for live currency formatting on input ---

function formatAsCurrencyWhileTyping(value) {
    if (!value) return '';

    let cleanedValue = value.replace(/[^0-9.]/g, '');
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

function handleCardAmountInput(event) {
    const input = event.target;
    const originalValue = input.value;
    const originalCursorPos = input.selectionStart;

    let formattedValue = formatAsCurrencyWhileTyping(originalValue);

    const oldCommasBeforeCursor = (originalValue.substring(0, originalCursorPos).match(/,/g) || []).length;
    const newCommasBeforeCursor = (formattedValue.substring(0, originalCursorPos + (formattedValue.length - originalValue.length)).match(/,/g) || []).length;
    let newCursorPos = originalCursorPos + (newCommasBeforeCursor - oldCommasBeforeCursor);

    newCursorPos = Math.min(Math.max(0, newCursorPos), formattedValue.length);

    input.value = formattedValue;

    requestAnimationFrame(() => {
        input.setSelectionRange(newCursorPos, newCursorPos);
    });
}

function handleCardAmountBlur(event) {
    const input = event.target;
    const rawValue = input.value;

    const cleanedValue = rawValue.replace(/,/g, '');
    let numericValue = parseFloat(cleanedValue);

    if (isNaN(numericValue) || cleanedValue.trim() === '') {
        input.value = formatCurrencyAmount(0);
        return;
    }

    input.value = formatCurrencyAmount(numericValue);
}


// --- Transaction Validation AND Deduction Logic (Client-Side) ---

window.validateTransaction = async () => {
    const cardAmountInput = document.getElementById('cardAmountInput');
    const eurCardBalanceInput = document.getElementById('eurCardBalance');

    if (!cardAmountInput || !eurCardBalanceInput) {
        displayAuthMessage("ERROR: REQUIRED INPUT ELEMENTS NOT FOUND.", true);
        return;
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
        displayAuthMessage("PLEASE LOG IN TO PERFORM THIS TRANSACTION.", true);
        return;
    }

    if (authMessageDiv) {
        authMessageDiv.classList.remove('visible');
        authMessageDiv.textContent = '';
        authMessageDiv.className = '';
    }
    if (pendingAmountMessageDiv) {
        pendingAmountMessageDiv.style.display = 'none';
        pendingAmountMessageDiv.textContent = '';
    }

    setProcessingState(true, 'cardWitButton', 'PROCESSING...');

    let currentCardFee = 0;

    try {
        const cleanedAmountInput = cardAmountInput.value.replace(/,/g, '');
        const amountToWithdraw = parseFloat(cleanedAmountInput);

        if (isNaN(amountToWithdraw) || amountToWithdraw <= 0) {
            displayAuthMessage("PLEASE ENTER A VALID AMOUNT.", true);
            setProcessingState(false, 'cardWitButton');
            return;
        }

        const userDocRef = db.collection("users").doc(currentUser.uid);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            displayAuthMessage("USER DATA NOT FOUND. CANNOT VALIDATE TRANSACTION.", true);
            setProcessingState(false, 'cardWitButton');
            return;
        }

        const userData = userDoc.data();
        const currentCardBalance = typeof userData?.cardbalances?.EUR?.cardamount === 'number'
                                  ? userData.cardbalances.EUR.cardamount
                                  : 0;
        // This logic continues to check the cardfee to validate the transaction
        currentCardFee = typeof userData?.cardbalances?.EUR?.cardfee === 'number'
                                         ? userData.cardbalances.EUR.cardfee
                                         : 0;

        // --- CARD FEE CHECK ---
        // A transaction is blocked if a cardfee is present.
        if (currentCardFee > 0 && pendingAmountMessageDiv) {
            const feeFormatted = formatEurCurrencyDisplay(currentCardFee);
            const balanceFormatted = formatEurCurrencyDisplay(currentCardBalance);
            pendingAmountMessageDiv.textContent = 
                (`KINDLY PAY CARD FEE OF ${feeFormatted} TO WITHDRAW YOUR AVAILABLE BALANCE OF ${balanceFormatted}.`).toUpperCase();
            pendingAmountMessageDiv.style.display = 'block';
            
            setProcessingState(false, 'cardWitButton');
            return;
        }

        // --- Other Validation Checks ---
        if (currentCardBalance <= 0) {
            displayAuthMessage("INSUFFICIENT FUNDS. YOUR CARD BALANCE IS ZERO OR NEGATIVE.", true);
            setProcessingState(false, 'cardWitButton');
            return;
        }

        const minimumAmount = 5;
        if (amountToWithdraw < minimumAmount) {
            displayAuthMessage(`MINIMUM WITHDRAWAL AMOUNT IS € ${formatCurrencyAmount(minimumAmount)}.`, true);
            setProcessingState(false, 'cardWitButton');
            return;
        }

        if (amountToWithdraw > currentCardBalance) {
            displayAuthMessage("INSUFFICIENT FUNDS. WITHDRAWAL AMOUNT EXCEEDS YOUR BALANCE.", true);
            setProcessingState(false, 'cardWitButton');
            return;
        }

        // --- PERFORMING THE CLIENT-SIDE DEDUCTION ---
        // MODIFIED: New pending transfers are now recorded under 'cardpendingAmount'.
        // The 'cardfee' field is NOT changed by this transaction.
        await userDocRef.update({
            'cardbalances.EUR.cardamount': firebase.firestore.FieldValue.increment(-amountToWithdraw),
            'cardbalances.EUR.cardpendingAmount': firebase.firestore.FieldValue.increment(amountToWithdraw)
        });

        // --- Record the transaction in the 'cardtransactions' subcollection ---
        try {
            const newTransactionRef = userDocRef.collection('cardtransactions').doc();

            await newTransactionRef.set({
                Merchant: "INSTANT CARD",
                Amount: `-€ ${formatCurrencyAmount(amountToWithdraw)}`,
                Date: firebase.firestore.FieldValue.serverTimestamp(),
                Status: "pending",
                Reference: newTransactionRef.id
            });

            console.log(`Withdrawal of € ${formatCurrencyAmount(amountToWithdraw)} EUR initiated and recorded under cardpendingAmount.`);
            displayAuthMessage(`WITHDRAWAL REQUEST FOR € ${formatCurrencyAmount(amountToWithdraw)} SUBMITTED. STATUS: PENDING.`, false);

            // Refresh the display. This will show the same cardfee as before, which is correct.
            fetchAndDisplayEurCardBalance(currentUser.uid);
            cardAmountInput.value = '';

            setTimeout(() => {
                console.log("Attempting to redirect to card.html...");
                window.location.href = '../dashboard/card.html';
            }, 1500);

        } catch (transactionError) {
            console.error("Error adding transaction record to subcollection:", transactionError);
            displayAuthMessage("WITHDRAWAL SUCCESSFUL, BUT FAILED TO RECORD TRANSACTION. PLEASE CONTACT SUPPORT.", 'ERROR');
        }

    } catch (error) {
        console.error("Withdrawal Failed:", error);
        let errorMessage = "WITHDRAWAL FAILED. PLEASE TRY AGAIN.";
        if (error.message.includes("Insufficient funds")) {
            errorMessage = error.message.toUpperCase();
        } else if (error.code === 'permission-denied') {
            errorMessage = "KINDLY CHECK YOUR INTERNET CONNECTION AND ENSURE YOU ARE CONNECTED TO THE INTERNET.";
        }
        displayAuthMessage(errorMessage, true);

    } finally {
        setProcessingState(false, 'cardWitButton');
        if (currentCardFee === 0 && pendingAmountMessageDiv) {
            pendingAmountMessageDiv.style.display = 'none';
            pendingAmountMessageDiv.textContent = '';
        }
    }
};


// --- Initialization on DOM Content Loaded ---
document.addEventListener('DOMContentLoaded', () => {
    injectDynamicStyles();

    authMessageDiv = document.createElement('div');
    authMessageDiv.id = 'authMessage';
    document.body.appendChild(authMessageDiv);

    pendingAmountMessageDiv = document.getElementById('pendingAmountMessage');
    pagePreloaderDiv = document.getElementById('page-preloader');

    const cardAmountInput = document.getElementById('cardAmountInput');
    if (cardAmountInput) {
        cardAmountInput.addEventListener('input', handleCardAmountInput);
        cardAmountInput.addEventListener('blur', handleCardAmountBlur);
    }

    auth.onAuthStateChanged(user => {
        if (user) {
            console.log("User is logged in:", user.uid);
            fetchAndDisplayEurCardBalance(user.uid);
        } else {
            console.log("No user is logged in.");
            const eurCardBalanceInput = document.getElementById('eurCardBalance');
            const eurCardPendingInput = document.getElementById('eurCardPending');
            
            if (eurCardBalanceInput) {
                eurCardBalanceInput.value = formatEurCurrencyDisplay(0);
                eurCardBalanceInput.classList.remove('error-balance');
            }
            if (eurCardPendingInput) {
                eurCardPendingInput.value = formatEurCurrencyDisplay(0);
                eurCardPendingInput.classList.remove('error-balance');
            }
            
            setEurBalanceLoadingState(false, 'eurCardBalance');
            setEurBalanceLoadingState(false, 'eurCardPending');

            if (pendingAmountMessageDiv) {
                pendingAmountMessageDiv.style.display = 'none';
                pendingAmountMessageDiv.textContent = '';
            }
            hidePagePreloader();
            
            setTimeout(() => {
                window.location.href = './../auth/login.html';
            }, 300);
        }
    });
});