/* eslint-disable consistent-return */
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { handleError } = require('../utils/errorUtils');

exports.signup = (req, res) => {
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      const user = new User({
        email: req.body.email,
        password: hash,
      });
      user
        .save()
        .then(() => res.status(201).json({ message: 'User created!' }))
        .catch((error) => handleError(res, error, 'User creation failed', 400));
    })
    .catch((error) => handleError(res, error));
};

exports.login = (req, res) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (!user) {
        return res.status(401).json({ error: 'User not found!' });
      }
      bcrypt
        .compare(req.body.password, user.password)
        .then((valid) => {
          if (!valid) {
            return res.status(401).json({ error: 'Incorrect password!' });
          }
          const token = jwt.sign({ userId: user.id }, 'RANDOM_TOKEN_SECRET', {
            expiresIn: '24h',
          });
          res.status(200).json({ userId: user.id, token });
        })
        .catch((error) => handleError(res, error));
    })
    .catch((error) => handleError(res, error));
};
