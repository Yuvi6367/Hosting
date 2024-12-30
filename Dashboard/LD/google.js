
// File: Script.js
import { auth, provider, signInWithPopup, } from "./firebase.js";
document.addEventListener("DOMContentLoaded", () => {
  const googleLoginButton = document.getElementById("google-login");

  if (!googleLoginButton) {
    console.info("Google login button not found.");
    return;
  }

  googleLoginButton.addEventListener("click", async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      console.log(`Logged in as: ${user.displayName}`);
      alert(`Welcome, ${user.displayName}!`);

      // Redirect to dashboard.html after successful login
      window.location.href = "Dashboard/dashboard.html";
    } catch (error) {
      console.error("Login failed:", error.message);
      alert("Login failed. Please try again.");
    }
  });
});
// File: script.js
function checkAuth() {
  auth.onAuthStateChanged((user) => {
    if (!user) {
      console.warn("User not logged in. Redirecting to login...");
      window.location.href = "/LoginInterface/index.html";
    } else {
      console.log("User is logged in:", user.uid);
    }
    auth.onAuthStateChanged((user) => {
      console.log(user ? `Logged in as ${user.displayName}` : "No user logged in");
    });
  });
}

export default checkAuth;