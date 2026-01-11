/* Shireen Bakers Functionality */

// State
let cart = [];
let isAuthReady = false;
let isCartLoaded = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM loaded. Initializing cart...");

    // Splash Screen Timer (Only show once per session)
    const preloader = document.getElementById('preloader');
    if (preloader) {
        if (sessionStorage.getItem('splashShown')) {
            preloader.style.display = 'none';
        } else {
            setTimeout(() => {
                preloader.classList.add('preloader-hidden');
                // Allow interaction after fade out
                setTimeout(() => {
                    preloader.style.display = 'none';
                    sessionStorage.setItem('splashShown', 'true');
                }, 1000); // Wait for transition
            }, 2000); // 2 seconds display
        }
    }

    // Promotional Popup (Show 1 second after splash screen)
    const promoOverlay = document.getElementById('promo-overlay');
    const promoPopup = document.getElementById('promo-popup');

    if (promoOverlay && promoPopup) {
        if (!sessionStorage.getItem('promoShown')) {
            // Find delay based on if splash was shown
            const delay = sessionStorage.getItem('splashShown') ? 1000 : 3500;

            setTimeout(() => {
                promoOverlay.style.display = 'flex';
                setTimeout(() => {
                    promoPopup.classList.add('active');
                    sessionStorage.setItem('promoShown', 'true');
                }, 100);
            }, delay);
        }
    }

    // Listen for auth state to load user-specific cart
    if (typeof auth !== 'undefined') {
        auth.onAuthStateChanged((user) => {
            isAuthReady = true;
            if (user) {
                console.log("User logged in, loading cart from Firestore...");
                loadCartFromFirestore(user.uid);
            } else {
                console.log("No user logged in, clearing local cart.");
                cart = [];
                updateCartCount();
                if (typeof cartModal !== 'undefined' && cartModal && cartModal.classList.contains('active')) renderCart();
            }
        });
    }

    // Hero Slideshow Logic (Sliding Effect)
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length > 0) {
        let currentSlide = 0;
        setInterval(() => {
            // 1. Remove 'prev' from whatever was sliding out before
            slides.forEach(s => s.classList.remove('prev'));

            // 2. Current active slide becomes 'prev' (slides out left)
            slides[currentSlide].classList.remove('active');
            slides[currentSlide].classList.add('prev');

            // 3. Increment index
            currentSlide = (currentSlide + 1) % slides.length;

            // 4. New slide becomes 'active' (slides in from right)
            slides[currentSlide].classList.add('active');
        }, 3000); // 3 seconds per slide
    }

    // Scroll Reveal Intersection Observer
    const revealElements = document.querySelectorAll('.scroll-reveal');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('reveal-active');
                // stop observing once revealed
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.15, // Trigger when 15% of element is visible
        rootMargin: '0px 0px -50px 0px' // Slightly offset from bottom
    });

    revealElements.forEach(el => revealObserver.observe(el));
});

// Modal Logic
const cartModal = document.getElementById('cart-modal');
const cartCountElements = document.querySelectorAll('.cart-count');
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');

// Cart Functions
function openCart() {
    if (typeof auth !== 'undefined' && !auth.currentUser) {
        alert("Please login to view your cart!");
        window.location.href = 'login.html';
        return;
    }
    if (cartModal) {
        cartModal.classList.add('active');
        renderCart();
    }
}

function closeCart() {
    if (cartModal) {
        cartModal.classList.remove('active');
    }
}

function addToCart(name, price) {
    if (typeof auth !== 'undefined' && !auth.currentUser) {
        alert("Please login to add items to the cart!");
        window.location.href = 'login.html';
        return;
    }

    // Check if item exists
    const existingItem = cart.find(item => item.name === name);
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({ name, price, quantity: 1 });
    }

    updateCartCount();
    saveCartToFirestore();

    // If cart is open, re-render
    if (cartModal && cartModal.classList.contains('active')) {
        renderCart();
    }

    // Show feedback
    showToast(`Added ${name} to cart!`);
}

