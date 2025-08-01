// firebase-auth-component.js
(function() {
  // --- Create and append the CSS styles ---
  const style = document.createElement('style');
  style.textContent = `
    /* Consolidated Firebase-related CSS styles (now responsive) */
    /* Removed #auth-status specific styles */
    #message {
        position: fixed;
        top: 70px; /* Adjusted slightly as #auth-status is removed */
        left: 50%;
        transform: translateX(-50%);
        width: 90%;
        max-width: 500px;
        text-align: center;
        padding: 10px;
        border-radius: 8px;
        z-index: 10;
        font-family: Arial;
        font-size: 14px;
        box-sizing: border-box;
        background-color: #fff;
        border: 1px solid #eee;
        color: #333;
        display: none; /* Hidden by default */
    }
    
    /* NEW: CSS for fading messages */
    #message.fade-out {
      animation: fade-out 0.5s forwards;
      animation-delay: 2.5s;
    }
    
    @keyframes fade-out {
      from { opacity: 1; }
      to { opacity: 0; display: none; }
    }

    /* Spinner CSS for login button */
    .button-spinner {
      display: inline-block;
      width: 1.2rem;
      height: 1.2rem;
      vertical-align: middle;
      border: 0.15em solid currentColor;
      border-right-color: transparent;
      border-radius: 50%;
      animation: spinner-grow 0.75s linear infinite;
      margin-right: 8px;
    }

    @keyframes spinner-grow {
      to {
        transform: rotate(360deg);
      }
    }
    
    /* Style for the button when loading */
    .login-btn-loading {
        background-color: #6c757d !important;
        cursor: not-allowed;
    }
    
    /* Style for a disabled login button due to a toast */
    .login-btn-disabled-toast {
        cursor: not-allowed;
    }

    /* Toast Notification CSS */
    .toast-container {
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 1000;
    }

    .toast {
        min-width: 250px;
        max-width: 400px;
        background-color: #333;
        color: white;
        text-align: center;
        border-radius: 5px;
        padding: 16px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        animation: fadein 0.5s, fadeout 0.5s 2.5s;
    }

    .toast.toast-error {
        background-color: #dc3545;
    }

    @keyframes fadein {
        from {top: 0; opacity: 0;}
        to {top: 20px; opacity: 1;}
    }

    @keyframes fadeout {
        from {top: 20px; opacity: 1;}
        to {top: 0; opacity: 0;}
    }
  `;
  document.head.appendChild(style);

  // --- Create the HTML elements dynamically ---
  const messageDiv = document.createElement('p');
  messageDiv.id = 'message';

  // --- Append the created elements to the document body ---
  document.body.appendChild(messageDiv);

  // NEW: Variable for the full-page preloader
  let pagePreloaderDiv; 

  // --- Firebase SDKs and custom logic ---
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

  // --- SAFE Firebase Initialization ---
  // Ensure Firebase is initialized only once across all scripts on a page.
  let app;
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
    console.log("Firebase: firebase-auth-component.js initialized the Firebase app.");
  } else {
    app = firebase.app(); // Get the already initialized default app
    console.log("Firebase: firebase-auth-component.js is using an already initialized Firebase app.");
  }
  // --- END SAFE Firebase Initialization ---


  const auth = firebase.auth();
  const loginButton = document.getElementById('loginBut');
  const loginForm = document.getElementById('indexLayer1');

  // Get the page preloader div as soon as the script runs
  pagePreloaderDiv = document.getElementById('page-preloader'); 

  // NEW: Function to hide the full-page preloader
  function hidePagePreloader() {
      if (pagePreloaderDiv) {
          // Add a small delay for a smoother transition
          setTimeout(() => {
              pagePreloaderDiv.classList.add('hidden');
          }, 300); // Wait 300ms after data is ready before hiding
      }
  }

  // --- Helper functions for loading spinner ---
  function showLoadingSpinner(button) {
    if (button) {
      button.disabled = true;
      button.classList.add('login-btn-loading');
      button.innerHTML = '<span class="button-spinner"></span>Logging in...';
    }
  }

  function hideLoadingSpinner(button) {
    if (button) {
      button.disabled = false;
      button.classList.remove('login-btn-loading');
      button.innerHTML = 'Login';
    }
  }
  
  // --- Helper function to show and fade messages ---
  function showTemporaryMessage(message, isError = false) {
    messageDiv.classList.remove('fade-out');
    messageDiv.style.opacity = '1';
    
    messageDiv.textContent = message;
    messageDiv.style.color = isError ? "#dc2626" : "#333";
    messageDiv.style.display = 'block';

    setTimeout(() => {
        messageDiv.classList.add('fade-out');
    }, 100);
  }

  // --- Helper function for toast notifications ---
  function showToast(message, type = 'default') {
    // Disable the login button to prevent multiple clicks during toast display
    if (loginButton) {
        loginButton.disabled = true;
        loginButton.classList.add('login-btn-disabled-toast');
    }

    const toastContainer = document.querySelector('.toast-container') || document.createElement('div');
    toastContainer.className = 'toast-container';
    
    const toast = document.createElement('div');
    toast.className = `toast ${type === 'error' ? 'toast-error' : ''}`;
    toast.textContent = message;

    toastContainer.appendChild(toast);
    document.body.appendChild(toastContainer);

    // Remove the toast after a delay
    setTimeout(() => {
        toast.remove();
        if (!toastContainer.hasChildNodes()) {
          toastContainer.remove();
        }
        // Re-enable the login button
        if (loginButton) {
            loginButton.disabled = false;
            loginButton.classList.remove('login-btn-disabled-toast');
        }
    }, 3000); // 3 seconds
  }

  // --- Listen for authentication state changes (on the login page) ---
  auth.onAuthStateChanged((user) => {
    if (user) {
      console.log('User logged in (firebase-auth-component):', user.email);
      // If user is logged in, hide login form and redirect to dashboard
      if (loginForm) loginForm.style.display = 'none'; // Hide the login form
      messageDiv.textContent = ''; // Clear temporary messages
      messageDiv.style.display = 'none';

      // Hide the preloader as soon as the user state is determined and before redirection
      hidePagePreloader(); 
      // Automatically redirect if user is already logged in and on the login page
      if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
          window.location.href = './home.html'; // Redirect to home.html
      }
    } else {
      console.log('No user logged in (firebase-auth-component).');
      // If no user is logged in, ensure login form is visible
      if (loginForm) loginForm.style.display = 'block';
      messageDiv.textContent = ''; // Clear temporary messages
      messageDiv.style.display = 'none';
      
      // Hide the preloader once the login form is visible and ready for interaction
      hidePagePreloader(); 
    }
  });

  // --- Login Function (global for index.html) ---
  window.loginUser = function() {
    const emailInput = document.getElementById('loginEmail')?.value;
    const passwordInput = document.getElementById('loginPassword')?.value.trim();

    messageDiv.style.display = 'none';

    if (!emailInput || !passwordInput) {
      showTemporaryMessage("Please enter both email and password.", true);
      return;
    }

    showLoadingSpinner(loginButton);

    auth.signInWithEmailAndPassword(emailInput, passwordInput)
      .then((userCredential) => {
        hideLoadingSpinner(loginButton);
        // Successful login, onAuthStateChanged will handle redirection
      })
      .catch((error) => {
        hideLoadingSpinner(loginButton);
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            showToast('Invalid login credentials. Please check your email and password.', 'error');
            break;
          default:
            showToast(`Login Error: ${error.message}`, 'error');
            console.error("Login error:", error.code, error.message);
        }
      });
  };

})();
