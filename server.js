const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const multer = require('multer');
const path = require('path');
const { Team, Product } = require('./models');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));
// Remove default static serving to prevent index.html from overriding routes

// File upload configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/bidbazaar')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Global display state
let displayState = {
  currentProduct: null,
  allProducts: [],
  teams: []
};

// Showcase state
let showcaseState = {
  isActive: false,
  duration: 0,
  timer: 0
};

let showcaseInterval = null;

// Admin session
let isAdminLoggedIn = false;

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Send current display state to new connections
  socket.emit('displayUpdate', displayState);
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// TEAM MANAGEMENT ROUTES

// Get all teams
app.get('/api/teams', async (req, res) => {
  try {
    const teams = await Team.find().sort({ points: -1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create team
app.post('/api/teams', async (req, res) => {
  try {
    const { teamName } = req.body;
    const team = new Team({ teamName, points: 0 });
    await team.save();
    
    await updateDisplayState();
    
    res.json(team);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Team name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete team
app.delete('/api/teams/:teamName', async (req, res) => {
  try {
    const { teamName } = req.params;
    await Team.findOneAndDelete({ teamName });
    
    await updateDisplayState();
    
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify team exists
app.get('/api/teams/:teamName', async (req, res) => {
  try {
    const team = await Team.findOne({ teamName: req.params.teamName });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    res.json(team);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PRODUCT MANAGEMENT ROUTES

// Get all products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add product
app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, description, baseMoneyPrice, pointValue, isMystery, productType } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    
    const product = new Product({
      name,
      description,
      baseMoneyPrice: parseInt(baseMoneyPrice),
      pointValue: parseInt(pointValue),
      isMystery: isMystery === 'true',
      productType: productType || 'normal',
      imageUrl
    });
    
    await product.save();
    await updateDisplayState();
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    await updateDisplayState();
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Edit product
app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, baseMoneyPrice, pointValue, isMystery, productType } = req.body;
    
    const updateData = {
      name,
      description,
      baseMoneyPrice: parseInt(baseMoneyPrice),
      pointValue: parseInt(pointValue),
      isMystery: isMystery === 'true',
      productType: productType || 'normal'
    };
    
    if (req.file) {
      updateData.imageUrl = `/uploads/${req.file.filename}`;
    }
    
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await updateDisplayState();
    io.emit('productUpdated', product);
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set current product for auction
app.post('/api/products/:id/current', async (req, res) => {
  try {
    // Reset all products to pending
    await Product.updateMany({}, { status: 'pending' });
    
    // Set selected product as current
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { status: 'current' },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    await updateDisplayState();
    
    res.json({ message: 'Product set as current' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark product as sold
app.post('/api/products/:id/sold', async (req, res) => {
  try {
    const { winnerTeam } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const team = await Team.findOne({ teamName: winnerTeam });
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    // Update product as sold
    product.status = 'sold';
    product.winnerTeam = winnerTeam;
    await product.save();
    
    // Handle different product types
    if (product.productType === 'mystery-card') {
      // Award steal card instead of points
      team.stealCards += 1;
      await team.save();
      
      io.emit('stealPowerAwarded', { teamName: winnerTeam, product });
    } else {
      // Add points to winning team
      team.points += product.pointValue;
      team.productsWon.push(product._id);
      await team.save();
    }
    
    // Reveal mystery product if applicable
    if (product.isMystery || product.productType === 'mystery') {
      io.emit('mysteryRevealed', { product, winnerTeam });
    }
    
    await updateDisplayState();
    
    res.json({ message: 'Product marked as sold and rewards awarded' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get display state
app.get('/api/display/state', (req, res) => {
  res.json(displayState);
});

// Start showcase mode
app.post('/api/showcase/start', async (req, res) => {
  try {
    const { duration } = req.body; // duration in seconds
    
    showcaseState = {
      isActive: true,
      duration: parseInt(duration),
      timer: parseInt(duration)
    };
    
    io.emit('showcaseStarted', showcaseState);
    
    // Start countdown
    if (showcaseInterval) clearInterval(showcaseInterval);
    showcaseInterval = setInterval(() => {
      showcaseState.timer--;
      io.emit('showcaseTimerUpdate', showcaseState.timer);
      
      if (showcaseState.timer <= 0) {
        endShowcase();
      }
    }, 1000);
    
    res.json({ message: 'Showcase started successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get showcase state
app.get('/api/showcase/state', (req, res) => {
  res.json(showcaseState);
});

// Use steal power
app.post('/api/steal-power', async (req, res) => {
  try {
    const { stealingTeam, targetTeam, pointsToSteal } = req.body;
    
    const stealer = await Team.findOne({ teamName: stealingTeam });
    const target = await Team.findOne({ teamName: targetTeam });
    
    if (!stealer || !target) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    if (stealer.stealCards <= 0) {
      return res.status(400).json({ error: 'No steal cards available' });
    }
    
    if (target.points < pointsToSteal) {
      return res.status(400).json({ error: 'Target team does not have enough points' });
    }
    
    if (stealingTeam === targetTeam) {
      return res.status(400).json({ error: 'Cannot steal from own team' });
    }
    
    // Execute steal
    stealer.points += pointsToSteal;
    stealer.stealCards -= 1;
    target.points -= pointsToSteal;
    
    await stealer.save();
    await target.save();
    
    await updateDisplayState();
    
    io.emit('pointsStolen', {
      stealingTeam,
      targetTeam,
      pointsStolen: pointsToSteal
    });
    
    res.json({ message: 'Points stolen successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// End event and determine winner
app.post('/api/event/end', async (req, res) => {
  try {
    const teams = await Team.find().sort({ points: -1 });
    const winner = teams[0];
    
    io.emit('eventEnded', { winner, teams });
    res.json({ winner, teams });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to update display state
async function updateDisplayState() {
  try {
    const teams = await Team.find().sort({ points: -1 });
    const products = await Product.find().sort({ createdAt: 1 });
    const currentProduct = products.find(p => p.status === 'current');
    
    displayState = {
      currentProduct,
      allProducts: products,
      teams
    };
    
    io.emit('displayUpdate', displayState);
    io.emit('teamsUpdate', teams);
  } catch (error) {
    console.error('Error updating display state:', error);
  }
}

// Helper function to end showcase
function endShowcase() {
  if (showcaseInterval) {
    clearInterval(showcaseInterval);
    showcaseInterval = null;
  }
  
  showcaseState = {
    isActive: false,
    duration: 0,
    timer: 0
  };
  
  io.emit('showcaseEnded');
}

// Serve static files for specific paths only
app.use('/css', express.static(path.join(__dirname, 'public')));
app.use('/js', express.static(path.join(__dirname, 'public')));
app.use('/styles.css', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'styles.css'));
});
app.use('/admin.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.js'));
});
app.use('/script.js', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'script.js'));
});
app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
app.get('/admin-login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// Serve HTML files - MUST BE AT THE END
app.get('/player', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

app.post('/admin-login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin@csbs' && password === 'bidbazar@2026') {
    isAdminLoggedIn = true;
    res.redirect('/admin-panel');
  } else {
    res.redirect('/admin?error=1');
  }
});

app.get('/admin-panel', (req, res) => {
  if (!isAdminLoggedIn) {
    return res.redirect('/admin');
  }
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

// ROOT ROUTE - MUST BE LAST
app.get('/', (req, res) => {
  console.log('Serving mode.html for root route');
  res.sendFile(path.join(__dirname, 'public', 'mode.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Landing page: http://localhost:${PORT}`);
  console.log(`Player mode: http://localhost:${PORT}/player`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});