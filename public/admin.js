// Socket.IO connection
const socket = io();

// DOM elements
const endEventBtn = document.getElementById('endEventBtn');

// Dashboard elements
const noDashboard = document.getElementById('noDashboard');
const activeDashboard = document.getElementById('activeDashboard');
const dashProductImage = document.getElementById('dashProductImage');
const dashProductName = document.getElementById('dashProductName');
const dashMoneyPrice = document.getElementById('dashMoneyPrice');
const dashPointValue = document.getElementById('dashPointValue');

// Team management elements
const newTeamName = document.getElementById('newTeamName');
const addTeamBtn = document.getElementById('addTeamBtn');
const teamsList = document.getElementById('teamsList');

// Product management elements
const productName = document.getElementById('productName');
const productDescription = document.getElementById('productDescription');
const productBaseMoneyPrice = document.getElementById('productBaseMoneyPrice');
const productPointValue = document.getElementById('productPointValue');
const productType = document.getElementById('productType');
const isMystery = document.getElementById('isMystery');
const productImage = document.getElementById('productImage');
const addProductBtn = document.getElementById('addProductBtn');
const productsList = document.getElementById('productsList');

// Auction control elements
const productSelect = document.getElementById('productSelect');
const setCurrentBtn = document.getElementById('setCurrentBtn');
const winnerTeamSelect = document.getElementById('winnerTeamSelect');
const markSoldBtn = document.getElementById('markSoldBtn');

// Showcase control elements
const showcaseDuration = document.getElementById('showcaseDuration');
const startShowcaseBtn = document.getElementById('startShowcaseBtn');
const showcaseTimer = document.getElementById('showcaseTimer');

// Steal power elements
const stealingTeamSelect = document.getElementById('stealingTeamSelect');
const stealTargetSelect = document.getElementById('stealTargetSelect');
const stealPoints = document.getElementById('stealPoints');
const executeStealBtn = document.getElementById('executeStealBtn');

// Leaderboard
const adminTeamsList = document.getElementById('adminTeamsList');

// Modal elements
const eventEndModal = document.getElementById('eventEndModal');
const eventResults = document.getElementById('eventResults');
const closeModalBtn = document.getElementById('closeModalBtn');

// Global state
let displayState = null;
let teams = [];
let products = [];

// Event listeners
addTeamBtn.addEventListener('click', addTeam);
addProductBtn.addEventListener('click', addProduct);
setCurrentBtn.addEventListener('click', setCurrentProduct);
markSoldBtn.addEventListener('click', markProductSold);
startShowcaseBtn.addEventListener('click', startShowcase);
executeStealBtn.addEventListener('click', executeSteal);
endEventBtn.addEventListener('click', endEvent);
closeModalBtn.addEventListener('click', () => eventEndModal.classList.add('hidden'));

// Socket event listeners
socket.on('displayUpdate', (state) => {
    displayState = state;
    updateDashboard();
    if (state.allProducts) {
        products = state.allProducts;
        updateProductsList();
        updateProductSelect();
    }
});

socket.on('teamsUpdate', (updatedTeams) => {
    teams = updatedTeams;
    updateTeamsList();
    updateLeaderboard();
    updateWinnerTeamSelect();
    updateStealTeamSelects();
});

socket.on('showcaseStarted', (state) => {
    updateShowcaseStatus(state);
});

socket.on('showcaseTimerUpdate', (timer) => {
    updateShowcaseTimer(timer);
});

socket.on('showcaseEnded', () => {
    showcaseTimer.textContent = 'Not active';
});

socket.on('productUpdated', (product) => {
    loadProducts();
});

socket.on('mysteryRevealed', (data) => {
    alert(`Mystery Revealed! ${data.product.name} won by ${data.winnerTeam}`);
});

socket.on('stealPowerAwarded', (data) => {
    alert(`${data.teamName} won a Mystery Card and can now steal points!`);
});

socket.on('pointsStolen', (data) => {
    alert(`${data.stealingTeam} stole ${data.pointsStolen} points from ${data.targetTeam}!`);
});

