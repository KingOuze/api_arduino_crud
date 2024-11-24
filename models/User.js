const mongoose = require('mongoose');

// Définition du schéma
const userSchema = new mongoose.Schema({
  nom: {
    type: String,
    required: true
  },
  prenom: {
    type: String,
    required: true
  },
  telephone: {
    type: Number,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: props => `${props.value} n'est pas un email valide!`
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  code: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return /^\d{4}$/.test(v);
      },
      message: props => `${props.value} doit être exactement 4 chiffres!`
    }
  },
  role: {
    type: String,
    required: true,
    enum: ['admin', 'user']
  },
  archived: {
    type: Boolean,
    default: false
  }
});

// Création du modèle
const User = mongoose.model('User', userSchema);

// Exportation
module.exports = User;