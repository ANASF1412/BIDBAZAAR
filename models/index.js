const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  teamName: { type: String, required: true, unique: true },
  points: { type: Number, required: true, default: 0 },
  mysteryCards: { type: Number, default: 0 },
  productsWon: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  createdAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  imageUrl: { type: String, required: true },
  baseMoneyPrice: { type: Number, required: true },
  pointValue: { type: Number, required: true },
  status: { type: String, enum: ['pending', 'current', 'sold'], default: 'pending' },
  winnerTeam: { type: String, default: null },
  isMystery: { type: Boolean, default: false },
  productType: { type: String, enum: ['normal', 'mystery', 'mystery-card'], default: 'normal' },
  createdAt: { type: Date, default: Date.now }
});



module.exports = {
  Team: mongoose.model('Team', teamSchema),
  Product: mongoose.model('Product', productSchema)
};