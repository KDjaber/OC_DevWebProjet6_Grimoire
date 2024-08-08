require('dotenv').config()

const express = require('express');
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize');
const mongoose = require('mongoose');
const path = require('path');

const booksRoutes = require('./routes/books');
const userRoutes = require('./routes/user');

const { authRateLimit } = require('./middleware/rate-limits')

mongoose.connect(process.env.MONGOOSE_CONNECT,
  { useNewUrlParser: true,
    useUnifiedTopology: true })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));



const app = express();

app.use(helmet({crossOriginResourcePolicy: false}))
app.use(mongoSanitize())

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
});

app.use(express.json());

app.use('/api/books', booksRoutes);
app.use('/api/auth', authRateLimit, userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;