function showToast(message) {
    // Create toast container if not exists
    let toast = document.getElementById('toast-notification');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notification';
        toast.style.cssText = `
            position: fixed; bottom: 20px; right: 20px;
            background: #333; color: white; padding: 12px 24px;
            border-radius: 8px; z-index: 3000; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            opacity: 0; transition: opacity 0.3s; pointer-events: none;
        `;
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';

    // Hide after 3 seconds
    setTimeout(() => {
        toast.style.opacity = '0';
    }, 3000);
}

function updateCartCount() {
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCountElements.forEach(el => el.textContent = totalItems);
}

function renderCart() {
    if (!cartItemsContainer) return;

    cartItemsContainer.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align:center; color:#999; margin-top: 20px;">Your cart is empty.</p>';
    } else {
        cart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;

            const itemEl = document.createElement('div');
            itemEl.className = 'cart-item';
            itemEl.style.padding = '15px 0';
            itemEl.style.borderBottom = '1px solid #eee';
            itemEl.style.display = 'flex';
            itemEl.style.justifyContent = 'space-between';
            itemEl.style.alignItems = 'center';

            itemEl.innerHTML = `
                <div>
                    <strong style="display:block; margin-bottom:4px;">${item.name}</strong>
                    <div style="font-size:0.85rem; color:#666;">
                        Rs. ${item.price.toLocaleString()} x ${item.quantity}
                        <button onclick="removeFromCart(${index})" style="margin-left:10px; background:none; border:none; color:#C8102E; cursor:pointer; font-size:0.75rem;">Remove</button>
                    </div>
                </div>
                <div style="font-weight:600; color:#C8102E;">Rs. ${itemTotal.toLocaleString()}</div>
            `;
            cartItemsContainer.appendChild(itemEl);
        });
    }

    if (cartTotalElement) {
        cartTotalElement.textContent = `Rs. ${total.toLocaleString()}`;
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    saveCartToFirestore();
    renderCart();
}

// FIRESTORE SYNC
function saveCartToFirestore() {
    const user = typeof auth !== 'undefined' ? auth.currentUser : null;

    if (user && typeof db !== 'undefined') {
        const userData = {
            cart: cart,
            email: user.email,
            displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        };

        db.collection('users').doc(user.uid).set(userData, { merge: true })
            .then(() => console.log("Cart synced to Firestore."))
            .catch(err => console.error("Error syncing to Firestore:", err));
    }
}

function loadCartFromFirestore(userId) {
    if (typeof db !== 'undefined') {
        db.collection('users').doc(userId).get()
            .then(doc => {
                if (doc.exists && doc.data().cart) {
                    cart = doc.data().cart;
                    console.log("Cart loaded from database:", cart);
                } else {
                    cart = [];
                    console.log("No cart found in database, starting fresh.");
                }
                isCartLoaded = true; // Mark as loaded so saveCartToFirestore can proceed
                updateCartCount();
                if (cartModal && cartModal.classList.contains('active')) renderCart();
            })
            .catch(err => {
                console.error("Error loading cart:", err);
                isCartLoaded = true; // Even on error, allow saving so we don't block user forever
            });
    }
}

// Event Listeners for closing modals when clicking outside
window.onclick = function (event) {
    const loginModal = document.getElementById('login-modal');
    if (event.target === loginModal) {
        if (typeof closeLogin === 'function') closeLogin();
    }
    if (event.target === cartModal) {
        closeCart();
    }
}

// Navigation


// Close Promotional Popup
function closePromo() {
    const promoOverlay = document.getElementById('promo-overlay');
    const promoPopup = document.getElementById('promo-popup');
    if (promoPopup) {
        promoPopup.classList.remove('active');
        setTimeout(() => {
            if (promoOverlay) promoOverlay.style.display = 'none';
        }, 400);
    }
}
