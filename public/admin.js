const socket = io();

const newTeamName = document.getElementById('newTeamName');
const addTeamBtn = document.getElementById('addTeamBtn');
const teamsList = document.getElementById('teamsList');

const productName = document.getElementById('productName');
const productDescription = document.getElementById('productDescription');
const productBaseMoneyPrice = document.getElementById('productBaseMoneyPrice');
const productPointValue = document.getElementById('productPointValue');
const productType = document.getElementById('productType');
const isMystery = document.getElementById('isMystery');
const productImage = document.getElementById('productImage');
const addProductBtn = document.getElementById('addProductBtn');
const productsList = document.getElementById('productsList');

const previewDuration = document.getElementById('previewDuration');
const startPreviewBtn = document.getElementById('startPreviewBtn');
const previewStatus = document.getElementById('previewStatus');

const productSelect = document.getElementById('productSelect');
const setLiveBtn = document.getElementById('setLiveBtn');
const winnerTeamSelect = document.getElementById('winnerTeamSelect');
const markSoldBtn = document.getElementById('markSoldBtn');

const mysteryOwner = document.getElementById('mysteryOwner');
const mysteryEffect = document.getElementById('mysteryEffect');
const mysteryTarget = document.getElementById('mysteryTarget');
const mysteryPoints = document.getElementById('mysteryPoints');
const applyEffectBtn = document.getElementById('applyEffectBtn');

const toggleLeaderboardBtn = document.getElementById('toggleLeaderboardBtn');
const leaderboardList = document.getElementById('leaderboardList');

let teams = [];
let products = [];
let currentProduct = null;
let leaderboardShown = false;

addTeamBtn.addEventListener('click', addTeam);
addProductBtn.addEventListener('click', addProduct);
startPreviewBtn.addEventListener('click', startPreview);
setLiveBtn.addEventListener('click', setProductLive);
markSoldBtn.addEventListener('click', markProductSold);
applyEffectBtn.addEventListener('click', applyMysteryEffect);
toggleLeaderboardBtn.addEventListener('click', toggleLeaderboard);

socket.on('teamsUpdate', (updatedTeams) => {
  teams = updatedTeams;
  updateTeamsList();
  updateWinnerSelect();
  updateMysterySelects();
  updateLeaderboard();
});

socket.on('productsUpdate', (updatedProducts) => {
  products = updatedProducts;
  updateProductsList();
  updateProductSelect();
});

socket.on('productLive', (product) => {
  currentProduct = product;
  loadProducts();
});

socket.on('productSold', ({ product, winnerTeam }) => {
  if (product.productType === 'mystery-card') {
    if (confirm(`${winnerTeam} won a Mystery Card! Apply effect now?`)) {
      const effect = prompt('Enter effect (steal/deduct/double):');
      if (effect === 'steal' || effect === 'deduct') {
        const target = prompt('Enter target team name:');
        const points = prompt('Enter points:');
        if (target && points) {
          applyMysteryEffectDirect(winnerTeam, effect, target, parseInt(points));
        }
      } else if (effect === 'double') {
        applyMysteryEffectDirect(winnerTeam, 'double', '', 0);
      }
    }
  }
  loadProducts();
  loadTeams();
});

socket.on('previewTimerUpdate', (timer) => {
  const mins = Math.floor(timer / 60);
  const secs = timer % 60;
  previewStatus.textContent = `Preview Active: ${mins}:${secs.toString().padStart(2, '0')}`;
});

socket.on('previewEnded', () => {
  previewStatus.textContent = 'Preview Ended';
});

document.addEventListener('DOMContentLoaded', () => {
  loadTeams();
  loadProducts();
});

async function addTeam() {
  const teamName = newTeamName.value.trim();
  if (!teamName) return alert('Enter team name');
  
  try {
    const res = await fetch('/api/teams', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamName })
    });
    
    if (res.ok) {
      newTeamName.value = '';
    } else {
      const error = await res.json();
      alert(error.error);
    }
  } catch (error) {
    alert('Error adding team');
  }
}

