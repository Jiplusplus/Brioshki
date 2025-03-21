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
      return res.status(500).json({ message: 'Errore nel server' }); // Restituisci un JSON con un messaggio di errore
    }

    // Risposta corretta, restituire un oggetto JSON
    res.status(201).json({ message: 'Cliente aggiunto con successo' }); // Restituisci una risposta JSON
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
    res.json({ message: 'Cliente aggiornato con successo' });
  });
});  

app.delete('/clienti/:id', verificaToken, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM clienti WHERE id = ?', [id], (err) => {
    if (err) {
      console.error('Errore eliminazione cliente:', err);
      return res.status(500).json({ message: 'Errore nel server' });
    }
    res.json({ message: 'Cliente cancellato con successo' });
  });
});

// API Gestione Brioche
app.get('/brioches', verificaToken, (req, res) => {
  db.query('SELECT * FROM brioches', (err, results) => {
    if (err) {
      console.error('Errore nel database:', err);
      return res.status(500).json({ message: 'Errore nel server' });
    }
    res.json(results);
  });
});

// API Inserimento Ordine
app.post('/ordini', verificaToken, (req, res) => {
  const { cliente_id, brioche_id, quantita } = req.body; // Assicurati che "cliente_id" sia il nome giusto

  // Prima controlla che il cliente e la brioche esistano
  db.query('SELECT * FROM clienti WHERE id = ?', [cliente_id], (err, clienteResults) => {
    if (err) {
      console.error('Errore nel database:', err);
      return res.status(500).json({ message: 'Errore nel server' });
    }
    if (clienteResults.length === 0) return res.status(404).json({ message: 'Cliente non trovato' });

    db.query('SELECT * FROM brioches WHERE id = ?', [brioche_id], (err, briocheResults) => {
      if (err) {
        console.error('Errore nel database:', err);
        return res.status(500).json({ message: 'Errore nel server' });
      }
      if (briocheResults.length === 0) return res.status(404).json({ message: 'Brioche non trovata' });

      // Calcolare il totale basato sulla quantità
      const totale = briocheResults[0].prezzo * quantita; // Considera la quantità

      // Inserisci l'ordine
      const ordineData = {
        cliente_id: cliente_id,
        data_ordine: new Date(),
        totale: totale
      };

      db.query('INSERT INTO ordini SET ?', ordineData, (err, result) => {
        if (err) {
          console.error('Errore nel database:', err);
          return res.status(500).json({ message: 'Errore nel server' });
        }

        const ordineId = result.insertId;
        // Aggiungi dettagli ordine
        db.query('INSERT INTO ordine_dettagli (ordine_id, brioche_id, quantita) VALUES (?, ?, ?)', [ordineId, brioche_id, quantita], (err) => {
          if (err) {
            console.error('Errore nel database:', err);
            return res.status(500).json({ message: 'Errore nel server' });
          }
          res.json({ message: 'Ordine inserito con successo' });
        });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server avviato su http://localhost:${port}`);
});
