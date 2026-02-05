// Socket.IO connection
const socket = io();

// DOM elements
const loginScreen = document.getElementById('loginScreen');
const scoreboardScreen = document.getElementById('scoreboardScreen');
const showcaseScreen = document.getElementById('showcaseScreen');
const endScreen = document.getElementById('endScreen');

const teamNameInput = document.getElementById('teamNameInput');
const joinBtn = document.getElementById('joinBtn');
const loginError = document.getElementById('loginError');

const teamNameDisplay = document.getElementById('teamName');
const teamPointsDisplay = document.getElementById('teamPoints');
const status = document.getElementById('status');

const noCurrentProduct = document.getElementById('noCurrentProduct');
const currentProduct = document.getElementById('currentProduct');
const productImage = document.getElementById('productImage');
const productName = document.getElementById('productName');
const productDescription = document.getElementById('productDescription');
const baseMoneyPrice = document.getElementById('baseMoneyPrice');
const pointValue = document.getElementById('pointValue');

const soldProductsList = document.getElementById('soldProductsList');
const teamsList = document.getElementById('teamsList');

// Showcase elements
const showcaseCountdown = document.getElementById('showcaseCountdown');
const showcaseGrid = document.getElementById('showcaseGrid');

// Global state
let currentTeam = null;
let displayState = null;

// Event listeners
joinBtn.addEventListener('click', joinAuction);
teamNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') joinAuction();
});

// Socket event listeners
socket.on('displayUpdate', (state) => {
    displayState = state;
    updateDisplay();
});

socket.on('teamsUpdate', (teams) => {
    updateTeamsList(teams);
    updateCurrentTeamPoints(teams);
});

socket.on('eventEnded', (data) => {
    showEventEnd(data);
});

socket.on('showcaseStarted', (state) => {
    showShowcase(state);
});

socket.on('showcaseTimerUpdate', (timer) => {
    updateShowcaseTimer(timer);
});

socket.on('showcaseEnded', () => {
    hideShowcase();
});

// Functions
async function joinAuction() {
    const teamName = teamNameInput.value.trim();
    
    if (!teamName) {
        showLoginError('Please enter a team name');
        return;
    }
    
    try {
        const response = await fetch(`/api/teams/${encodeURIComponent(teamName)}`);
        
        if (response.ok) {
            const team = await response.json();
            currentTeam = team;
            
            teamNameDisplay.textContent = team.teamName;
            teamPointsDisplay.textContent = team.points;
            
            loginScreen.classList.add('hidden');
            scoreboardScreen.classList.remove('hidden');
            
            // Load initial data
            loadDisplayState();
            
        } else {
            const error = await response.json();
            showLoginError(error.error || 'Team not found');
        }
    } catch (error) {
        showLoginError('Connection error. Please try again.');
    }
}

function showLoginError(message) {
    loginError.textContent = message;
    setTimeout(() => {
        loginError.textContent = '';
    }, 3000);
}

function updateDisplay() {
    if (!displayState) return;
    
    // Update current product
    if (displayState.currentProduct) {
        noCurrentProduct.classList.add('hidden');
        currentProduct.classList.remove('hidden');
        
        const product = displayState.currentProduct;
        productImage.src = product.imageUrl;
        productName.textContent = product.name;
        productDescription.textContent = product.description;
        baseMoneyPrice.textContent = product.baseMoneyPrice;
        pointValue.textContent = product.pointValue;
        
        status.textContent = 'Physical Auction in Progress';
    } else {
        noCurrentProduct.classList.remove('hidden');
        currentProduct.classList.add('hidden');
        status.textContent = 'Waiting for next product...';
    }
    
    // Update sold products
    updateSoldProducts();
}

function updateSoldProducts() {
    if (!displayState) return;
    
    soldProductsList.innerHTML = '';
    
    const soldProducts = displayState.allProducts.filter(p => p.status === 'sold');
    
    if (soldProducts.length === 0) {
        soldProductsList.innerHTML = '<p style="color: #cccccc; text-align: center;">No products sold yet</p>';
        return;
    }
    
    soldProducts.slice(-5).reverse().forEach(product => {
        const soldItem = document.createElement('div');
        soldItem.className = 'sold-item';
        
        soldItem.innerHTML = `
            <img src="${product.imageUrl}" alt="${product.name}" class="sold-image">
            <div class="sold-info">
                <h4>${product.name}</h4>
                <div class="sold-details">
                    <span class="winner">Winner: ${product.winnerTeam}</span>
                    <span class="points">+${product.pointValue} points</span>
                </div>
            </div>
        `;
        
        soldProductsList.appendChild(soldItem);
    });
}

async function loadDisplayState() {
    try {
        const response = await fetch('/api/display/state');
        const state = await response.json();
        displayState = state;
        updateDisplay();
        updateTeamsList(state.teams);
    } catch (error) {
        console.error('Error loading display state:', error);
    }
}

function updateTeamsList(teams) {
    teamsList.innerHTML = '';
    
    teams.forEach((team, index) => {
        const teamItem = document.createElement('div');
        teamItem.className = 'team-item';
        
        if (currentTeam && team.teamName === currentTeam.teamName) {
            teamItem.classList.add('current-team');
        }
        
        teamItem.innerHTML = `
            <div>
                <span class="team-rank">#${index + 1}</span>
                <span class="team-name">${team.teamName}</span>
            </div>
            <span class="team-points">${team.points} pts</span>
        `;
        
        teamsList.appendChild(teamItem);
    });
}

function updateCurrentTeamPoints(teams) {
    if (!currentTeam) return;
    
    const updatedTeam = teams.find(team => team.teamName === currentTeam.teamName);
    if (updatedTeam) {
        currentTeam.points = updatedTeam.points;
        teamPointsDisplay.textContent = updatedTeam.points;
    }
}

