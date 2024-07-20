const express = require('express');
const multer = require('multer');
const auth = require('../middleware/auth');
const bookController = require('../controllers/bookController');

const router = express.Router();

// Configuration de Multer pour le stockage en mémoire
const storage = multer.memoryStorage();
const upload = multer({ storage });

router.get('/bestrating', bookController.getBestRatingBooks);
router.post('/', auth, upload.single('image'), bookController.createBook);
router.get('/', bookController.getAllBooks);
router.get('/:id', bookController.getBookById);
router.put('/:id', auth, upload.single('image'), bookController.updateBook);
router.delete('/:id', auth, bookController.deleteBook);
router.post('/:id/rating', auth, bookController.addRating);

module.exports = router;
