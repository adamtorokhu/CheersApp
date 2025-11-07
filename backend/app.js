require('dotenv').config();
const cookieParser = require('cookie-parser');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;
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
app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:5174',
        'https://cc241054-10698.node.fhstp.cc',
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
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
