document.addEventListener('DOMContentLoaded', () => {
  const introScreen = document.querySelector('.intro-screen');
  const authWrapper = document.querySelector('.auth-wrapper');

  // Check if user is already logged in
  const storedUser = JSON.parse(localStorage.getItem('cozypaws_user'));
  const isLoggedIn =
    localStorage.getItem('isLoggedIn') === 'true' && storedUser;

  // Splash screen logic
  setTimeout(() => {
    introScreen.style.opacity = '0';
    setTimeout(() => {
      introScreen.style.display = 'none';

      if (isLoggedIn) {
        window.location.href = 'index.html';
      } else {
        authWrapper.classList.remove('hidden');
        setTimeout(() => {
          authWrapper.classList.add('visible');
        }, 50); // small delay to trigger CSS transition
      }
    }, 1000); // after fade-out
  }, 2500);
});

// ---------------- Tab switching ----------------
const registerTab = document.getElementById('registerTab');
const loginTab = document.getElementById('loginTab');
const registerForm = document.getElementById('registerForm');
const loginForm = document.getElementById('loginForm');
const messageBox = document.getElementById('message');

// Switch to register
registerTab.addEventListener('click', () => {
  registerTab.classList.add('active');
  loginTab.classList.remove('active');
  registerForm.classList.add('active');
  loginForm.classList.remove('active');
  messageBox.textContent = '';
});

// Switch to login
loginTab.addEventListener('click', () => {
  loginTab.classList.add('active');
  registerTab.classList.remove('active');
  loginForm.classList.add('active');
  registerForm.classList.remove('active');
  messageBox.textContent = '';
});

// ---------------- Register form submit ----------------
registerForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim(); // ✅ get phone input
  const password = document.getElementById('regPassword').value;
  const confirm = document.getElementById('regConfirm').value;

  if (password !== confirm) {
    messageBox.textContent = 'Passwords do not match.';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, phone, password }), // ✅ send phone too
    });

    const data = await res.json();

    if (data.success) {
      messageBox.textContent = 'Registration successful! Please login.';
      setTimeout(() => {
        loginTab.click();
      }, 1500);
    } else {
      messageBox.textContent = data.message || 'Registration failed.';
    }
  } catch (err) {
    console.error(err);
    messageBox.textContent = 'Something went wrong.';
  }
});

// ---------------- Login form submit ----------------
loginForm.addEventListener('submit', async function (e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('http://localhost:3000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success) {
      localStorage.setItem('cozypaws_user', JSON.stringify(data.user));
      localStorage.setItem('isLoggedIn', 'true');
      messageBox.textContent = 'Login successful! Redirecting...';
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    } else {
      messageBox.textContent = data.message || 'Login failed.';
    }
  } catch (err) {
    console.error(err);
    messageBox.textContent = 'Something went wrong.';
  }
});
