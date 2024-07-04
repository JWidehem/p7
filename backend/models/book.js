const mongoose = require('mongoose');

// Définition du schéma de livre
const bookSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  author: { type: String, required: true },
  imageUrl: { type: String, required: true },
  year: { type: Number, required: true },
  genre: { type: String, required: true },
  ratings: [
    {
      userId: { type: String, required: true },
      grade: { type: Number, required: true },
    },
  ],
  averageRating: { type: Number, default: 0 },
});

// Exportation du modèle Book basé sur le schéma
module.exports = mongoose.model('Book', bookSchema);
