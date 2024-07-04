/* eslint-disable consistent-return */
const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const Book = require('../models/book');
const auth = require('../middleware/auth');

const router = express.Router();

// Configuration de Multer pour le stockage en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Route pour obtenir les livres les mieux notés
router.get('/bestrating', (req, res) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
});

// Route pour créer un livre
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const bookObject = JSON.parse(req.body.book);

    const fileName = `${req.file.originalname.split(' ').join('_')}-${Date.now()}.jpeg`;
    const outputPath = path.join('images', fileName);

    // Optimiser l'image téléchargée et la stocker dans le répertoire 'images'
    await sharp(req.file.buffer)
      .resize(206, 260)
      .toFormat('jpeg')
      .jpeg({ quality: 80 })
      .toFile(outputPath);

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${fileName}`,
    });

    book
      .save()
      .then(() => {
        res.status(201).json({ message: 'Book created!' });
      })
      .catch((error) => {
        res.status(400).json({ error });
      });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route pour obtenir tous les livres
router.get('/', (req, res) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
});

// Route pour obtenir un livre par ID
router.get('/:id', (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
});

// Route pour mettre à jour un livre
router.put('/:id', auth, upload.single('image'), async (req, res) => {
  try {
    const bookObject = req.file
      ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.originalname.split(' ').join('_')}-${Date.now()}.jpeg`,
        }
      : { ...req.body };

    if (req.file) {
      const fileName = `${req.file.originalname.split(' ').join('_')}-${Date.now()}.jpeg`;
      const outputPath = path.join('images', fileName);

      // Optimiser l'image téléchargée et la stocker dans le répertoire 'images'
      await sharp(req.file.buffer)
        .resize(206, 260)
        .toFormat('jpeg')
        .jpeg({ quality: 80 })
        .toFile(outputPath);

      bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${fileName}`;
    }

    Book.updateOne(
      { _id: req.params.id, userId: req.auth.userId },
      { ...bookObject, _id: req.params.id },
    )
      .then(() => res.status(200).json({ message: 'Book updated!' }))
      .catch((error) => res.status(400).json({ error }));
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Route pour supprimer un livre
router.delete('/:id', auth, (req, res) => {
  Book.deleteOne({ _id: req.params.id, userId: req.auth.userId })
    .then(() => res.status(200).json({ message: 'Book deleted!' }))
    .catch((error) => res.status(400).json({ error }));
});

// Route pour ajouter une notation à un livre
router.post('/:id/rating', auth, (req, res) => {
  const { rating } = req.body;

  // Vérifier si la notation est valide (entre 0 et 5)
  if (rating < 0 || rating > 5) {
    return res.status(400).json({ error: 'Rating must be between 0 and 5' });
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Book not found!' });
      }

      // Vérifier si l'utilisateur a déjà noté ce livre
      const existingRating = book.ratings.find(
        (r) => r.userId === req.auth.userId,
      );
      if (existingRating) {
        return res
          .status(400)
          .json({ error: 'User has already rated this book!' });
      }

      const newRating = {
        userId: req.auth.userId,
        grade: rating,
      };

      // Ajouter la nouvelle notation
      const updatedRatings = [...book.ratings, newRating];

      // Calculer la nouvelle moyenne des notations et arrondir à un chiffre après la virgule
      const totalRatings = updatedRatings.length;
      const sumRatings = updatedRatings.reduce(
        (acc, curr) => acc + curr.grade,
        0,
      );
      const averageRating = (sumRatings / totalRatings).toFixed(1);

      // Mettre à jour le livre avec les nouvelles notations et la nouvelle moyenne
      const updatedBook = {
        ...book._doc,
        ratings: updatedRatings,
        averageRating: parseFloat(averageRating), // Convertir en nombre
      };

      // Sauvegarder les modifications
      return Book.updateOne({ _id: req.params.id }, updatedBook)
        .then(() => res.status(200).json(updatedBook))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
});

module.exports = router;
