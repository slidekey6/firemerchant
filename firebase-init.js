<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyDH0XsBZ4G-gC6Jou_0VNp6GmgqVOnGsjQ",
    authDomain: "merchant-23d56.firebaseapp.com",
    projectId: "merchant-23d56",
    storageBucket: "merchant-23d56.firebasestorage.app",
    messagingSenderId: "850984297830",
    appId: "1:850984297830:web:ecc1f2f333eee3741814a7",
    measurementId: "G-EGFBQTLR3K"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>