async function deleteTeam(teamName) {
  if (!confirm(`Delete team "${teamName}"?`)) return;
  
  try {
    await fetch(`/api/teams/${encodeURIComponent(teamName)}`, { method: 'DELETE' });
  } catch (error) {
    alert('Error deleting team');
  }
}

async function loadTeams() {
  try {
    const res = await fetch('/api/teams');
    teams = await res.json();
    updateTeamsList();
    updateWinnerSelect();
    updateMysterySelects();
    updateLeaderboard();
  } catch (error) {
    console.error('Error loading teams:', error);
  }
}

function updateTeamsList() {
  teamsList.innerHTML = '';
  teams.forEach(team => {
    const div = document.createElement('div');
    div.className = 'team-item-admin';
    div.innerHTML = `
      <div>
        <strong>${team.teamName}</strong>
        <div style="color: #4ecdc4;">${team.points} points</div>
        ${team.mysteryCards > 0 ? `<div style="color: #ffd700;">🃏 ${team.mysteryCards} mystery cards</div>` : ''}
      </div>
      <button class="delete-btn" onclick="deleteTeam('${team.teamName}')">Delete</button>
    `;
    teamsList.appendChild(div);
  });
}

function updateWinnerSelect() {
  winnerTeamSelect.innerHTML = '<option value="">Select Winning Team</option>';
  teams.forEach(team => {
    const option = document.createElement('option');
    option.value = team.teamName;
    option.textContent = team.teamName;
    winnerTeamSelect.appendChild(option);
  });
}

function updateMysterySelects() {
  mysteryOwner.innerHTML = '<option value="">Select Team with Mystery Card</option>';
  mysteryTarget.innerHTML = '<option value="">Select Target Team</option>';
  
  teams.forEach(team => {
    if (team.mysteryCards > 0) {
      const opt = document.createElement('option');
      opt.value = team.teamName;
      opt.textContent = `${team.teamName} (${team.mysteryCards} cards)`;
      mysteryOwner.appendChild(opt);
    }
    
    const opt2 = document.createElement('option');
    opt2.value = team.teamName;
    opt2.textContent = `${team.teamName} (${team.points} pts)`;
    mysteryTarget.appendChild(opt2);
  });
}

function updateLeaderboard() {
  leaderboardList.innerHTML = '';
  teams.forEach((team, index) => {
    const div = document.createElement('div');
    div.className = 'team-item';
    div.innerHTML = `
      <div>
        <span class="team-rank">#${index + 1}</span>
        <span class="team-name">${team.teamName}</span>
      </div>
      <span class="team-points">${team.points} pts</span>
    `;
    leaderboardList.appendChild(div);
  });
}

async function addProduct() {
  const name = productName.value.trim();
  const description = productDescription.value.trim();
  const baseMoneyPrice = parseInt(productBaseMoneyPrice.value);
  const pointValue = parseInt(productPointValue.value);
  const type = productType.value;
  const mystery = isMystery.checked;
  const image = productImage.files[0];
  
  if (!name || !description || !baseMoneyPrice || !pointValue || !image) {
    return alert('Fill all fields and select image');
  }
  
  const formData = new FormData();
  formData.append('name', name);
  formData.append('description', description);
  formData.append('baseMoneyPrice', baseMoneyPrice);
  formData.append('pointValue', pointValue);
  formData.append('productType', type);
  formData.append('isMystery', mystery);
  formData.append('image', image);
  
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      body: formData
    });
    
    if (res.ok) {
      productName.value = '';
      productDescription.value = '';
      productBaseMoneyPrice.value = '';
      productPointValue.value = '';
      productType.value = 'normal';
      isMystery.checked = false;
      productImage.value = '';
    } else {
      const error = await res.json();
      alert(error.error);
    }
  } catch (error) {
    alert('Error adding product');
  }
}

async function deleteProduct(productId) {
  if (!confirm('Delete this product?')) return;
  
  try {
    await fetch(`/api/products/${productId}`, { method: 'DELETE' });
  } catch (error) {
    alert('Error deleting product');
  }
}