// Initialize admin panel
document.addEventListener('DOMContentLoaded', () => {
    loadTeams();
    loadProducts();
});

// Team management functions
async function addTeam() {
    const teamName = newTeamName.value.trim();
    
    if (!teamName) {
        alert('Please enter a team name');
        return;
    }
    
    try {
        const response = await fetch('/api/teams', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ teamName })
        });
        
        if (response.ok) {
            newTeamName.value = '';
            loadTeams();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error adding team');
    }
}

async function deleteTeam(teamName) {
    if (!confirm(`Are you sure you want to delete team "${teamName}"?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/teams/${encodeURIComponent(teamName)}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error deleting team');
    }
}

async function loadTeams() {
    try {
        const response = await fetch('/api/teams');
        teams = await response.json();
        updateTeamsList();
        updateLeaderboard();
        updateWinnerTeamSelect();
    } catch (error) {
        console.error('Error loading teams:', error);
    }
}

function updateTeamsList() {
    teamsList.innerHTML = '';
    
    teams.forEach(team => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item-admin';
        
        teamItem.innerHTML = `
            <div>
                <strong>${team.teamName}</strong>
                <div style="color: #4ecdc4; font-size: 0.9rem;">${team.points} points earned</div>
                ${team.stealCards > 0 ? `<div style="color: #ffd700; font-size: 0.8rem;">🎴 ${team.stealCards} steal cards</div>` : ''}
            </div>
            <div class="team-controls">
                <button class="delete-btn" onclick="deleteTeam('${team.teamName}')">Delete</button>
            </div>
        `;
        
        teamsList.appendChild(teamItem);
    });
}

function updateLeaderboard() {
    adminTeamsList.innerHTML = '';
    
    teams.forEach((team, index) => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';
        
        teamItem.innerHTML = `
            <div>
                <span class="team-rank">#${index + 1}</span>
                <span class="team-name">${team.teamName}</span>
            </div>
            <span class="team-points">${team.points} pts</span>
        `;
        
        adminTeamsList.appendChild(teamItem);
    });
}

function updateWinnerTeamSelect() {
    winnerTeamSelect.innerHTML = '<option value="">Select Winning Team</option>';
    
    teams.forEach(team => {
        const option = document.createElement('option');
        option.value = team.teamName;
        option.textContent = team.teamName;
        winnerTeamSelect.appendChild(option);
    });
}

// Product management functions
async function addProduct() {
    const name = productName.value.trim();
    const description = productDescription.value.trim();
    const baseMoneyPrice = parseInt(productBaseMoneyPrice.value);
    const pointValue = parseInt(productPointValue.value);
    const type = productType.value;
    const mystery = isMystery.checked;
    const image = productImage.files[0];
    
    if (!name || !description || !baseMoneyPrice || !pointValue || !image) {
        alert('Please fill all fields and select an image');
        return;
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
        const response = await fetch('/api/products', {
            method: 'POST',
            body: formData
        });
        
        if (response.ok) {
            productName.value = '';
            productDescription.value = '';
            productBaseMoneyPrice.value = '';
            productPointValue.value = '';
            productType.value = 'normal';
            isMystery.checked = false;
            productImage.value = '';
            loadProducts();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error adding product');
    }
}

async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            loadProducts();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error deleting product');
    }
}

async function loadProducts() {
    try {
        const response = await fetch('/api/products');
        products = await response.json();
        updateProductsList();
        updateProductSelect();
    } catch (error) {
        console.error('Error loading products:', error);
    }
}

function updateProductsList() {
    productsList.innerHTML = '';
    
    products.forEach(product => {
        const productItem = document.createElement('div');
        productItem.className = 'product-item';
        
        const statusClass = `status-${product.status}`;
        const typeIcon = product.productType === 'mystery-card' ? '🎴' : product.isMystery ? '🎁' : '';
        
        productItem.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}">
            <div class="product-details">
                <h4>${typeIcon} ${product.name}</h4>
                <p>${product.description}</p>
                <div>Money Price: ₹${product.baseMoneyPrice}</div>
                <div>Point Value: ${product.pointValue} points</div>
                <div>Type: ${product.productType}</div>
                <span class="product-status ${statusClass}">${product.status.toUpperCase()}</span>
                ${product.status === 'sold' ? `<div style="color: #4caf50; font-size: 0.9rem;">Winner: ${product.winnerTeam} (+${product.pointValue} points)</div>` : ''}
            </div>
            <div class="product-actions">
                <button class="edit-btn" onclick="editProduct('${product._id}')">Edit</button>
                <button class="delete-btn" onclick="deleteProduct('${product._id}')">Delete</button>
            </div>
        `;
        
        productsList.appendChild(productItem);
    });
}

