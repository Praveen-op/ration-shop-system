// ═══════════════════════════════════════════════════════════════
//  TNCS RATION SHOP — server.js
//  Stack : Node.js · Express · MongoDB (Mongoose)
//  Start : npm install  →  node server.js
//         or for dev:  npm run dev
// ═══════════════════════════════════════════════════════════════

require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const bodyParser = require('body-parser');
const path       = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.json());

// Serve frontend from /public
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── MongoDB ───────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/rationshop';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅  MongoDB connected →', MONGO_URI);
    seedDatabase();
  })
  .catch(err => console.error('❌  MongoDB error:', err));

// ═══════════════════════════════════════════════════════════════
//  SCHEMAS & MODELS
// ═══════════════════════════════════════════════════════════════

const familySchema = new mongoose.Schema({ name: String, age: Number });

const userSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  category:  { type: String, enum: ['APL','BPL','PHH'], required: true },
  rationNo:  { type: String, required: true, unique: true },   // digits only
  mobile:    { type: String, required: true },
  district:  { type: String, default: 'Salem' },
  address:   { type: String, default: '' },   // default delivery address
  shopCode:  { type: String, default: '' },   // takeaway shop code
  family:    [familySchema],
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const productSchema = new mongoose.Schema({
  name:   { type: String, required: true },
  icon:   { type: String, default: '📦' },
  unit:   { type: String, default: 'per kg' },
  price:  { type: Number, required: true },
  quota:  String,
  maxQty: { type: Number, default: 10 },
  stock:  { type: Number, default: 1000 },
  active: { type: Boolean, default: true }
});
const Product = mongoose.model('Product', productSchema);

const orderItemSchema = new mongoose.Schema({
  productId: mongoose.Schema.Types.ObjectId,
  name: String, qty: Number, price: Number
});

