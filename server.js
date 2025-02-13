const express = require('express');
const mysql = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;
const secretKey = 'secret123';

app.use(cors()); // Permetti richieste da frontend separati
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Connessione al database
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'gestione_ordini'
});

db.connect((err) => {
  if (err) throw err;
  console.log('Connesso al database MySQL');
});

// Middleware per verificare il token
const verificaToken = (req, res, next) => {
  let token = req.headers['authorization'];

  if (!token) return res.status(403).json({ message: 'Token mancante' });

  // Rimuovi "Bearer " se presente
  if (token.startsWith('Bearer ')) {
    token = token.slice(7, token.length);
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) return res.status(401).json({ message: 'Token non valido' });

    req.user = decoded;
    next();
  });
};

// Registrazione utente
app.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query('INSERT INTO utenti (username, password) VALUES (?, ?)', [username, hashedPassword], (err) => {
      if (err) {
        console.error('Errore registrazione:', err);
        return res.status(400).json({ message: 'Username già in uso' });
      }
      res.json({ message: 'Utente registrato' });
    });
  } catch (error) {
    res.status(500).json({ message: 'Errore nel server' });
  }
});

// Login utente
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM utenti WHERE username = ?', [username], async (err, results) => {
    if (err) {
      console.error('Errore nel login:', err);
      return res.status(500).json({ message: 'Errore nel server' });
    }
    if (results.length === 0) return res.status(401).json({ message: 'Credenziali errate' });

    const user = results[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Credenziali errate' });

    const token = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '1h' });
    res.json({ token });
  });
});

// API Gestione Clienti (protette da autenticazione)
app.get('/clienti', verificaToken, (req, res) => {
  db.query('SELECT * FROM clienti', (err, results) => {
    if (err) {
      console.error('Errore nel database:', err);
      return res.status(500).json({ message: 'Errore nel server' });
    }
    res.json(results);
  });
});

app.post('/clienti', verificaToken, (req, res) => {
  const { nome, indirizzo, telefono } = req.body;
  db.query('INSERT INTO clienti (nome, indirizzo, telefono) VALUES (?, ?, ?)', [nome, indirizzo, telefono], (err) => {
    if (err) {
      console.error('Errore inserimento cliente:', err);
      return res.status(500).json({ message: 'Errore nel server' });
    }
    res.send('Cliente aggiunto');
  });
});

app.put('/clienti/:id', verificaToken, (req, res) => {
  const { id } = req.params;
  const { nome, indirizzo, telefono } = req.body;
  db.query('UPDATE clienti SET nome = ?, indirizzo = ?, telefono = ? WHERE id = ?', [nome, indirizzo, telefono, id], (err) => {
    if (err) {
      console.error('Errore aggiornamento cliente:', err);
      return res.status(500).json({ message: 'Errore nel server' });
    }
    res.send('Cliente aggiornato');
  });
});

app.delete('/clienti/:id', verificaToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM clienti WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Errore eliminazione cliente:', err);
      return res.status(500).json({ message: 'Errore nel server' });
    }
    res.send('Cliente cancellato');
  });
});

app.listen(port, () => {
  console.log(`Server avviato su http://localhost:${port}`);
});
