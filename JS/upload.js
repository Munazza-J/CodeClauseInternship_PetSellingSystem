/*document
  .getElementById('uploadPetForm')
  .addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const messageDiv = document.getElementById('uploadMessage');

    try {
      const response = await fetch('http://localhost:3000/api/pets', {
        method: 'POST',
        body: formData,
      });

      const text = await response.text();
      console.log('Raw response text:', text); // DEBUG

      let result;
      try {
        result = JSON.parse(text);
      } catch (e) {
        console.error('Failed to parse JSON', e);
        showError('Invalid server response');
        return;
      }

      if (response.ok) {
        messageDiv.innerHTML =
          '🎉 Thank you! Your pet was uploaded successfully.<br>Redirecting shortly...';
        messageDiv.style.display = 'block';
        messageDiv.style.backgroundColor = '#d4edda';
        messageDiv.style.color = '#155724';
        messageDiv.style.borderColor = '#c3e6cb';
        messageDiv.scrollIntoView({ behavior: 'smooth' });

        this.reset();
        document.getElementById('previewContainer').innerHTML = '';

        const price = parseFloat(formData.get('price') || '0');
        setTimeout(() => {
          window.location.href = price === 0 ? 'adopt.html' : 'buy.html';
        }, 2500);
      } else {
        showError(result.message || 'Upload failed.');
      }
    } catch (err) {
      console.error(err);
      showError('Something went wrong. Please try again.');
    }

    function showError(msg) {
      messageDiv.textContent = msg;
      messageDiv.style.display = 'block';
      messageDiv.style.backgroundColor = '#f8d7da';
      messageDiv.style.color = '#721c24';
      messageDiv.style.borderColor = '#f5c6cb';
      messageDiv.scrollIntoView({ behavior: 'smooth' });
    }
  });

// --- Initialize ---
window.addEventListener('load', () => {
  cloneCards();
  updateFocusCard();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('isLoggedIn'); // or whatever key you're using
  window.location.href = 'index.html';
});

// Hide price input if status is 'adoption'
document.getElementById('status').addEventListener('change', function () {
  const priceContainer = document.getElementById('priceContainer');
  if (this.value === 'adoption') {
    priceContainer.style.display = 'none';
    document.getElementById('price').value = 0; // set default to 0
  } else {
    priceContainer.style.display = 'block';
  }
});

window.addEventListener('load', () => {
  cloneCards();
  updateFocusCard();
  // Hide price field initially
  const status = document.getElementById('status');
  const priceContainer = document.getElementById('priceContainer');
  if (status.value !== 'sale') {
    priceContainer.style.display = 'none';
  }
});*/


document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('uploadPetForm');
  const messageDiv = document.getElementById('uploadMessage');
  const statusSelect = document.getElementById('status');
  const priceContainer = document.getElementById('priceContainer');

  // Hide price if needed on load
  if (statusSelect.value === 'adoption' || !statusSelect.value) {
    priceContainer.style.display = 'none';
  }

  // Handle price visibility
  statusSelect.addEventListener('change', () => {
    if (statusSelect.value === 'adoption') {
      priceContainer.style.display = 'none';
      document.getElementById('price').value = 0;
    } else {
      priceContainer.style.display = 'block';
    }
  });

  // Logout handler
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'index.html';
  });

  // Submit Handler
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    messageDiv.style.display = 'none'; // hide previous messages

    try {
      const response = await fetch('http://localhost:3000/api/pets', {
        method: 'POST',
        body: formData,
      });

      const rawText = await response.text();
      let result;
      try {
        result = JSON.parse(rawText);
      } catch (err) {
        console.error('JSON parse error:', err);
        return showError('Server returned invalid data.');
      }

      if (response.ok) {
        messageDiv.innerHTML = '🎉 Pet uploaded successfully.<br>Redirecting...';
        messageDiv.classList.add('upload-success');
        messageDiv.style.display = 'block';
        messageDiv.scrollIntoView({ behavior: 'smooth' });

        const price = parseFloat(formData.get('price') || '0');

        setTimeout(() => {
          window.location.href = price === 0 ? 'adopt.html' : 'buy.html';
        }, 2500);
      } else {
        showError(result.message || 'Upload failed.');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      showError('Something went wrong. Please try again.');
    }
  });

  function showError(msg) {
    messageDiv.textContent = msg;
    messageDiv.style.display = 'block';
    messageDiv.style.backgroundColor = '#f8d7da';
    messageDiv.style.color = '#721c24';
    messageDiv.style.borderColor = '#f5c6cb';
    messageDiv.scrollIntoView({ behavior: 'smooth' });
  }
});
