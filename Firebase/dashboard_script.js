// dashboard_script.js

// -----------------------------------------------------------------------------
// THIS IS CRUCIAL: The entire script is wrapped in an IIFE.
// This creates a private scope, preventing variable name collisions
// like 'firebaseConfig has already been declared'.
// -----------------------------------------------------------------------------
(function() { // <--- START OF IIFE WRAPPER

    // Your Firebase project configuration
    // This 'const' declaration is now safely contained within this function's scope.
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

    // --- Firebase Initialization: The Single Source of Truth ---
    // This is the CRITICAL part for multi-script environments.
    // It ensures Firebase is initialized ONLY ONCE per page load.
    // If another script (like firebase-auth-component.js on index.html, or home-script.js)
    // has already initialized it, this script will simply get a reference to that existing app.
    let app;
    if (!firebase.apps.length) {
        app = firebase.initializeApp(firebaseConfig);
        console.log("Firebase (dashboard_script): Initializing Firebase App.");
    } else {
        app = firebase.app(); // Get the already initialized default app
        console.log("Firebase (dashboard_script): Using already initialized Firebase App.");
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    // NEW: Variable for the full-page preloader
    let pagePreloaderDiv; 

    // NEW: Function to hide the full-page preloader
    const hidePagePreloader = () => {
        if (pagePreloaderDiv) {
            // Add a small delay for a smoother transition
            setTimeout(() => {
                pagePreloaderDiv.classList.add('hidden');
            }, 300); // Wait 300ms after data is ready before hiding
        }
    };

    // --- Function to handle User Display and Authentication State ---
    const handleAuthAndUserData = () => {
        // This listener fires whenever the user's sign-in state changes (login, logout, refresh)
        auth.onAuthStateChanged(async (user) => {
            const displayNameElement = document.getElementById('displayName');
            const fullNameElement = document.getElementById('fullName');

            // Check if the display elements exist on the page
            if (!displayNameElement) {
                console.warn('Dashboard Script: "displayName" input element not found in HTML. Name will not be displayed in that spot.');
            }
            if (!fullNameElement) {
                console.warn('Dashboard Script: "fullName" input element not found in HTML. Full name will not be displayed in that spot.');
            }

            if (user) {
                // --- User is Signed In ---
                console.log('Dashboard Script: User is signed in. UID:', user.uid);

                try {
                    // Fetch user data from Firestore using their UID
                    const userDocRef = db.collection('users').doc(user.uid);
                    console.log('Dashboard Script: Attempting to fetch user document from Firestore:', userDocRef.path);

                    const userDoc = await userDocRef.get();

                    if (userDoc.exists) {
                        const userData = userDoc.data();
                        console.log('Dashboard Script: User data retrieved from Firestore:', userData);

                        // Update the "displayName" input field (typically just first name)
                        if (displayNameElement) {
                            if (userData.firstName) {
                                // MODIFIED: Add "Hello, " and convert firstName to uppercase
                                displayNameElement.value = "Hello, " + userData.firstName.toUpperCase();
                                console.log('Dashboard Script: Display Name set to:', displayNameElement.value);
                            } else {
                                displayNameElement.value = "Hello, " + user.email; // Fallback
                                console.warn('Dashboard Script: No "firstName" found in user data. Display Name defaulted to email.');
                            }
                        }

                        // Update the "fullName" input field (first + middle + last name)
                        if (fullNameElement) {
                            let fullUserName = user.email; // Default fallback

                            // Construct full name if parts are available
                            let nameParts = [];
                            if (userData.firstName) nameParts.push(userData.firstName);
                            if (userData.middleName) nameParts.push(userData.middleName);
                            if (userData.lastName) nameParts.push(userData.lastName);

                            if (nameParts.length > 0) {
                                fullUserName = nameParts.join(' ');
                            }

                            fullNameElement.value = fullUserName;
                            console.log('Dashboard Script: Full Name set to:', fullUserName);
                        }

                    } else {
                        // User document not found in Firestore
                        console.warn('Dashboard Script: User document NOT found in Firestore for UID:', user.uid);
                        if (displayNameElement) displayNameElement.value = user.email; // Fallback
                        if (fullNameElement) fullNameElement.value = user.email; // Fallback
                    }
                } catch (error) {
                    // Error fetching user data
                    console.error('Dashboard Script: Error fetching user data from Firestore:', error);
                    if (displayNameElement) displayNameElement.value = user.email; // Fallback on error
                    if (fullNameElement) fullNameElement.value = user.email; // Fallback on error
                } finally {
                    // Always hide the preloader once user data fetching (success or error) is complete
                    hidePagePreloader();
                }
            } else {
                // --- User is Signed Out ---
                console.log('Dashboard Script: No user signed in. Redirecting to login page.');
                // Hide preloader if user is not logged in and we're redirecting
                hidePagePreloader(); 
                // Redirect to your login page (index.html)
                // Add a small delay for UX consistency
                setTimeout(() => {
                    window.location.href = '../index.html'; // Adjust this path if needed
                }, 300);
            }
        });
    };

    // --- Logout Function ---
    const handleLogout = async () => {
        try {
            await auth.signOut();
            console.log('Dashboard Script: User signed out successfully.');
            // The `onAuthStateChanged` listener above will automatically handle the redirection
            // to `../index.html` after successful sign out, and also hide the preloader.
        } catch (error) {
            console.error('Dashboard Script: Error during logout:', error);
            alert('Logout failed. Please try again.'); // User-friendly alert
        }
    };

    // --- DOM Content Loaded Event Listener ---
    // Ensures all HTML elements are available before script tries to access them.
    document.addEventListener('DOMContentLoaded', () => {
        console.log("Dashboard Script: DOM fully loaded. Setting up authentication listener and logout button.");

        // Get the page preloader div (it's already in the HTML and visible by default)
        pagePreloaderDiv = document.getElementById('page-preloader'); 

        // Start listening for user authentication state changes
        handleAuthAndUserData();

        // Attach the logout function to the logout button
        const logoutButton = document.getElementById('logoutLayer');
        if (logoutButton) {
            logoutButton.addEventListener('click', handleLogout);
            console.log('Dashboard Script: Logout button listener attached to #logoutLayer.');
        } else {
            console.error('Dashboard Script: Logout button with ID "logoutLayer" not found in HTML. Logout functionality will not work.');
        }
    });

})(/* This is where the function is immediately invoked */); // <--- END OF IIFE WRAPPER
