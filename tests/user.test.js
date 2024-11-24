const { User } = require('../models/User'); 

describe('Validation du modèle User', () => {
  test('devrait créer un utilisateur valide', () => {
    const user = new User('John', 'Doe', 'johndoe@example.com', 'password123', '1234', 'admin');
    expect(user.nom).toBe('John');
    expect(user.prenom).toBe('Doe');
    expect(user.email).toBe('johndoe@example.com');
    expect(user.password).toBe('password123');
    expect(user.code).toBe('1234');
    expect(user.role).toBe('admin');
  });

  test('devrait échouer si le nom est manquant', () => {
    expect(() => {
      new User('', 'Doe', 'johndoe@example.com', 'password123', '1234', 'admin');
    }).toThrowError('Le nom et le prénom sont requis');
  });

  test('devrait échouer si l\'email est invalide', () => {
    const invalidEmail = 'notanemail';
    expect(() => {
      new User('John', 'Doe', invalidEmail, 'password123', '1234', 'admin');
    }).toThrowError('Email invalide');
  });

  test('devrait échouer si le mot de passe est trop court', () => {
    const shortPassword = '123';
    expect(() => {
      new User('John', 'Doe', 'johndoe@example.com', shortPassword, '1234', 'admin');
    }).toThrowError('Le mot de passe doit contenir au moins 8 caractères');
  });

  test('devrait échouer si le code n\'est pas composé de 4 chiffres', () => {
    const invalidCode = '12'; // Code trop court
    expect(() => {
      new User('John', 'Doe', 'johndoe@example.com', 'password123', invalidCode, 'admin');
    }).toThrowError('Le code doit être exactement de 4 chiffres');
  });

  test('devrait échouer si le rôle est invalide', () => {
    const invalidRole = 'superuser';
    expect(() => {
      new User('John', 'Doe', 'johndoe@example.com', 'password123', '1234', invalidRole);
    }).toThrowError('Rôle invalide');
  });
});