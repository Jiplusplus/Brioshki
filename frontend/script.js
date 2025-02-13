document.addEventListener('DOMContentLoaded', () => {
  const clientiTable = document.getElementById('clientiTable');
  const clienteForm = document.getElementById('clienteForm');

  const token = localStorage.getItem('token');
  if (!token) {
      window.location.href = 'login.html';
      return;
  }

  // Funzione per caricare i clienti
  function caricaClienti() {
      fetch('http://localhost:3000/clienti', {
          method: 'GET',
          headers: { 'Authorization': token }
      })
      .then(response => response.json())
      .then(data => {
          if (!Array.isArray(data)) {
              console.error("Errore nel formato dei dati ricevuti:", data);
              return;
          }
          clientiTable.innerHTML = '';
          data.forEach(cliente => {
              const row = document.createElement('tr');
              row.innerHTML = `
                  <td>${cliente.id}</td>
                  <td>${cliente.nome}</td>
                  <td>${cliente.indirizzo}</td>
                  <td>${cliente.telefono}</td>
                  <td>
                      <button onclick="modificaCliente(${cliente.id}, '${cliente.nome}', '${cliente.indirizzo}', '${cliente.telefono}')">Modifica</button>
                      <button onclick="cancellaCliente(${cliente.id})">Cancella</button>
                  </td>
              `;
              clientiTable.appendChild(row);
          });
      })
      .catch(error => console.error('Errore nel caricamento clienti:', error));
  }

  // Aggiungi Cliente
  clienteForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nome = document.getElementById('nome').value;
      const indirizzo = document.getElementById('indirizzo').value;
      const telefono = document.getElementById('telefono').value;

      fetch('http://localhost:3000/clienti', {
          method: 'POST',
          headers: { 
              'Content-Type': 'application/json',
              'Authorization': token
          },
          body: JSON.stringify({ nome, indirizzo, telefono })
      }).then(() => {
          clienteForm.reset();
          caricaClienti();
      });
  });

  // Modifica Cliente
  window.modificaCliente = (id, nome, indirizzo, telefono) => {
      const nuovoNome = prompt('Modifica Nome:', nome);
      const nuovoIndirizzo = prompt('Modifica Indirizzo:', indirizzo);
      const nuovoTelefono = prompt('Modifica Telefono:', telefono);

      if (nuovoNome && nuovoIndirizzo && nuovoTelefono) {
          fetch(`http://localhost:3000/clienti/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': token },
              body: JSON.stringify({ nome: nuovoNome, indirizzo: nuovoIndirizzo, telefono: nuovoTelefono })
          }).then(caricaClienti);
      }
  };

  // Cancella Cliente
  window.cancellaCliente = (id) => {
      if (confirm('Sei sicuro di voler cancellare questo cliente?')) {
          fetch(`http://localhost:3000/clienti/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': token }
          }).then(caricaClienti);
      }
  };

  // Carica i clienti al caricamento della pagina
  caricaClienti();
});

//prova