function updateProductSelect() {
    productSelect.innerHTML = '<option value="">Select Product for Current Auction</option>';
    
    const availableProducts = products.filter(p => p.status === 'pending');
    availableProducts.forEach(product => {
        const option = document.createElement('option');
        option.value = product._id;
        option.textContent = `${product.name} (₹${product.baseMoneyPrice} - ${product.pointValue} pts)`;
        productSelect.appendChild(option);
    });
}

// Auction control functions
async function setCurrentProduct() {
    const productId = productSelect.value;
    
    if (!productId) {
        alert('Please select a product');
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${productId}/current`, {
            method: 'POST'
        });
        
        if (response.ok) {
            alert('Product set as current for auction');
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error setting current product');
    }
}

async function markProductSold() {
    const winnerTeam = winnerTeamSelect.value;
    
    if (!displayState || !displayState.currentProduct) {
        alert('No current product selected');
        return;
    }
    
    if (!winnerTeam) {
        alert('Please select a winning team');
        return;
    }
    
    try {
        const response = await fetch(`/api/products/${displayState.currentProduct._id}/sold`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ winnerTeam })
        });
        
        if (response.ok) {
            winnerTeamSelect.value = '';
            alert('Product marked as sold and points awarded');
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error marking product as sold');
    }
}

// Dashboard functions
function updateDashboard() {
    if (!displayState || !displayState.currentProduct) {
        noDashboard.classList.remove('hidden');
        activeDashboard.classList.add('hidden');
        return;
    }
    
    noDashboard.classList.add('hidden');
    activeDashboard.classList.remove('hidden');
    
    const product = displayState.currentProduct;
    dashProductImage.src = product.imageUrl;
    dashProductName.textContent = product.name;
    dashMoneyPrice.textContent = product.baseMoneyPrice;
    dashPointValue.textContent = product.pointValue;
}

// Event management
async function endEvent() {
    if (!confirm('Are you sure you want to end the event? This will determine the final winner.')) {
        return;
    }
    
    try {
        const response = await fetch('/api/event/end', {
            method: 'POST'
        });
        
        if (response.ok) {
            const data = await response.json();
            showEventResults(data);
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error ending event');
    }
}

function showEventResults(data) {
    eventResults.innerHTML = '';
    
    if (data.winner) {
        const winnerDiv = document.createElement('div');
        winnerDiv.innerHTML = `
            <h3 style="color: #ffd700; margin-bottom: 20px;">🏆 Event Winner: ${data.winner.teamName}</h3>
            <p style="font-size: 1.2rem; margin-bottom: 30px;">Total Points Earned: ${data.winner.points}</p>
        `;
        eventResults.appendChild(winnerDiv);
    }
    
    const rankingsDiv = document.createElement('div');
    rankingsDiv.innerHTML = '<h4 style="margin-bottom: 15px;">Final Rankings:</h4>';
    
    data.teams.forEach((team, index) => {
        const teamDiv = document.createElement('div');
        teamDiv.className = 'team-item';
        teamDiv.style.marginBottom = '10px';
        
        teamDiv.innerHTML = `
            <div>
                <span class="team-rank">#${index + 1}</span>
                <span class="team-name">${team.teamName}</span>
            </div>
            <span class="team-points">${team.points} pts</span>
        `;
        
        rankingsDiv.appendChild(teamDiv);
    });
    
    eventResults.appendChild(rankingsDiv);
    eventEndModal.classList.remove('hidden');
}

// Make functions global for onclick handlers
window.deleteTeam = deleteTeam;
window.deleteProduct = deleteProduct;
window.editProduct = editProduct;

// Showcase functions
async function startShowcase() {
    const duration = parseInt(showcaseDuration.value);
    
    try {
        const response = await fetch('/api/showcase/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ duration })
        });
        
        if (!response.ok) {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error starting showcase');
    }
}

function updateShowcaseStatus(state) {
    const minutes = Math.floor(state.timer / 60);
    const seconds = state.timer % 60;
    showcaseTimer.textContent = `Showcase active: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function updateShowcaseTimer(timer) {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    showcaseTimer.textContent = `Showcase active: ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// New functions for mystery and steal features
function updateStealTeamSelects() {
    stealingTeamSelect.innerHTML = '<option value="">Select Team with Steal Card</option>';
    stealTargetSelect.innerHTML = '<option value="">Select Target Team</option>';
    
    teams.forEach(team => {
        if (team.stealCards > 0) {
            const option = document.createElement('option');
            option.value = team.teamName;
            option.textContent = `${team.teamName} (${team.stealCards} cards)`;
            stealingTeamSelect.appendChild(option);
        }
        
        const targetOption = document.createElement('option');
        targetOption.value = team.teamName;
        targetOption.textContent = `${team.teamName} (${team.points} pts)`;
        stealTargetSelect.appendChild(targetOption);
    });
}

async function executeSteal() {
    const stealingTeam = stealingTeamSelect.value;
    const targetTeam = stealTargetSelect.value;
    const pointsToSteal = parseInt(stealPoints.value);
    
    if (!stealingTeam || !targetTeam || !pointsToSteal) {
        alert('Please fill all fields');
        return;
    }
    
    try {
        const response = await fetch('/api/steal-power', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ stealingTeam, targetTeam, pointsToSteal })
        });
        
        if (response.ok) {
            stealingTeamSelect.value = '';
            stealTargetSelect.value = '';
            stealPoints.value = '';
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error executing steal');
    }
}

async function editProduct(productId) {
    const product = products.find(p => p._id === productId);
    if (!product) return;
    
    // Fill form with current values
    productName.value = product.name;
    productDescription.value = product.description;
    productBaseMoneyPrice.value = product.baseMoneyPrice;
    productPointValue.value = product.pointValue;
    productType.value = product.productType || 'normal';
    isMystery.checked = product.isMystery || false;
    
    // Change button to update mode
    addProductBtn.textContent = 'UPDATE PRODUCT';
    addProductBtn.onclick = () => updateProduct(productId);
}

async function updateProduct(productId) {
    const name = productName.value.trim();
    const description = productDescription.value.trim();
    const baseMoneyPrice = parseInt(productBaseMoneyPrice.value);
    const pointValue = parseInt(productPointValue.value);
    const type = productType.value;
    const mystery = isMystery.checked;
    const image = productImage.files[0];
    
    if (!name || !description || !baseMoneyPrice || !pointValue) {
        alert('Please fill all required fields');
        return;
    }
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('baseMoneyPrice', baseMoneyPrice);
    formData.append('pointValue', pointValue);
    formData.append('productType', type);
    formData.append('isMystery', mystery);
    if (image) formData.append('image', image);
    
    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'PUT',
            body: formData
        });
        
        if (response.ok) {
            // Reset form
            productName.value = '';
            productDescription.value = '';
            productBaseMoneyPrice.value = '';
            productPointValue.value = '';
            productType.value = 'normal';
            isMystery.checked = false;
            productImage.value = '';
            
            // Reset button
            addProductBtn.textContent = 'ADD PRODUCT';
            addProductBtn.onclick = addProduct;
            
            loadProducts();
        } else {
            const error = await response.json();
            alert(error.error);
        }
    } catch (error) {
        alert('Error updating product');
    }
}