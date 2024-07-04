require('dotenv').config(); // Charge les variables d'environnement

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const authRoutes = require('./routes/auth');
const bookRoutes = require('./routes/book');

const app = express();

// Middleware de configuration
app.use(cors());
app.use(express.json());

// Création du répertoire "images" si nécessaire
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Connexion à MongoDB avec Mongoose
// eslint-disable-next-line no-console
console.log('MONGO_URI from .env:', process.env.MONGO_URI);
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    // eslint-disable-next-line no-console
    console.log('MongoDB connected');
  })
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.log(err);
  });

// Définition des routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')));

// Démarrage du serveur
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server is running on port ${PORT}`);
});
