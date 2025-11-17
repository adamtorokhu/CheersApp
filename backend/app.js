require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
// Trust Render/Proxy to correctly mark secure connections for cookies
app.set('trust proxy', 1);
const mongodb = require('./services/mongodb');
const multer  = require('multer');
const path = require('path');
const fs = require('fs');

// Connect to MongoDB
mongodb.connect()
    .then(() => console.log('MongoDB connected successfully'))
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1);
    });
//-------------------------------------------------------------

// Setup upload directory
const uploadDir = path.join(__dirname, 'public/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure file storage with custom naming
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const customName = req.body.filename;
        const timestamp = Date.now();
        cb(null, customName ? `${customName}_${timestamp}${ext}` : `${timestamp}_${file.originalname}`);
    }
});

// Setup image upload with file type validation
const upload = multer({ 
    storage,
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

// Configure CORS with security options
const defaultAllowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'https://cheersapp.onrender.com'  // Add your production frontend URL
];
// Allowlist from env (comma-separated). Example:
// CORS_ORIGINS="https://your-frontend.example.com,https://your-app.netlify.app"
const envAllowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);
const allowedOrigins = new Set([...defaultAllowedOrigins, ...envAllowedOrigins]);

// Helper: allow private-network IPs during development for Vite dev servers
function isPrivateNetworkDevOrigin(origin) {
    try {
        // Only relax CORS for private networks and common Vite ports when backend runs in production
        // so you can test from phone/laptop via local IP while the API is on Render.
        // Patterns: 10.x.x.x, 192.168.x.x, 172.16-31.x.x with ports 5173-5175
        const url = new URL(origin);
        if (url.protocol !== 'http:') return false;
        const host = url.hostname;
        const port = Number(url.port || '80');
        const isVitePort = port >= 5173;
        const is10 = host.startsWith('10.');
        const is192 = host.startsWith('192.168.');
        const is172 = /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host);
        return isVitePort && (is10 || is192 || is172);
    } catch (e) {
        return false;
    }
}

app.use(cors({
    origin: function(origin, callback) {
        // Log the origin for debugging
        console.log('CORS request from origin:', origin);
        
        // Allow same-origin requests (no origin header) and tools
        if (!origin) return callback(null, true);
        if (allowedOrigins.has(origin)) {
            console.log('✓ Origin allowed:', origin);
            return callback(null, true);
        }
        // Allow private LAN IP dev servers (e.g., http://172.20.10.4:5173)
        if (isPrivateNetworkDevOrigin(origin)) {
            console.log('✓ Private network dev origin allowed:', origin);
            return callback(null, true);
        }
        // Optionally allow common preview hosts via wildcard-like check
        const allowWildcard = [
            '.vercel.app',
            '.netlify.app',
            '.github.io'
        ];
        if (allowWildcard.some(suffix => origin.endsWith(suffix))) {
            console.log('✓ Wildcard origin allowed:', origin);
            return callback(null, true);
        }
        console.log('✗ Origin BLOCKED:', origin);
        return callback(new Error('CORS not allowed for origin: ' + origin));
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Set-Cookie'],
    credentials: true,
    optionsSuccessStatus: 200
}));

app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(uploadDir));

// Handle file uploads and return URL
app.post('/upload', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }
    res.status(201).json({
        message: 'File uploaded successfully',
        url: `/uploads/${req.file.filename}`,
        filename: req.file.filename
    });
});

// Route handlers
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));
app.use('/reviews', require('./routes/review'));
app.use('/friends', require('./routes/friends'));

// Global error handler for uploads and general errors
app.use((err, req, res, next) => {
    console.error('Error:', err);
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ message: 'File upload error: ' + err.message });
    }
    if (err.message === 'Only image files are allowed!') {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: 'Something went wrong!', error: err.message });
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

module.exports = app;
