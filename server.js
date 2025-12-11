require('dotenv').config()
require('./src/config/db')
const express = require('express')
const cors = require('cors')
const app = express()
const router = require('./src/routes')

// Middleware
const corsOptions = {
    // 1. Ganti '*' dengan URL frontend Anda yang spesifik
    origin: ['http://localhost:5173', 'https://aksaralearning.com'],

    // 2. Izinkan server untuk menerima dan memproses kredensial
    credentials: true,
};

app.use(cors(corsOptions)) // Biar bisa diakses dari frontend lain (misal Flutter)
app.use(express.json({ limit: '50mb' })) // Biar bisa parsing JSON dari body request
app.use(express.urlencoded({ limit: '50mb', extended: false })) // Untuk parsing form-urlencoded

// Routes
app.use('/api', router) // Misal semua route diawali dengan /api

app.get('/', (req, res) => {
    return res.json({
        message: 'Welcome to Dyslexia API...'
    })
});


// Jalankan server
const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
    console.log(`✅ Server running on http://localhost:${port}`)
})

