// Authentication Functions for Shireen Bakers

// Diagnostic log
console.log("Auth script loaded. Waiting for Firebase initialization...");

// Update UI when user is logged in
function updateUIForLoggedInUser(user) {
    const loginBtn = document.querySelector('.header-right .icon-btn:first-child');
    if (loginBtn) {
        const name = user.displayName || user.email.split('@')[0];
        // Using a white SVG icon instead of the emoji
        const userIcon = `<svg class="user-icon-svg" width="20" height="20" viewBox="0 0 24 24" fill="white" style="vertical-align: middle; margin-left: 5px;">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
        </svg>`;
        loginBtn.innerHTML = `<span>${name}</span> ${userIcon}`;
        loginBtn.title = "View Profile";
        loginBtn.onclick = () => showUserProfile();
    }
}

// Update UI when user is logged out
function updateUIForLoggedOutUser() {
    const loginBtn = document.querySelector('.header-right .icon-btn:first-child');
    if (loginBtn) {
        // Only reset if it's currently showing a user profile (check for SVG class)
        if (loginBtn.innerHTML.includes('user-icon-svg') || loginBtn.innerHTML.includes('👤') || loginBtn.textContent.trim() !== 'Login') {
            loginBtn.innerHTML = '<span>Login</span>';
            loginBtn.title = "Login / Sign Up";
            loginBtn.onclick = () => window.location.href = 'login.html';
        }
    }
}

/**
 * USER PROFILE MODAL SYSTEM
 */

// Inject Modal Styles
const profileStyles = `
    .profile-modal-overlay {
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); display: none; align-items: center;
        justify-content: center; z-index: 9999; backdrop-filter: blur(5px);
    }
    .profile-modal {
        background: white; width: 90%; max-width: 400px; border-radius: 20px;
        overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        animation: slideUp 0.3s ease-out;
    }
    @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .profile-header { background: linear-gradient(135deg, #8B0000 0%, #DC143C 100%); color: white; padding: 30px; text-align: center; }
    .profile-header .avatar { width: 80px; height: 80px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px; border: 4px solid rgba(255,255,255,0.3); font-size: 2.5rem; color: #8B0000; }
    .profile-header h2 { margin: 0; font-size: 1.5rem; }
    .profile-header p { margin: 5px 0 0; opacity: 0.8; font-size: 0.9rem; }
    .profile-body { padding: 25px; }
    .profile-action-btn { width: 100%; padding: 14px; margin-bottom: 12px; border: none; border-radius: 10px; font-weight: 600; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: all 0.2s; font-size: 1rem; }
    .btn-change-pass { background: #f0f0f0; color: #333; }
    .btn-change-pass:hover { background: #e0e0e0; }
    .btn-logout { background: #fee; color: #c00; }
    .btn-logout:hover { background: #fdd; }
    .btn-close { background: white; color: #666; width: auto; margin: 10px auto 0; padding: 8px 20px; }
    .btn-close:hover { color: #333; }
`;

