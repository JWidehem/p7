/* eslint-disable no-underscore-dangle */
const express = require('express');

const router = express.Router();
const multer = require('multer');
const Book = require('../models/book');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images');
  },
  filename: (req, file, cb) => {
    const name = file.originalname.split(' ').join('_');
    cb(null, `${name}-${Date.now()}`);
  },
});

const upload = multer({ storage });

// Route pour créer un livre
router.post('/', auth, upload.single('image'), (req, res) => {
  try {
    const bookObject = JSON.parse(req.body.book);

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    });

    book.save()
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
router.put('/:id', auth, upload.single('image'), (req, res) => {
  const bookObject = req.file
    ? { ...JSON.parse(req.body.book), imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` }
    : { ...req.body };
  Book.updateOne({ _id: req.params.id, userId: req.auth.userId }, { ...bookObject, _id: req.params.id })
    .then(() => res.status(200).json({ message: 'Book updated!' }))
    .catch((error) => res.status(400).json({ error }));
});

// Route pour supprimer un livre
router.delete('/:id', auth, (req, res) => {
  Book.deleteOne({ _id: req.params.id, userId: req.auth.userId })
    .then(() => res.status(200).json({ message: 'Book deleted!' }))
    .catch((error) => res.status(400).json({ error }));
});

// Route pour obtenir les livres les mieux notés
router.get('/bestrating', (req, res) => {
  Book.find()
    .sort({ averageRating: -1 }) // Tri par moyenne des notes décroissantes
    .limit(5) // Limite à 5 résultats, ajustez selon vos besoins
    .then((books) => res.status(200).json(books))
    .catch((error) => res.status(400).json({ error }));
});

// Route pour ajouter une notation à un livre
router.post('/:id/rating', auth, (req, res) => {
  const { rating } = req.body;
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ error: 'Book not found!' });
      }

      const newRating = {
        userId: req.auth.userId,
        grade: rating,
      };

      // Ajouter la nouvelle notation
      const updatedRatings = [...book.ratings, newRating];

      // Calculer la nouvelle moyenne des notations
      const totalRatings = updatedRatings.length;
      const sumRatings = updatedRatings.reduce((acc, curr) => acc + curr.grade, 0);
      const averageRating = sumRatings / totalRatings;

      // Créer un nouvel objet book avec les propriétés mises à jour
      const updatedBook = {
        ...book._doc,
        ratings: updatedRatings,
        averageRating,
      };

      // Sauvegarder les modifications
      return Book.updateOne({ _id: req.params.id }, updatedBook)
        .then(() => res.status(200).json(updatedBook))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
});

// Route pour noter un livre
router.post('/:id/rating', auth, (req, res) => {
  const { userId, rating } = req.body;

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return res.status(404).json({ message: 'Livre non trouvé' });
      }

      // Ajouter ou mettre à jour la note de l'utilisateur pour ce livre
      const existingRatingIndex = book.ratings.findIndex((r) => r.userId === userId);
      const updatedBook = { ...book._doc };

      if (existingRatingIndex !== -1) {
        updatedBook.ratings[existingRatingIndex].grade = rating;
      } else {
        updatedBook.ratings.push({ userId, grade: rating });
      }

      // Calculer la moyenne des notes
      const totalRatings = updatedBook.ratings.reduce((acc, curr) => acc + curr.grade, 0);
      updatedBook.averageRating = totalRatings / updatedBook.ratings.length;

      return Book.updateOne({ _id: req.params.id }, updatedBook)
        .then(() => res.status(200).json(updatedBook));
    })
    .catch((error) => res.status(400).json({ error }));
});

module.exports = router;