async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    products = await res.json();
    updateProductsList();
    updateProductSelect();
  } catch (error) {
    console.error('Error loading products:', error);
  }
}

function updateProductsList() {
  productsList.innerHTML = '';
  products.forEach(product => {
    const div = document.createElement('div');
    div.className = 'product-item';
    const statusClass = `status-${product.status}`;
    const typeIcon = product.productType === 'mystery-card' ? '🃏' : product.isMystery ? '🎁' : '';
    
    div.innerHTML = `
      <img src="${product.imageUrl}" alt="${product.name}">
      <div class="product-details">
        <h4>${typeIcon} ${product.name}</h4>
        <p>${product.description}</p>
        <div>Base Price: ₹${product.baseMoneyPrice}</div>
        <div>Points: ${product.pointValue}</div>
        <span class="product-status ${statusClass}">${product.status.toUpperCase()}</span>
        ${product.status === 'sold' ? `<div style="color: #4caf50;">Winner: ${product.winnerTeam}</div>` : ''}
      </div>
      <button class="delete-btn" onclick="deleteProduct('${product._id}')">Delete</button>
    `;
    productsList.appendChild(div);
  });
}

function updateProductSelect() {
  productSelect.innerHTML = '<option value="">Select Product to Go LIVE</option>';
  const available = products.filter(p => p.status === 'pending');
  available.forEach(product => {
    const option = document.createElement('option');
    option.value = product._id;
    option.textContent = `${product.name} (₹${product.baseMoneyPrice} - ${product.pointValue} pts)`;
    productSelect.appendChild(option);
  });
}

async function startPreview() {
  const duration = parseInt(previewDuration.value);
  
  try {
    await fetch('/api/preview/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ duration })
    });
  } catch (error) {
    alert('Error starting preview');
  }
}

async function setProductLive() {
  const productId = productSelect.value;
  if (!productId) return alert('Select a product');
  
  try {
    await fetch(`/api/products/${productId}/live`, { method: 'POST' });
    alert('Product is now LIVE');
  } catch (error) {
    alert('Error setting product live');
  }
}

async function markProductSold() {
  const winnerTeam = winnerTeamSelect.value;
  if (!winnerTeam) return alert('Select winning team');
  
  const liveProduct = products.find(p => p.status === 'current');
  if (!liveProduct) return alert('No live product');
  
  try {
    await fetch(`/api/products/${liveProduct._id}/sold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ winnerTeam })
    });
    winnerTeamSelect.value = '';
    alert('Product marked as sold');
  } catch (error) {
    alert('Error marking product sold');
  }
}

async function applyMysteryEffect() {
  const ownerTeam = mysteryOwner.value;
  const effect = mysteryEffect.value;
  const targetTeam = mysteryTarget.value;
  const points = parseInt(mysteryPoints.value);
  
  if (!ownerTeam) return alert('Select team with mystery card');
  if ((effect === 'steal' || effect === 'deduct') && !targetTeam) return alert('Select target team');
  if ((effect === 'steal' || effect === 'deduct') && !points) return alert('Enter points');
  
  try {
    await fetch('/api/mystery-effect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerTeam, effect, targetTeam, points })
    });
    mysteryOwner.value = '';
    mysteryTarget.value = '';
    mysteryPoints.value = '';
    alert('Mystery effect applied');
  } catch (error) {
    alert('Error applying effect');
  }
}

async function applyMysteryEffectDirect(ownerTeam, effect, targetTeam, points) {
  try {
    await fetch('/api/mystery-effect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ownerTeam, effect, targetTeam, points })
    });
  } catch (error) {
    console.error('Error applying mystery effect:', error);
  }
}

async function toggleLeaderboard() {
  leaderboardShown = !leaderboardShown;
  
  try {
    await fetch('/api/display/leaderboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ show: leaderboardShown })
    });
    toggleLeaderboardBtn.textContent = leaderboardShown ? 'HIDE FROM DISPLAY' : 'SHOW ON DISPLAY';
  } catch (error) {
    alert('Error toggling leaderboard');
  }
}

window.deleteTeam = deleteTeam;
window.deleteProduct = deleteProduct;