function injectProfileModal() {
    if (document.getElementById('profile-modal-overlay')) return;

    const styleSheet = document.createElement("style");
    styleSheet.innerText = profileStyles;
    document.head.appendChild(styleSheet);

    const modalHTML = `
        <div id="profile-modal-overlay" class="profile-modal-overlay">
            <div class="profile-modal">
                <div class="profile-header">
                    <div class="avatar" id="profile-avatar">👤</div>
                    <h2 id="profile-name">User Name</h2>
                    <p id="profile-email">email@example.com</p>
                </div>
                <div class="profile-body">
                    <button class="profile-action-btn btn-change-pass" onclick="handlePasswordChangeRequest()">
                        <span>🔑</span> Change Password
                    </button>
                    <button class="profile-action-btn btn-logout" onclick="logoutUser()">
                        <span>🚪</span> Logout
                    </button>
                    <button class="btn-close profile-action-btn" onclick="closeProfileModal()">Close</button>
                </div>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

function showUserProfile() {
    injectProfileModal();
    const user = auth.currentUser;
    if (!user) return;

    document.getElementById('profile-name').textContent = user.displayName || user.email.split('@')[0];
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById('profile-avatar').textContent = (user.displayName ? user.displayName[0] : user.email[0]).toUpperCase();
    document.getElementById('profile-modal-overlay').style.display = 'flex';
}

function closeProfileModal() {
    const modal = document.getElementById('profile-modal-overlay');
    if (modal) modal.style.display = 'none';
}

function handlePasswordChangeRequest() {
    const newPass = prompt("Enter your new password (minimum 6 characters):");
    if (!newPass) return;

    if (newPass.length < 6) {
        alert("Password must be at least 6 characters long.");
        return;
    }

    const user = auth.currentUser;
    user.updatePassword(newPass)
        .then(() => {
            alert("Password updated successfully!");
            closeProfileModal();
        })
        .catch(error => {
            console.error("Password update error:", error);
            if (error.code === 'auth/requires-recent-login') {
                alert("Security alert: This action requires a recent login. Please log out and log back in to change your password.");
            } else {
                alert("Error updating password: " + error.message);
            }
        });
}

// Flag for social login to block auto-redirects
let socialLoginInProgress = false;

// Auth state listener
auth.onAuthStateChanged((user) => {
    if (user) {
        console.log("✅ AUTH STATE: Logged In", user.uid);

        // Handle UI updates
        updateUIForLoggedInUser(user);

        // Handle auto-redirect for login/signup pages
        const path = window.location.pathname;
        const isAuthPage = path.endsWith('login.html') || path.endsWith('signup.html');
        const isSocialFlow = socialLoginInProgress || sessionStorage.getItem('isSocialLogin') === 'true';

        if (isAuthPage && !isSocialFlow) {
            console.log("User already logged in, redirecting to home...");
            window.location.href = 'index.html';
        }

        // Firestore Sync (only if doc doesn't exist)
        db.collection('users').doc(user.uid).get()
            .then(doc => {
                if (!doc.exists) {
                    console.log("📂 FIRESTORE: Creating missing user document...");
                    syncUserToFirestore(user);
                }
            })
            .catch(err => console.error("📂 FIRESTORE ERROR:", err.message));

    } else {
        console.log("ℹ️ AUTH STATE: Logged Out");
        updateUIForLoggedOutUser();
    }
});

// Helper to sync user to Firestore (used for Google/Redirect logins)
function syncUserToFirestore(user) {
    if (!user) return Promise.resolve();

    // We want to ensure all users have a consistent schema
    // If it's a new social user, they need 'orders' and 'cart' arrays
    const userRef = db.collection('users').doc(user.uid);

    return userRef.get().then(doc => {
        const baseData = {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: firebase.firestore.FieldValue.serverTimestamp()
        };

        if (!doc.exists) {
            console.log("🆕 Initializing new social user document...");
            return userRef.set({
                ...baseData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                orders: [],
                cart: []
            });
        } else {
            console.log("🔄 Updating existing social user document...");
            return userRef.update(baseData);
        }
    }).then(() => {
        console.log("🏆 Firestore sync complete.");
    }).catch(err => {
        console.error("❌ Firestore sync failed:", err.message);
        // We still resolve so the user isn't stuck, but the data might be stale
        return Promise.resolve();
    });
}

/**
 * SIGN UP FUNCTION
 */
function signUpUser(email, password, displayName) {
    console.log("Attempting sign up for:", email);
    return auth.createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("✅ Auth account created. Updating profile...");

            // Update user profile with display name
            return user.updateProfile({
                displayName: displayName
            }).then(() => {
                console.log("✅ Profile updated. Storing in Firestore...");
                // Store additional user data in Firestore
                // Note: If this fails due to rules, the user is still created in Auth
                return db.collection('users').doc(user.uid).set({
                    email: email,
                    displayName: displayName,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    orders: []
                }).catch(err => {
                    console.error("❌ Firestore Write Error:", err.message);
                    if (err.message.includes("permission-denied")) {
                        const ruleError = "Database storage failed (Permission Denied). Please check your Firestore security rules in the Firebase Console.";
                        console.error(ruleError);
                        throw new Error(ruleError);
                    }
                    throw err;
                });
            }).then(() => {
                console.log("🏆 Sign up process complete.");
                return user;
            });
        })
        .catch((error) => {
            console.error("❌ Sign up process failed:", error.code, error.message);
            throw error;
        });
}

/**
 * LOGIN FUNCTION - Now verifies database registration
 */
function loginUser(email, password) {
    console.log("Attempting login for:", email);
    return auth.signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
            const user = userCredential.user;
            console.log("✅ Auth success. Verifying database registration...");

            // Check if user exists in Firestore
            return db.collection('users').doc(user.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        console.log("✅ Database verification successful.");
                        return user;
                    } else {
                        console.error("❌ Database verification failed: User not found in 'users' collection.");
                        // Sign them out immediately since they aren't "properly" registered
                        return auth.signOut().then(() => {
                            throw new Error("Login failed: Your account exists but is not registered in our database. Please sign up again.");
                        });
                    }
                })
                .catch(err => {
                    if (err.message.includes("Login failed:")) throw err; // Re-throw our custom error

                    console.error("❌ Firestore check error:", err.message);
                    if (err.message.includes("permission-denied")) {
                        // If we can't even check, it's a rule problem
                        throw new Error("Login failed: Security rules blocked database verification. Check your Firestore rules.");
                    }
                    throw err;
                });
        })
        .catch((error) => {
            console.error("❌ Login failed:", error.code, error.message);
            throw error;
        });
}

/**
 * LOGOUT FUNCTION
 */
function logoutUser() {
    // Clear local cart storage explicitly on logout
    localStorage.removeItem('shireen_cart');

    // Also try to clear the global cart variable if it's accessible (via window)
    if (window.cart) window.cart = [];

    return auth.signOut()
        .then(() => {
            console.log("✅ Logout successful.");
            window.location.href = 'index.html';
        })
        .catch((error) => {
            console.error("❌ Logout error:", error);
            window.location.href = 'index.html';
        });
}

/**
 * GOOGLE SIGN-IN
 */
function signInWithGoogle() {
    try {
        // Check if running from file system
        if (window.location.protocol === 'file:') {
            alert("Error: Opening file directly. usage of local server required.");
            return;
        }

        alert("DEBUG: signInWithGoogle started"); // NEW ALERT

        // DEBUG: Verify auth object exists
        if (!firebase || !firebase.auth) {
            alert("CRITICAL ERROR: Firebase SDK not loaded!");
            return;
        }
        if (!auth) {
            alert("CRITICAL ERROR: 'auth' object is undefined. Check firebase-config.js");
            return;
        }

        // alert("DEBUG: Starting Sign-In..."); // Uncomment if needed

        console.log("🔵 Initiating Google Sign-In...");

        // Show loading indicator
        const loadingOverlay = document.createElement('div');
        loadingOverlay.id = 'google-signin-loading';
        loadingOverlay.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.7); z-index: 99999;
        display: flex; align-items: center; justify-content: center;
    `;
        loadingOverlay.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 15px; text-align: center;">
            <div style="font-size: 2rem; margin-bottom: 10px;">⏳</div>
            <div style="font-size: 1.2rem; color: #333;">Signing in with Google...</div>
            <div style="font-size: 0.9rem; color: #666; margin-top: 10px;">Please wait</div>
        </div>
    `;
        document.body.appendChild(loadingOverlay);

        const removeLoading = () => {
            const overlay = document.getElementById('google-signin-loading');
            if (overlay) overlay.remove();
        };

        const provider = new firebase.auth.GoogleAuthProvider();
        provider.addScope('profile');
        provider.addScope('email');

        // Set blocking flags
        socialLoginInProgress = true;
        sessionStorage.setItem('isSocialLogin', 'true');
        sessionStorage.setItem('googleSignInAttempt', Date.now().toString());

        const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
        console.log(`🔵 Device type: ${isMobile ? 'Mobile' : 'Desktop'}`);

        // MOBILE: Use redirect to avoid popup blockers
        if (isMobile) {
            alert("DEBUG: Mobile flow detected. Redirecting..."); // NEW ALERT
            console.log("🔵 Mobile detected - Using REDIRECT flow to avoid popup blockers");

            // Update loading message for redirect
            loadingOverlay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; text-align: center; max-width: 300px;">
                <div style="font-size: 2.5rem; margin-bottom: 15px;">🔄</div>
                <div style="font-size: 1.2rem; color: #333; margin-bottom: 10px;">Redirecting to Google...</div>
                <div style="font-size: 0.85rem; color: #666;">You'll be taken to Google's sign-in page</div>
            </div>
        `;

            // Set flag for redirect detection
            sessionStorage.setItem('googleRedirectPending', 'true');
            sessionStorage.setItem('redirectStartTime', Date.now().toString());

            // Redirect to Google - this will navigate away from the page
            return auth.signInWithRedirect(provider)
                .catch((error) => {
                    console.error("❌ Redirect initiation error:", error);
                    sessionStorage.removeItem('isSocialLogin');
                    sessionStorage.removeItem('googleRedirectPending');
                    removeLoading();

                    let errorMessage = `Redirect failed: ${error.message}`;
                    if (error.code === 'auth/unauthorized-domain') {
                        errorMessage = "⚠️ Domain Error\n\nYour domain is not authorized.\n\nFix: Add your domain in Firebase Console → Authentication → Settings → Authorized domains";
                    } else if (error.message.includes('OAuth') || error.message.includes('developer')) {
                        errorMessage = "⚠️ OAuth Not Published\n\nYour app is in testing mode.\n\nFix: Publish your app in Google Cloud Console → APIs & Services → OAuth consent screen → PUBLISH APP";
                    }

                    alert(errorMessage);
                    throw error;
                });
        }

        // DESKTOP: Use popup for better UX (no full page redirect)
        else {
            console.log("🔵 Desktop detected - Using POPUP flow");

            return auth.signInWithPopup(provider)
                .then((result) => {
                    console.log("✅ Popup success! User:", result.user.email);
                    console.log("🔵 Starting Firestore sync...");

                    return syncUserToFirestore(result.user)
                        .then(() => {
                            console.log("✅ Firestore sync complete!");
                            socialLoginInProgress = false;
                            sessionStorage.removeItem('isSocialLogin');
                            sessionStorage.setItem('googleSignInSuccess', 'true');

                            removeLoading();
                            alert('Google Sign-In successful! Redirecting...');

                            setTimeout(() => {
                                window.location.href = 'index.html';
                            }, 500);

                            return result.user;
                        })
                        .catch((syncError) => {
                            console.error("❌ Firestore sync failed:", syncError);
                            removeLoading();
                            alert(`Sign-In succeeded but data sync failed: ${syncError.message}`);
                            throw syncError;
                        });
                })
                .catch((error) => {
                    console.error("❌ Popup error:", error.code, error.message);
                    socialLoginInProgress = false;
                    sessionStorage.removeItem('isSocialLogin');
                    removeLoading();

                    // Silent cancellation
                    if (error.code === 'auth/popup-closed-by-user' ||
                        error.code === 'auth/cancelled-popup-request' ||
                        error.code === 'auth/user-cancelled') {
                        console.log("ℹ️ User cancelled");
                        return Promise.reject(error);
                    }

                    // Error messages
                    let errorTitle = "Google Sign-In Failed";
                    let errorMessage = "";

                    if (error.code === 'auth/unauthorized-domain') {
                        errorTitle = "⚠️ Domain Not Authorized";
                        errorMessage = `Add your domain in Firebase Console:\nAuthentication → Settings → Authorized domains`;
                    } else if (error.code === 'auth/popup-blocked') {
                        errorTitle = "⚠️ Pop-up Blocked";
                        errorMessage = `Please allow popups for this site`;
                    } else if (error.message.includes('OAuth') || error.message.includes('developer')) {
                        errorTitle = "⚠️ OAuth Not Published";
                        errorMessage = `Go to Google Cloud Console:\nAPIs & Services → OAuth consent screen → PUBLISH APP`;
                    } else {
                        errorMessage = `Error: ${error.code}\n${error.message}`;
                    }

                    alert(`${errorTitle}\n\n${errorMessage}`);
                    throw error;
                });
        }
    } catch (error) {
        console.error("CRITICAL ERROR in signInWithGoogle:", error);
        alert(`Critical Error: ${error.message}`);
    }
}


