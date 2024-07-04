const mongoose = require('mongoose');

// Définition du schéma de l'utilisateur
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, // Email unique et requis
  password: { type: String, required: true }, // Mot de passe haché requis
});

// Exportation du modèle User basé sur le schéma
module.exports = mongoose.model('User', userSchema);
