const jwt = require('jsonwebtoken');

// Middleware d'authentification pour vérifier le token JWT
module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1]; // Récupère le token JWT de l'en-tête Authorization
    const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET'); // Vérifie et décode le token
    req.auth = { userId: decodedToken.userId }; // Ajoute l'ID utilisateur décodé à l'objet req
    next(); // Passe au middleware suivant
  } catch (error) {
    res.status(401).json({ error: 'Unauthorized request!' }); // Envoie une réponse 401 si l'authentification échoue
  }
};
