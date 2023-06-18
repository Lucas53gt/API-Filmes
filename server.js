const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

// Configurações
const app = express();
const PORT = 3000;
const SECRET_KEY = '123456';

// Configuração do banco de dados
mongoose.connect('mongodb://mongo:27017/filmes', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Erro na conexão com o MongoDB:'));
db.once('open', () => {
  console.log('Conectado ao banco de dados MongoDB.');
});

// Model do Filme
const filmeSchema = new mongoose.Schema({
  titulo: String,
  diretor: String,
  genero: String,
});
const Filme = mongoose.model('Filme', filmeSchema);

// Rotas da API
app.use(express.json());

app.get('/', (req, res) => {
  res.send('API Filmes');
});

// Rota de autenticação
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username === 'admin' && password === '123456') {
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Usuário ou senha inválidos.' });
  }
});

// Middleware de autenticação JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.sendStatus(403);
    }

    req.user = user;
    next();
  });
}

// Rotas protegidas por autenticação
app.get('/filmes', authenticateToken, (req, res) => {
  Filme.find({}, (err, filmes) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao buscar filmes.' });
    } else {
      res.json(filmes);
    }
  });
});

app.post('/filmes', authenticateToken, (req, res) => {
  const { titulo, diretor, genero } = req.body;

  const filme = new Filme({ titulo, diretor, genero });
  filme.save((err) => {
    if (err) {
      res.status(500).json({ error: 'Erro ao salvar filme.' });
    } else {
      res.sendStatus(201);
    }
  });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
