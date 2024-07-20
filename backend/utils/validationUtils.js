const Book = require('../models/book');

exports.validateUser = async (userId, bookId) => {
  const book = await Book.findOne({ _id: bookId });
  if (!book) {
    return { error: 'Book not found', statusCode: 404 };
  }
  if (book.userId !== userId) {
    return { error: 'Unauthorized request!', statusCode: 403 };
  }
  return { book };
};