const orderSchema = new mongoose.Schema({
  orderId:       { type: String, unique: true },
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rationNo:      String,
  items:         [orderItemSchema],
  total:         Number,
  deliveryType:  { type: String, enum: ['home','takeaway'], default: 'home' },
  deliveryAddr:  String,
  shopCode:      String,
  paymentMethod: { type: String, default: 'Cash' },
  status: {
    type: String,
    enum: ['Pending','Confirmed','Ready','Delivered','Cancelled'],
    default: 'Pending'
  },
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', orderSchema);

// ═══════════════════════════════════════════════════════════════
//  SEED — runs only when DB is empty
// ═══════════════════════════════════════════════════════════════
async function seedDatabase() {
  const userCount = await User.countDocuments();
  if (userCount > 0) {
    console.log('📦  Database already seeded —', userCount, 'users found');
    return;
  }

  await User.insertMany([
    {
      name: 'Ravi Kumar', category: 'APL',
      rationNo: '123456789', mobile: '9876543210', district: 'Salem',
      address: 'Door No. 12, Gandhi Street, Attur, Salem — 636102',
      shopCode: 'SM-001',
      family: [
        { name: 'Ravi Kumar', age: 42 }, { name: 'Meena Ravi', age: 38 },
        { name: 'Karthik Ravi', age: 18 }, { name: 'Priya Ravi', age: 15 }
      ]
    },
    {
      name: 'Murugan S', category: 'BPL',
      rationNo: '987654321', mobile: '8765432109', district: 'Salem',
      address: '5/A, Anna Nagar, Omalur, Salem — 636455',
      shopCode: 'SM-002',
      family: [
        { name: 'Murugan S', age: 45 }, { name: 'Lakshmi M', age: 40 }
      ]
    },
    {
      name: 'Selvam P', category: 'PHH',
      rationNo: '456789123', mobile: '7654321098', district: 'Salem',
      address: 'No. 33, Nehru Road, Mettur, Salem — 636401',
      shopCode: 'SM-003',
      family: [
        { name: 'Selvam P', age: 38 }, { name: 'Valli S', age: 34 },
        { name: 'Deepa S', age: 12 }
      ]
    },
    {
      name: 'Anbu Raja', category: 'BPL',
      rationNo: '321654987', mobile: '6543210987', district: 'Salem',
      address: 'Plot 7, MGR Street, Yercaud, Salem — 636601',
      shopCode: 'SM-004',
      family: [
        { name: 'Anbu Raja', age: 50 }, { name: 'Saraswathi A', age: 46 },
        { name: 'Vijay A', age: 22 }
      ]
    }
  ]);

  await Product.insertMany([
    { name:'Rice',       icon:'🍚', unit:'per kg',    price:1,    quota:'Max 10 kg/month', maxQty:10, stock:5000 },
    { name:'Sugar',      icon:'🧂', unit:'per kg',    price:13.5, quota:'Max 2 kg/month',  maxQty:2,  stock:1000 },
    { name:'Wheat',      icon:'🌾', unit:'per kg',    price:2,    quota:'Max 5 kg/month',  maxQty:5,  stock:3000 },
    { name:'Kerosene',   icon:'🛢', unit:'per litre', price:15,   quota:'Max 3 L/month',   maxQty:3,  stock:500  },
    { name:'Dal (Toor)', icon:'🫘', unit:'per kg',    price:30,   quota:'Max 2 kg/month',  maxQty:2,  stock:800  },
    { name:'Edible Oil', icon:'🫙', unit:'per litre', price:50,   quota:'Max 1 L/month',   maxQty:1,  stock:300  }
  ]);

  console.log('🌱  Database seeded with demo users and products');
}

// ── Helper ────────────────────────────────────────────────────
function genOrderId() {
  return 'ORD-' + Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ═══════════════════════════════════════════════════════════════
//  API ROUTES
// ═══════════════════════════════════════════════════════════════

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', time: new Date(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// ── AUTH ──────────────────────────────────────────────────────
/**
 * POST /api/auth/login
 * Body: { category, rationNo, mobile }
 * Returns: user object with family, address, shopCode
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { category, rationNo, mobile } = req.body;

    if (!category || !rationNo || !mobile)
      return res.status(400).json({ success: false, message: 'All fields are required' });

    if (!/^\d+$/.test(rationNo))
      return res.status(400).json({ success: false, message: 'Ration number must contain digits only' });

    const u = await User.findOne({ category, rationNo: String(rationNo), mobile });
    if (!u)
      return res.status(401).json({ success: false, message: 'Invalid credentials. Please check your details.' });

    const orderCount = await Order.countDocuments({ userId: u._id });

    res.json({
      success: true,
      user: {
        id:        u._id,
        name:      u.name,
        category:  u.category,
        rationNo:  u.rationNo,
        mobile:    u.mobile,
        district:  u.district,
        address:   u.address,
        shopCode:  u.shopCode,
        family:    u.family,
        orders:    orderCount
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── PRODUCTS ──────────────────────────────────────────────────
// GET /api/products  — list all active products
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find({ active: true }).select('-__v');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/products/:id
app.get('/api/products/:id', async (req, res) => {
  try {
    const p = await Product.findById(req.params.id);
    if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: p });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── ORDERS ────────────────────────────────────────────────────
/**
 * POST /api/orders
 * Body: { userId, items:[{productId,qty}], deliveryType:"home"|"takeaway", paymentMethod }
 */
app.post('/api/orders', async (req, res) => {
  try {
    const { userId, items, deliveryType = 'home', paymentMethod = 'Cash' } = req.body;

    if (!userId || !items?.length)
      return res.status(400).json({ success: false, message: 'userId and items are required' });

    const u = await User.findById(userId);
    if (!u) return res.status(404).json({ success: false, message: 'User not found' });

    let total = 0;
    const enriched = [];

    for (const item of items) {
      const p = await Product.findById(item.productId);
      if (!p) return res.status(404).json({ success: false, message: `Product not found: ${item.productId}` });
      if (p.stock < item.qty)
        return res.status(400).json({ success: false, message: `Insufficient stock for ${p.name}` });
      if (item.qty > p.maxQty)
        return res.status(400).json({ success: false, message: `Exceeds monthly quota for ${p.name}` });

      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.qty } });
      total += p.price * item.qty;
      enriched.push({ productId: p._id, name: p.name, qty: item.qty, price: p.price });
    }

    const order = new Order({
      orderId: genOrderId(),
      userId,
      rationNo:     u.rationNo,
      items:        enriched,
      total,
      deliveryType,
      deliveryAddr: deliveryType === 'home' ? u.address : '',
      shopCode:     deliveryType === 'takeaway' ? u.shopCode : '',
      paymentMethod
    });
    await order.save();

    res.status(201).json({
      success: true,
      message: 'Order placed successfully!',
      orderId: order.orderId,
      total,
      deliveryType,
      status: order.status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/orders/user/:userId  — order history for a user
app.get('/api/orders/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/orders/:orderId  — single order detail
app.get('/api/orders/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ── ADMIN ─────────────────────────────────────────────────────
// GET /api/admin/stats
app.get('/api/admin/stats', async (req, res) => {
  try {
    const [users, orders, products] = await Promise.all([
      User.countDocuments(),
      Order.countDocuments(),
      Product.countDocuments({ active: true })
    ]);
    const rev = await Order.aggregate([{ $group: { _id: null, total: { $sum: '$total' } } }]);
    const homeOrders     = await Order.countDocuments({ deliveryType: 'home' });
    const takeawayOrders = await Order.countDocuments({ deliveryType: 'takeaway' });
    res.json({
      success: true,
      stats: { users, orders, products, revenue: rev[0]?.total || 0, homeOrders, takeawayOrders }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/orders  — all orders
app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(200);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/admin/orders/:id/status
app.patch('/api/admin/orders/:id/status', async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.id },
      { status: req.body.status },
      { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// GET /api/admin/users
app.get('/api/admin/users', async (req, res) => {
  try {
    const users = await User.find().select('-__v');
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/admin/products  — add new product
app.post('/api/admin/products', async (req, res) => {
  try {
    const p = new Product(req.body);
    await p.save();
    res.status(201).json({ success: true, product: p });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// PATCH /api/admin/products/:id  — update product
app.patch('/api/admin/products/:id', async (req, res) => {
  try {
    const p = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!p) return res.status(404).json({ success: false, message: 'Product not found' });
    res.json({ success: true, product: p });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Catch-all: serve frontend for any unmatched route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   🌾  TNCS Ration Shop API              ║
  ║   http://localhost:${PORT}                 ║
  ║                                          ║
  ║   POST  /api/auth/login                 ║
  ║   GET   /api/products                   ║
  ║   POST  /api/orders                     ║
  ║   GET   /api/orders/user/:id            ║
  ║   GET   /api/admin/stats                ║
  ║   GET   /api/admin/orders               ║
  ╚══════════════════════════════════════════╝`);
});

module.exports = app;
