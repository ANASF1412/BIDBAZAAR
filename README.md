# 🏆 Bid Bazaar - Physical Auction Scoreboard System

A real-time scoreboard web application built for Sri Eshwar College of Engineering live events where student teams earn points from products won in physical auctions.

## 🚀 Features

### Admin Panel
- **Team Management**: Create teams dynamically with unique names (start with 0 points)
- **Product Management**: Upload products with images, descriptions, money prices, and point values
- **Auction Control**: Set current product for physical auction and mark products as sold
- **Live Dashboard**: Monitor current product being auctioned
- **Event Management**: End events and determine winners

### Participant Interface (Scoreboard View)
- **Team Login**: Join with team name verification
- **Live Monitoring**: View current product, point values, and auction status
- **Sold Products**: See recently sold products and winners
- **Team Rankings**: Live leaderboard showing all teams and their earned points

### Display Screen (Big Screen for Event)
- **Current Product Display**: Large view of product being auctioned with prices
- **All Products Grid**: Overview of all products with status (pending/current/sold)
- **Live Updates**: Real-time status changes during physical auction

### Real-Time Features
- Live product status updates across all connected clients
- Instant team points updates when products are sold
- Real-time leaderboard updates
- Synchronized display across participant and big screen views

## 🎯 System Concept

This platform is used during a live physical auction event:

* **Physical Auction**: Bidding happens offline by voice with an auctioneer
* **Point Earning System**: Teams earn points when they win products (no spending/deduction)
* **Admin Control**: Admin sets current product and marks winners after each auction
* **Live Scoreboard**: All screens show real-time updates of current product and team standings
* **Winner Determination**: Team with **highest total points earned** wins the event

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Real-time**: Socket.IO
- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **File Upload**: Multer

## 📋 Prerequisites

Before running the application, ensure you have:

1. **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
2. **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)

## 🔧 Installation & Setup

### 1. Clone/Download the Project
```bash
# If using git
git clone <repository-url>
cd bid-bazaar

# Or extract the downloaded ZIP file
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start MongoDB
Make sure MongoDB is running on your system:

**Windows:**
```bash
# Start MongoDB service
net start MongoDB

# Or run mongod directly
mongod --dbpath "C:\data\db"
```

**macOS/Linux:**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or run mongod directly
mongod --dbpath /data/db
```

### 4. Start the Application
```bash
# For development (with auto-restart)
npm run dev

# For production
npm start
```

The server will start on `http://localhost:3000`

## 🌐 Access URLs

- **Participant Scoreboard**: `http://localhost:3000`
- **Admin Panel**: `http://localhost:3000/admin`
- **Display Screen (Big Screen)**: `http://localhost:3000/display`

## 📖 Usage Guide

### For Administrators

1. **Access Admin Panel**: Navigate to `http://localhost:3000/admin`

2. **Create Teams**:
   - Enter team name
   - Click "ADD TEAM"
   - Teams start with 0 points and must have unique names

3. **Add Products**:
   - Fill in product details (name, description, money price, point value)
   - Upload product image
   - Click "ADD PRODUCT"

4. **Control Physical Auction**:
   - Select a product from dropdown
   - Click "SET AS CURRENT PRODUCT" to display on screens
   - Conduct physical auction offline
   - Select winning team from dropdown
   - Click "MARK AS SOLD" to award points

5. **Monitor Event**:
   - View live dashboard with current product
   - See team leaderboard with earned points
   - Use display screen (`/display`) for big screen view

6. **End Event**:
   - Click "END EVENT" to determine final winner
   - View complete rankings based on total points earned

### For Participants

1. **Join Scoreboard**: 
   - Navigate to `http://localhost:3000`
   - Enter your team name (must match admin-created team)
   - Click "JOIN AUCTION"

2. **Monitor Physical Auction**:
   - View current product being auctioned with money price and point value
   - See "LIVE AUCTION (OFFLINE)" status during physical bidding
   - Watch real-time updates when products are sold

3. **Track Progress**:
   - Check your team's earned points
   - View recently sold products and winners
   - Monitor team rankings (sorted by points earned)

### For Display Screen (Big Screen)

1. **Setup Display**: Navigate to `http://localhost:3000/display`
2. **During Event**: Shows current product being auctioned with large images and prices
3. **Product Overview**: Displays all products with status (pending/current/sold)
4. **Live Updates**: Automatically updates when admin changes current product or marks items sold

## 🎯 Auction Rules

1. **Physical Auction Process**:
   - Bidding happens offline with auctioneer
   - Admin sets current product on all screens
   - Teams bid verbally during physical auction
   - Admin selects winner and marks product as sold

2. **Point System**:
   - Teams start with 0 points
   - Points are EARNED when winning products (not spent)
   - Each product has a fixed point value
   - Winning team gets points added to their total

3. **Winner Determination**:
   - Team with highest total points earned wins the event
   - Real-time leaderboard shows current standings
   - Final rankings displayed at event end

## 📁 Project Structure

```
bid-bazaar/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── models/
│   └── index.js           # MongoDB schemas
├── public/
│   ├── index.html         # Participant interface
│   ├── admin.html         # Admin panel
│   ├── styles.css         # Styling
│   ├── script.js          # Participant JavaScript
│   └── admin.js           # Admin JavaScript
└── uploads/               # Product images storage
```

## 🎨 Design Theme

The application uses a professional dark navy and gold color scheme:
- **Primary**: Dark Navy (#1a1a2e, #16213e)
- **Accent**: Gold (#ffd700, #ffed4e)
- **Secondary**: Teal (#4ecdc4)
- **Alert**: Red (#ff6b6b)

## 🔒 Security Features

- Server-side bid validation
- Team name uniqueness enforcement
- Points balance verification
- Input sanitization and validation

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**:
   - Ensure MongoDB is running
   - Check connection string in server.js
   - Verify MongoDB service status

2. **Port Already in Use**:
   - Change PORT in server.js or set environment variable
   - Kill existing processes on port 3000

3. **File Upload Issues**:
   - Check uploads/ directory exists
   - Verify file permissions
   - Ensure image file formats are supported

4. **Socket.IO Connection Issues**:
   - Check firewall settings
   - Verify network connectivity
   - Clear browser cache

### Development Tips

- Use browser developer tools to monitor Socket.IO events
- Check server console for error messages
- MongoDB Compass can help visualize database contents
- Use nodemon for automatic server restarts during development

## 📞 Support

For technical issues or questions:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed correctly
3. Ensure MongoDB is running and accessible
4. Check server console for error messages

## 🏆 Event Winner Logic

The system determines the winner based on:
- Team with the **highest remaining points** at event end
- Real-time point deduction for successful bids
- Transparent leaderboard throughout the event

---

**Built for Sri Eshwar College of Engineering** 🎓

Enjoy your auction event! 🎉