function showEventEnd(data) {
    scoreboardScreen.classList.add('hidden');
    endScreen.classList.remove('hidden');
    
    const winnerInfo = document.getElementById('winnerInfo');
    const finalRankings = document.getElementById('finalRankings');
    
    if (data.winner) {
        winnerInfo.innerHTML = `
            <h2>🏆 Winner: ${data.winner.teamName}</h2>
            <p>Total Points Earned: ${data.winner.points}</p>
        `;
    }
    
    finalRankings.innerHTML = '<h3>Final Rankings:</h3>';
    data.teams.forEach((team, index) => {
        const rankItem = document.createElement('div');
        rankItem.className = 'team-item';
        if (currentTeam && team.teamName === currentTeam.teamName) {
            rankItem.classList.add('current-team');
        }
        
        rankItem.innerHTML = `
            <div>
                <span class="team-rank">#${index + 1}</span>
                <span class="team-name">${team.teamName}</span>
            </div>
            <span class="team-points">${team.points} pts</span>
        `;
        
        finalRankings.appendChild(rankItem);
    });
}

// Add CSS for sold products
const style = document.createElement('style');
style.textContent = `
    .sold-products {
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(255, 215, 0, 0.3);
    }
    
    .sold-products h3 {
        color: #ffd700;
        margin-bottom: 15px;
    }
    
    .sold-item {
        display: flex;
        gap: 15px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        margin-bottom: 10px;
        border: 1px solid rgba(255, 215, 0, 0.2);
    }
    
    .sold-image {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 6px;
    }
    
    .sold-info h4 {
        color: #ffd700;
        margin-bottom: 5px;
        font-size: 0.9rem;
    }
    
    .sold-details {
        display: flex;
        flex-direction: column;
        gap: 3px;
    }
    
    .winner {
        color: #4ecdc4;
        font-size: 0.8rem;
    }
    
    .points {
        color: #ffd700;
        font-weight: bold;
        font-size: 0.8rem;
    }
    
    .point-value {
        font-size: 1.3rem;
        font-weight: bold;
        color: #ffd700;
        margin: 10px 0;
    }
    
    .auction-notice {
        background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
        color: white;
        padding: 8px 15px;
        border-radius: 20px;
        font-weight: bold;
        text-align: center;
        margin-top: 15px;
        animation: pulse 2s infinite;
    }
    
    .showcase-header {
        text-align: center;
        padding: 30px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        margin-bottom: 30px;
        border: 1px solid rgba(255, 215, 0, 0.3);
    }
    
    .showcase-header h1 {
        color: #ffd700;
        font-size: 2.5rem;
        margin-bottom: 20px;
    }
    
    .showcase-timer {
        font-size: 1.5rem;
        color: #ff6b6b;
        font-weight: bold;
    }
    
    .showcase-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
        padding: 20px;
    }
    
    .showcase-card {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border-radius: 15px;
        padding: 20px;
        border: 1px solid rgba(255, 215, 0, 0.3);
        text-align: center;
    }
    
    .showcase-image {
        width: 100%;
        height: 200px;
        object-fit: cover;
        border-radius: 10px;
        margin-bottom: 15px;
    }
    
    .showcase-card h3 {
        color: #ffd700;
        margin-bottom: 10px;
    }
    
    .showcase-card p {
        color: #cccccc;
        margin-bottom: 15px;
        font-size: 0.9rem;
    }
    
    .showcase-prices {
        display: flex;
        justify-content: space-between;
        margin-top: 15px;
    }
    
    .showcase-money {
        color: #cccccc;
    }
    
    .showcase-points {
        color: #ffd700;
        font-weight: bold;
        font-size: 1.1rem;
    }
`;
document.head.appendChild(style);

// Showcase functions
function showShowcase(state) {
    scoreboardScreen.classList.add('hidden');
    showcaseScreen.classList.remove('hidden');
    
    updateShowcaseTimer(state.timer);
    loadShowcaseProducts();
}

function hideShowcase() {
    showcaseScreen.classList.add('hidden');
    scoreboardScreen.classList.remove('hidden');
}

function updateShowcaseTimer(timer) {
    const minutes = Math.floor(timer / 60);
    const seconds = timer % 60;
    showcaseCountdown.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function loadShowcaseProducts() {
    if (!displayState || !displayState.allProducts) return;
    
    showcaseGrid.innerHTML = '';
    
    displayState.allProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'showcase-card';
        
        // Show mystery box for mystery products
        const showMystery = product.isMystery || product.productType === 'mystery';
        const displayName = showMystery ? 'Mystery Item 🎁' : product.name;
        const displayDesc = showMystery ? 'This could be amazing… or absolutely nothing.' : product.description;
        const displayImage = showMystery ? '/uploads/mystery-box.jpg' : product.imageUrl;
        
        // Special display for mystery cards
        if (product.productType === 'mystery-card') {
            card.innerHTML = `
                <img src="${displayImage}" alt="Mystery Card" class="showcase-image">
                <h3>🎴 Mystery Card</h3>
                <p>Win this to steal points from other teams!</p>
                <div class="showcase-prices">
                    <div class="showcase-money">₹${product.baseMoneyPrice}</div>
                    <div class="showcase-points">${product.pointValue} points</div>
                </div>
            `;
        } else {
            card.innerHTML = `
                <img src="${displayImage}" alt="${displayName}" class="showcase-image">
                <h3>${displayName}</h3>
                <p>${displayDesc}</p>
                <div class="showcase-prices">
                    <div class="showcase-money">₹${product.baseMoneyPrice}</div>
                    <div class="showcase-points">${product.pointValue} points</div>
                </div>
            `;
        }
        
        showcaseGrid.appendChild(card);
    });
}