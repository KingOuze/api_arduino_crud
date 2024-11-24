// tests/auth.test.js
const request = require('supertest');
const app = require('../app'); // Assurez-vous que ce chemin pointe vers votre fichier principal
const User = require('../models/User'); // Le modèle utilisateur

describe('POST /auth/login', () => {
  beforeAll(async () => {
    // Créez un utilisateur pour les tests
    await User.create({
      email: 'testuser@example.com',
      password: 'password123', // Assurez-vous que le mot de passe est correctement haché si nécessaire
      fourDigitCode: '1234' // Ajoutez un code à quatre chiffres pour le test
    });
  });

  afterAll(async () => {
    // Supprimez l'utilisateur après les tests
    await User.deleteMany({});
  });

  it('should log in with valid email and password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'password123'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token'); // Supposons que vous renvoyez un token après connexion
  });

  it('should log in with valid four-digit code', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        code: '1234' // Envoie du code à quatre chiffres
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token'); // Vérifiez que le token est renvoyé
  });

  it('should not log in with invalid email or password', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'testuser@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(401); // Supposons que le statut 401 est renvoyé pour une connexion échouée
  });

  it('should not log in with invalid four-digit code', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        code: '0000' // Code incorrect
      });

    expect(response.status).toBe(401); // Statut 401 pour échec
  });

  it('should return an error for missing credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({}); // Pas de données envoyées

    expect(response.status).toBe(400); // Statut 400 pour une mauvaise requête
    expect(response.body).toHaveProperty('error'); // Message d'erreur
  });

  it('should return an error for incomplete credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'testuser@example.com' // Manque le mot de passe
      });

    expect(response.status).toBe(400); // Statut 400 pour une mauvaise requête
    expect(response.body).toHaveProperty('error'); // Message d'erreur
  });
});