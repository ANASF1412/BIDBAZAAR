# BID BAZAAR - Updated System

## ✅ COMPLETED UPDATES

The Bid Bazaar project has been completely updated according to strict requirements.

### 🔧 TECH STACK
- **Backend**: Node.js + Express
- **Database**: MongoDB LOCAL ONLY (`mongodb://localhost:27017/bidbazaar`)
- **Real-time**: Socket.io for live updates between admin and display
- **No Authentication**: Removed all player login systems

### ❌ REMOVED FEATURES
- ✅ Player login system
- ✅ Player dashboard
- ✅ Player interaction with the system
- ✅ In-app bidding system
- ✅ Team login verification

### 🟡 SYSTEM STRUCTURE

#### Two Interfaces Only:

| Route | Used By | Purpose |
|-------|---------|---------|
| `/admin` | Admin Laptop | Full control panel |
| `/display` | Smart Board | Public auction display |

### 🧑‍💼 ADMIN PANEL FEATURES (`/admin`)

#### 1️⃣ Product Management
- Add product
- Edit product
- Delete product
- Product types: Normal, Mystery Product, Mystery Card
- Each product has: Name, Description, Image, Base Price, Points

#### 2️⃣ Team Management
- Add Team
- Remove Team
- View Total Points
- No duplicate team names

#### 3️⃣ Preview Mode
- Admin sets preview timer (seconds)
- Display shows ALL products
- Mystery products show "???"
- Countdown timer visible
- Auto-switches to Auction Mode after timer ends

#### 4️⃣ Auction Mode
- Admin selects products to go LIVE
- Live product highlighted on display
- Shows: Image, Name (hidden if mystery), Description, Base Price, Points

#### 5️⃣ Mark Product as SOLD
- Select winning team
- Click "MARK AS SOLD"
- System adds points to team
- Shows "SOLD TO: TEAM NAME" on display
- Updates leaderboard

#### 6️⃣ Leaderboard
- Live ranking by total points
- Button to show/hide on display

### 🎁 SPECIAL GAME FEATURES

#### 🔮 Mystery Product
- Display shows: "??? MYSTERY ITEM ???"
- Hides image, name, description
- After SOLD → reveals real details

#### 🃏 Mystery Card
- Special product type
- Allows admin to apply effects:
  - **Steal points** from another team
  - **Deduct points** from any team
  - **Double points** of last won product
- Admin selects effect manually in panel

### 🖥️ PUBLIC DISPLAY SCREEN (`/display`)

#### View Only - No Interaction

**During Preview Mode:**
- Grid of all products
- Countdown timer

**During Auction:**
- Only current LIVE product shown
- Large display with all details

**After Sold:**
- Winner team shown
- Points earned animation

**Leaderboard Mode:**
- Team rankings by points
- Mystery card count displayed

### ⚙️ REAL-TIME FEATURES

Socket.io ensures:
- ✅ Product add/edit → display updates instantly
- ✅ Preview starts → display switches
- ✅ Product goes live → display changes
- ✅ Product sold → leaderboard updates live
- ✅ Timer countdown synced across all screens

### 🎯 SYSTEM BEHAVIOR

✔ Players never use the system
✔ Admin controls everything
✔ Smart board shows only visuals
✔ Points decide the winner
✔ Runs entirely using local MongoDB

### 📦 INSTALLATION

```bash
# Install dependencies
npm install

# Start MongoDB (ensure it's running on localhost:27017)
# Windows:
net start MongoDB

# Start the application
npm start
```

### 🌐 ACCESS URLS

- **Admin Panel**: `http://localhost:3000/admin`
- **Display Screen**: `http://localhost:3000/display`
- **Root**: Redirects to `/admin`

### 📁 UPDATED FILES

- `server.js` - Complete backend with Socket.io
- `models/index.js` - Simplified schemas (removed productsWon, isMystery)
- `public/admin.html` - Complete admin panel with inline JS
- `public/display.html` - Complete display screen with inline JS

### 🚀 HOW TO USE

1. **Start Server**: `npm start`
2. **Open Admin Panel**: Browser → `http://localhost:3000/admin`
3. **Open Display Screen**: Smart Board → `http://localhost:3000/display`
4. **Add Teams**: Use admin panel
5. **Add Products**: Upload products with images
6. **Start Preview**: Set timer and click "Start Preview Mode"
7. **Run Auction**: Set products as LIVE one by one
8. **Mark as Sold**: Select winner team and mark sold
9. **Show Leaderboard**: Toggle leaderboard on display
10. **Apply Mystery Cards**: Use mystery card actions panel

### 🔄 WORKFLOW

```
Preview Mode (120s timer)
    ↓
Auction Mode (Admin sets product LIVE)
    ↓
Offline Bidding (Physical auction)
    ↓
Mark as SOLD (Admin selects winner)
    ↓
Points Added to Team
    ↓
Leaderboard Updates
    ↓
Next Product...
```

### ✨ KEY IMPROVEMENTS

1. **Simplified Architecture**: Only 2 interfaces (admin + display)
2. **No Authentication**: Direct access to admin panel
3. **Real-time Updates**: Socket.io for instant synchronization
4. **Mystery Features**: Mystery products and mystery cards
5. **Preview Mode**: Timed product showcase before auction
6. **Clean Code**: Inline JavaScript, no external dependencies
7. **Local MongoDB**: No cloud dependencies

---

**Built for Sri Eshwar College of Engineering** 🎓

System ready for live auction events! 🎉
