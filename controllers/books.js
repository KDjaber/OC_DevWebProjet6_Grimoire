const { validationResult } = require('express-validator');
const Book = require('../models/Book');
const fs = require('node:fs/promises');
const sharp = require('sharp');

// using Sharp to resize & reformat image + changing file path
const uploadBookImage = async (buffer, bookTitle) => {
  const filename = bookTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()
  const filePath = `images/${filename}-${Date.now()}.webp`
  try {
    await sharp(buffer)
      .resize(null, 300, { fit: 'cover' })
      .toFormat('webp')
      .toFile(filePath);
  } catch (e) {
    // if the image cannot be uploaded, we don't return any filepath
    return null
  }
  return filePath
}

// GET route to get all books
exports.getAllBooks = async (req, res, next) => {
  const books = await Book.find()
    .catch(error => res.status(400).json({ error }));
  res.status(200).json(books)
};

// GET route to get one books
exports.getOneBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then(book => res.status(200).json(book))
    .catch(error => res.status(404).json({ error }));
};

// GET route to get the three books with best average rating
exports.getBest = (req, res, next) => {
  Book.find().sort({ averageRating: -1 }).limit(3)
    .then(book => res.status(200).json(book))
    .catch(error => res.status(500).json({ error }));
};

// POST route to create one
// initiating 'ratings' to empty array as expected by tech specifications prevents user from posting with a rating
exports.createBook = async (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);
  delete bookObject._id;
  delete bookObject._userId;

  const filePath = await uploadBookImage(req.file.buffer, bookObject.title);
  const book = new Book({
    ...bookObject,
    userId: req.auth.userId,
    imageUrl: filePath ? `${req.protocol}://${req.get('host')}/${filePath}` : null,
    ratings: [], 
    averageRating: 0,
  });
  book.save()
    .then(() => { res.status(201).json({ message: 'Objet enregistré !' }) })
    .catch(error => { res.status(400).json({ error }) })
};

// PUT route to modify one book
exports.modifyBook = async (req, res, next) => {
  let bookObject
  const book = await Book.findOne({ _id: req.params.id })
    .catch((error) => {
      res.status(400).json({ error })
    })
  
  if (req.file) {
    bookObject = { ...JSON.parse(req.body.book) };
    const filePath = await uploadBookImage(req.file.buffer, bookObject.title);
    bookObject.imageUrl = filePath ? `${req.protocol}://${req.get('host')}/${filePath}` : null;
    const filename = book.imageUrl.split('/images/')[1];
    await fs.unlink(`images/${filename}`).catch(error => res.status(500).json({ error }))
  } else {
    bookObject = { ...req.body };
  }

  delete bookObject._userId;

  if (book.userId != req.auth.userId) {
    res.status(400).json({ message: 'Non autorisé' })
  } else {
    await Book
      .updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
      .catch((error) => { res.status(401).json({ error }) })

    res.status(200).json({ message: 'Objet modifié !' })
  }

}

// DELETE route to delete one book
exports.deleteBook = async (req, res, next) => {
  const book = await Book.findOne({ _id: req.params.id })
    .catch(error => {
      res.status(500).json({ error });
    });

  if (book?.userId != req.auth.userId) {
    res.status(401).json({ message: 'Not authorized' });
  } else {
    if (book.imageUrl) {
      const filename = book.imageUrl.split('/images/')[1];
      await fs.unlink(`images/${filename}`).catch(error => res.status(500).json({ error }))
    }

    await Book.deleteOne({ _id: req.params.id })
      .catch(error => res.status(401).json({ error }))

    res.status(200).json({ message: 'Objet supprimé !' });
  }

};

// POST route to create rating for one book + initiate average rating
exports.addRating = (req, res, next) => {
  const result = validationResult(req);
  if (!result.isEmpty()) {
    if(result.array().some(err => err.path === "rating")) {
      res.status(400).json({ message: 'La note n\'est pas valide' })
      return 
    }
  }

  Book.findOne(
  {
    $and: [{ _id: req.params.id }, {
      ratings: {
        $not: { $elemMatch: { userId: req.auth.userId } }
      }
    }]
  })
  .then((book) => {
    if (book) {
      book.ratings.push({
        userId: req.body.userId,
        grade: req.body.rating,
      })
      book.averageRating = book.ratings.reduce((total, next) => total + next.grade, 0) / book.ratings.length;
      book.save()
        .then((book) => res.status(200).json(book))
        .catch(error => {
          res.status(500).json({ error });
        });
    } else {
      res.status(400).json({ message: 'Vous avez déjà noté ce livre' })
    }
  })
  .catch(error => {
    res.status(500).json({ error });
  })
};