const socket = io();

const statusBadge = document.getElementById('statusBadge');
const productStage = document.getElementById('productStage');
const productImage = document.getElementById('productImage');
const mysteryOverlay = document.getElementById('mysteryOverlay');
const productName = document.getElementById('productName');
const productDescription = document.getElementById('productDescription');
const productPrice = document.getElementById('productPrice');
const productPoints = document.getElementById('productPoints');

const soldAnnouncement = document.getElementById('soldAnnouncement');
const soldTeamName = document.getElementById('soldTeamName');
const soldPoints = document.getElementById('soldPoints');

const previewMode = document.getElementById('previewMode');
const previewTimer = document.getElementById('previewTimer');
const previewGrid = document.getElementById('previewGrid');

const leaderboardMode = document.getElementById('leaderboardMode');
const leaderboardList = document.getElementById('leaderboardList');

let currentMode = 'idle';

socket.on('previewStarted', ({ previewState, products }) => {
  currentMode = 'preview';
  showPreview(products);
});

socket.on('previewTimerUpdate', (timer) => {
  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  previewTimer.textContent = `Preview Time: ${mins}:${secs.toString().padStart(2, '0')}`;
});

socket.on('previewEnded', () => {
  hideAll();
  currentMode = 'idle';
});

socket.on('productLive', (product) => {
  currentMode = 'live';
  showLiveProduct(product);
});

socket.on('productSold', ({ product, winnerTeam }) => {
  currentMode = 'sold';
  showSoldAnnouncement(product, winnerTeam);
  
  setTimeout(() => {
    hideAll();
    currentMode = 'idle';
  }, 5000);
});

socket.on('leaderboardToggle', ({ show, teams }) => {
  if (show) {
    currentMode = 'leaderboard';
    showLeaderboard(teams);
  } else {
    hideAll();
    currentMode = 'idle';
  }
});

function hideAll() {
  statusBadge.classList.add('hidden');
  productStage.classList.add('hidden');
  soldAnnouncement.classList.remove('active');
  previewMode.classList.remove('active');
  leaderboardMode.classList.remove('active');
}

function showPreview(products) {
  hideAll();
  previewMode.classList.add('active');
  
  previewGrid.innerHTML = '';
  products.forEach(product => {
    const card = document.createElement('div');
    card.className = 'preview-card';
    
    if (product.isMystery || product.productType === 'mystery') {
      card.classList.add('mystery');
      card.innerHTML = `
        <img src="${product.imageUrl}" alt="Mystery">
        <h3>??? MYSTERY ???</h3>
        <div class="preview-price">???</div>
        <div class="preview-points">??? points</div>
      `;
    } else {
      card.innerHTML = `
        <img src="${product.imageUrl}" alt="${product.name}">
        <h3>${product.name}</h3>
        <div class="preview-price">₹${product.baseMoneyPrice}</div>
        <div class="preview-points">${product.pointValue} points</div>
      `;
    }
    
    previewGrid.appendChild(card);
  });
}

function showLiveProduct(product) {
  hideAll();
  
  const isMystery = product.isMystery || product.productType === 'mystery';
  
  statusBadge.textContent = isMystery ? '🟣 MYSTERY ITEM' : '🟢 LIVE NOW';
  statusBadge.className = 'status-badge ' + (isMystery ? 'status-mystery' : 'status-live');
  statusBadge.classList.remove('hidden');
  
  productImage.src = product.imageUrl;
  
  if (isMystery) {
    productName.textContent = '??? MYSTERY ITEM ???';
    productDescription.textContent = 'Details will be revealed after sold';
    mysteryOverlay.classList.remove('hidden');
  } else {
    productName.textContent = product.name;
    productDescription.textContent = product.description;
    mysteryOverlay.classList.add('hidden');
  }
  
  productPrice.textContent = product.baseMoneyPrice;
  productPoints.textContent = product.pointValue;
  
  productStage.classList.remove('hidden');
}

function showSoldAnnouncement(product, winnerTeam) {
  hideAll();
  
  statusBadge.textContent = '🔴 SOLD';
  statusBadge.className = 'status-badge status-sold';
  statusBadge.classList.remove('hidden');
  
  soldTeamName.textContent = winnerTeam;
  soldPoints.textContent = `+${product.pointValue} Points`;
  
  soldAnnouncement.classList.add('active');
}

function showLeaderboard(teams) {
  hideAll();
  leaderboardMode.classList.add('active');
  
  leaderboardList.innerHTML = '';
  teams.forEach((team, index) => {
    const item = document.createElement('div');
    item.className = 'leaderboard-item';
    item.innerHTML = `
      <div>
        <span class="leaderboard-rank">#${index + 1}</span>
        <span class="leaderboard-name">${team.teamName}</span>
      </div>
      <span class="leaderboard-points">${team.points} pts</span>
    `;
    leaderboardList.appendChild(item);
  });
}