// Handle redirect result (for mobile users returning to page)
// This runs on EVERY page load, so we wrap it in DOMContentLoaded to ensure Firebase is ready
document.addEventListener('DOMContentLoaded', () => {
    // DIAGNOSTIC ALERT
    const isSocial = sessionStorage.getItem('isSocialLogin');
    const isPending = sessionStorage.getItem('googleRedirectPending');
    alert(`DEBUG: Load - isSocial: ${isSocial}, isPending: ${isPending}, url: ${window.location.search}`);

    // Only process redirect if we're likely returning from one
    const possibleRedirect = isSocial === 'true' || isPending === 'true' || window.location.hash.includes('access_token') || window.location.hash.includes('id_token');

    if (possibleRedirect || window.location.search.includes('code=')) {
        alert("DEBUG: Page loaded. Checking for redirect result..."); // NEW ALERT
        console.log("Checking for redirect result...");

        auth.getRedirectResult()
            .then((result) => {
                if (result && result.user) {
                    alert("DEBUG: Redirect SUCCESS! User: " + result.user.email); // NEW ALERT
                    console.log("✅ Redirect success. User:", result.user.email);
                    sessionStorage.setItem('redirectSuccess', 'true');

                    return syncUserToFirestore(result.user).then(() => {
                        sessionStorage.removeItem('isSocialLogin');
                        sessionStorage.removeItem('googleRedirectPending');

                        // Show success message briefly before redirecting
                        const message = document.createElement('div');
                        message.style.cssText = `
                            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
                            background: white; padding: 30px; border-radius: 15px;
                            box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 9999;
                            text-align: center; font-size: 1.2rem;
                        `;
                        message.innerHTML = `
                            <div style="color: #4CAF50; font-size: 3rem; margin-bottom: 10px;">✓</div>
                            <div>Google Sign-In Successful!</div>
                            <div style="font-size: 0.9rem; color: #666; margin-top: 10px;">Redirecting...</div>
                        `;
                        document.body.appendChild(message);

                        // Redirect after brief delay
                        setTimeout(() => {
                            window.location.href = 'index.html';
                        }, 1500);
                    });
                } else if (possibleRedirect) {
                    // We expected a redirect but got nothing - clear flags
                    alert("DEBUG: getRedirectResult returned NULL (no result found)"); // NEW ALERT
                    console.log("No redirect result found, clearing flags...");
                    sessionStorage.removeItem('isSocialLogin');
                    sessionStorage.removeItem('googleRedirectPending');
                }
            })
            .catch((error) => {
                alert("DEBUG: Redirect ERROR: " + error.message); // NEW ALERT
                console.error("❌ Redirect auth error:", error.code, error.message);
                sessionStorage.removeItem('isSocialLogin');
                sessionStorage.removeItem('googleRedirectPending');

                // Show user-friendly error message
                let errorMsg = "Google Sign-In failed. Please try again.";

                if (error.code === 'auth/unauthorized-domain') {
                    errorMsg = "Domain Error: This website's domain needs to be authorized in Firebase. Please contact support.";
                } else if (error.code === 'auth/account-exists-with-different-credential') {
                    errorMsg = "This email is already registered with a password. Please use email/password login.";
                } else if (error.code === 'auth/popup-blocked') {
                    errorMsg = "Pop-up was blocked. Please allow pop-ups for this site.";
                } else if (error.code === 'auth/cancelled-popup-request') {
                    // User cancelled, don't show error
                    return;
                } else if (error.message) {
                    errorMsg = `Sign-in error: ${error.message}`;
                }

                if (errorMsg) {
                    alert(errorMsg);
                }
            });
    }
});

/**
 * PASSWORD RESET
 */
function resetPassword(email) {
    return auth.sendPasswordResetEmail(email)
        .then(() => {
            alert("Password reset email sent! Check your inbox.");
        })
        .catch((error) => {
            console.error("❌ Password reset error:", error);
            throw error;
        });
}

// Utility functions
function getCurrentUser() { return auth.currentUser; }
function isUserLoggedIn() { return auth.currentUser !== null; }
