/* eslint-disable no-shadow */
/* eslint-disable no-console */
/* eslint-disable consistent-return */
const fs = require('fs');
const path = require('path');
const { optimizeImage } = require('../utils/imageUtils');
const { handleError } = require('../utils/errorUtils');
const { validateUser } = require('../utils/validationUtils');

const Book = require('../models/book');

exports.getBestRatingBooks = (req, res) => {
  Book.find()
    .sort({ averageRating: -1 })
    .limit(3)
    .then((books) => res.status(200).json(books))
    .catch((error) =>
      handleError(res, error, 'Failed to get best rating books', 400),
    );
};

exports.createBook = async (req, res) => {
  try {
    const bookObject = JSON.parse(req.body.book);
    const fileName = await optimizeImage(req.file);
    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: `${req.protocol}://${req.get('host')}/images/${fileName}`,
    });
    book
      .save()
      .then(() => res.status(201).json({ message: 'Book created!' }))
      .catch((error) => handleError(res, error, 'Book creation failed', 400));
  } catch (error) {
    handleError(res, error);
  }
};

exports.getAllBooks = (req, res) => {
  Book.find()
    .then((books) => res.status(200).json(books))
    .catch((error) => handleError(res, error, 'Failed to get books', 400));
};

exports.getBookById = (req, res) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => handleError(res, error, 'Book not found', 404));
};

exports.updateBook = async (req, res) => {
  try {
    const { error, statusCode } = await validateUser(
      req.auth.userId,
      req.params.id,
    );
    if (error) {
      return handleError(res, null, error, statusCode);
    }

    const bookObject = req.file
      ? {
          ...JSON.parse(req.body.book),
          imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.originalname.split(' ').join('_')}-${Date.now()}.jpeg`,
        }
      : { ...req.body };

    if (req.file) {
      const fileName = await optimizeImage(req.file);
      bookObject.imageUrl = `${req.protocol}://${req.get('host')}/images/${fileName}`;
    }

    Book.updateOne(
      { _id: req.params.id, userId: req.auth.userId },
      { ...bookObject, _id: req.params.id },
    )
      .then(() => res.status(200).json({ message: 'Book updated!' }))
      .catch((error) => handleError(res, error, 'Book update failed', 400));
  } catch (error) {
    handleError(res, error);
  }
};

exports.deleteBook = (req, res) => {
  validateUser(req.auth.userId, req.params.id)
    .then(({ book, error: validationError, statusCode }) => {
      if (validationError) {
        return handleError(res, null, validationError, statusCode);
      }
      const imagePath = path.join(
        __dirname,
        '..',
        'images',
        path.basename(book.imageUrl),
      );
      fs.unlink(imagePath, (err) => {
        if (err) {
          console.error(err);
        }
      });
      res.status(200).json({ message: 'Book deleted!' });
    })
    .catch((dbError) => handleError(res, dbError, 'Book deletion failed', 400));
};

exports.addRating = (req, res) => {
  const { rating } = req.body;

  if (rating < 0 || rating > 5) {
    return handleError(res, null, 'Rating must be between 0 and 5', 400);
  }

  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (!book) {
        return handleError(res, null, 'Book not found', 404);
      }

      const existingRating = book.ratings.find(
        (r) => r.userId === req.auth.userId,
      );
      if (existingRating) {
        return handleError(res, null, 'User has already rated this book!', 400);
      }

      const newRating = {
        userId: req.auth.userId,
        grade: rating,
      };

      const updatedRatings = [...book.ratings, newRating];
      const totalRatings = updatedRatings.length;
      const sumRatings = updatedRatings.reduce(
        (acc, curr) => acc + curr.grade,
        0,
      );
      const averageRating = (sumRatings / totalRatings).toFixed(1);

      const updatedBook = {
        ...book._doc,
        ratings: updatedRatings,
        averageRating: parseFloat(averageRating),
      };

      Book.updateOne({ _id: req.params.id }, updatedBook)
        .then(() => res.status(200).json(updatedBook))
        .catch((error) =>
          handleError(res, error, 'Rating addition failed', 400),
        );
    })
    .catch((error) => handleError(res, error));
};
