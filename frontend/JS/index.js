const grid = document.getElementById('petGrid');
const btnLeft = document.querySelector('.scroll-btn.left');
const btnRight = document.querySelector('.scroll-btn.right');
let isHovered = false;
let lastFocused = null;

let cardWidth = 0;
let allCards = Array.from(grid.querySelectorAll('.pet-card'));

// Clone cards for infinite scroll
function cloneCards() {
  cardWidth = allCards[0].offsetWidth + 32; // 32 is the gap (2rem)

  // Clone first few cards to the end and last few to the start
  const visibleCount = Math.floor(grid.offsetWidth / cardWidth);

  const prepend = allCards
    .slice(-visibleCount)
    .map((card) => card.cloneNode(true));
  const append = allCards
    .slice(0, visibleCount)
    .map((card) => card.cloneNode(true));

  prepend.forEach((clone) => {
    grid.insertBefore(clone, grid.firstChild);
  });
  append.forEach((clone) => {
    grid.appendChild(clone);
  });

  allCards = Array.from(grid.querySelectorAll('.pet-card'));

  // Scroll to first original card
  grid.scrollLeft = visibleCount * cardWidth;
}

function updateFocusCard() {
  const center = grid.scrollLeft + grid.offsetWidth / 2;
  let closest = null;
  let closestDist = Infinity;

  allCards.forEach((card) => {
    const rect = card.getBoundingClientRect();
    const cardCenter = rect.left + rect.width / 2;
    const dist = Math.abs(window.innerWidth / 2 - cardCenter);
    if (dist < closestDist) {
      closest = card;
      closestDist = dist;
    }
  });

  allCards.forEach((card) => {
    card.classList.remove('focused', 'expanded');
  });

  if (closest) {
    closest.classList.add('focused');
    lastFocused = closest;
  }
}

function scrollByCard(direction) {
  grid.scrollBy({ left: direction * cardWidth, behavior: 'smooth' });
}

// Handle seamless infinite scroll loop
function handleInfiniteScroll() {
  const totalWidth = cardWidth * allCards.length;
  const visibleCount = Math.floor(grid.offsetWidth / cardWidth);
  const maxScrollLeft = totalWidth - grid.offsetWidth;

  if (grid.scrollLeft <= cardWidth * 0.5) {
    // Jump to the end clone
    grid.scrollLeft = maxScrollLeft - visibleCount * cardWidth * 2;
  } else if (grid.scrollLeft >= maxScrollLeft - cardWidth * 0.5) {
    // Jump to the beginning clone
    grid.scrollLeft = visibleCount * cardWidth;
  }
}

// --- Event Listeners ---
btnLeft.addEventListener('click', () => scrollByCard(-1));
btnRight.addEventListener('click', () => scrollByCard(1));

grid.addEventListener('scroll', () => {
  handleInfiniteScroll();
  window.requestAnimationFrame(updateFocusCard);
});

grid.addEventListener('mouseenter', () => (isHovered = true));
grid.addEventListener('mouseleave', () => (isHovered = false));

// Auto-scroll
setInterval(() => {
  if (!isHovered) scrollByCard(1);
}, 5000);

// Expand on click
grid.addEventListener('click', (e) => {
  const card = e.target.closest('.pet-card');
  if (card && card.classList.contains('focused')) {
    card.classList.toggle('expanded');
  }
});

// --- Initialize ---
window.addEventListener('load', () => {
  cloneCards();
  updateFocusCard();
});

document.getElementById('logout-btn').addEventListener('click', () => {
  localStorage.removeItem('isLoggedIn'); // or whatever key you're using
  window.location.href = 'auth.html';
});
