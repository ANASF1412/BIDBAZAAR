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

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads'));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

mongoose.connect('mongodb://localhost:27017/bidbazaar')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

let previewState = { isActive: false, duration: 0, timer: 0 };
let previewInterval = null;
let showLeaderboard = false;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.emit('initialState', { previewState, showLeaderboard });
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.get('/api/teams', async (req, res) => {
  try {
    const teams = await Team.find().sort({ points: -1 });
    res.json(teams);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/teams', async (req, res) => {
  try {
    const { teamName } = req.body;
    const team = new Team({ teamName, points: 0 });
    await team.save();
    const teams = await Team.find().sort({ points: -1 });
    io.emit('teamsUpdate', teams);
    res.json(team);
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ error: 'Team name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

app.delete('/api/teams/:teamName', async (req, res) => {
  try {
    await Team.findOneAndDelete({ teamName: req.params.teamName });
    const teams = await Team.find().sort({ points: -1 });
    io.emit('teamsUpdate', teams);
    res.json({ message: 'Team deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', upload.single('image'), async (req, res) => {
  try {
    const { name, description, baseMoneyPrice, pointValue, productType } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '/uploads/mystery-box.jpg';
    
    const product = new Product({
      name,
      description,
      baseMoneyPrice: parseInt(baseMoneyPrice),
      pointValue: parseInt(pointValue),
      productType: productType || 'normal',
      imageUrl
    });
    
    await product.save();
    const products = await Product.find().sort({ createdAt: -1 });
    io.emit('productsUpdate', products);
    res.json(product);
  } catch (err) {
    console.error('PRODUCT CREATE ERROR:', err);
    res.status(500).json({ error: 'Failed to add product', details: err.message });
  }
});

app.put('/api/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, description, baseMoneyPrice, pointValue, productType } = req.body;
    
    const updateData = {
      name,
      description,
      baseMoneyPrice: parseInt(baseMoneyPrice),
      pointValue: parseInt(pointValue),
      productType: productType || 'normal'
    };
    
    if (req.file) updateData.imageUrl = `/uploads/${req.file.filename}`;
    
    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const products = await Product.find().sort({ createdAt: -1 });
    io.emit('productsUpdate', products);
    res.json(product);
  } catch (err) {
    console.error('PRODUCT UPDATE ERROR:', err);
    res.status(500).json({ error: 'Failed to update product', details: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    const products = await Product.find().sort({ createdAt: -1 });
    io.emit('productsUpdate', products);
    res.json({ message: 'Product deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/:id/live', async (req, res) => {
  try {
    await Product.updateMany({}, { status: 'pending' });
    const product = await Product.findByIdAndUpdate(req.params.id, { status: 'current' }, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    io.emit('productLive', product);
    res.json({ message: 'Product is now live' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/:id/sold', async (req, res) => {
  try {
    const { winnerTeam } = req.body;
    
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    
    const team = await Team.findOne({ teamName: winnerTeam });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    
    product.status = 'sold';
    product.winnerTeam = winnerTeam;
    await product.save();
    
    if (product.productType === 'mystery-card') {
      team.mysteryCards = (team.mysteryCards || 0) + 1;
      await team.save();
      io.emit('mysteryCardAwarded', { teamName: winnerTeam, product });
    } else {
      team.points += product.pointValue;
      await team.save();
    }
    
    const teams = await Team.find().sort({ points: -1 });
    io.emit('productSold', { product, winnerTeam });
    io.emit('teamsUpdate', teams);
    res.json({ message: 'Product sold' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/mystery-effect', async (req, res) => {
  try {
    const { ownerTeam, effect, targetTeam, points } = req.body;
    
    const owner = await Team.findOne({ teamName: ownerTeam });
    if (!owner || owner.mysteryCards <= 0) {
      return res.status(400).json({ error: 'No mystery cards available' });
    }
    
    owner.mysteryCards -= 1;
    await owner.save();
    
    if (effect === 'steal' && targetTeam) {
      const target = await Team.findOne({ teamName: targetTeam });
      if (target && target.points >= points) {
        target.points -= points;
        owner.points += points;
        await target.save();
        await owner.save();
      }
    } else if (effect === 'deduct' && targetTeam) {
      const target = await Team.findOne({ teamName: targetTeam });
      if (target) {
        target.points = Math.max(0, target.points - points);
        await target.save();
      }
    } else if (effect === 'double') {
      owner.points += points;
      await owner.save();
    }
    
    const teams = await Team.find().sort({ points: -1 });
    io.emit('mysteryEffectApplied', { ownerTeam, effect, targetTeam, points });
    io.emit('teamsUpdate', teams);
    res.json({ message: 'Mystery effect applied' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/preview/start', async (req, res) => {
  try {
    const { duration } = req.body;
    
    previewState = {
      isActive: true,
      duration: parseInt(duration),
      timer: parseInt(duration)
    };
    
    const products = await Product.find().sort({ createdAt: -1 });
    io.emit('previewStarted', { previewState, products });
    
    if (previewInterval) clearInterval(previewInterval);
    previewInterval = setInterval(async () => {
      previewState.timer--;
      io.emit('previewTimerUpdate', previewState.timer);
      
      if (previewState.timer <= 0) {
        clearInterval(previewInterval);
        previewState.isActive = false;
        io.emit('previewEnded');
      }
    }, 1000);
    
    res.json({ message: 'Preview started' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/display/leaderboard', async (req, res) => {
  try {
    showLeaderboard = req.body.show;
    const teams = await Team.find().sort({ points: -1 });
    io.emit('leaderboardToggle', { show: showLeaderboard, teams });
    res.json({ message: 'Leaderboard toggled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.get('/display', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'display.html'));
});

app.get('/', (req, res) => {
  res.redirect('/admin');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`Display Screen: http://localhost:${PORT}/display`);
});
