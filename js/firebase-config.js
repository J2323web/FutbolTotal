// Configuración de Firebase (versión compat)
const firebaseConfig = {
  apiKey: "AIzaSyCZoQQEKAxVpVGdWAmRSBSvaC1OjlP3HYg",
  authDomain: "jj23-b3f13.firebaseapp.com",
  projectId: "jj23-b3f13",
  storageBucket: "jj23-b3f13.firebasestorage.app",
  messagingSenderId: "573183759612",
  appId: "1:573183759612:web:cb82891cdd93dc6b13f379",
  measurementId: "G-3E1EGHEHN9"
};

// Inicializar Firebase (versión compat)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();