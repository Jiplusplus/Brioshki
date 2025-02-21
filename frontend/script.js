document.addEventListener('DOMContentLoaded', () => {
    const clientiTable = document.getElementById('clientiTable');
    const clienteForm = document.getElementById('clienteForm');
    const editModal = document.getElementById('editModal');
    const editNome = document.getElementById('editNome');
    const editIndirizzo = document.getElementById('editIndirizzo');
    const editTelefono = document.getElementById('editTelefono');
    const closeModal = document.querySelector('.close');
    const saveChangesBtn = document.getElementById('saveChanges');
    let clienteCorrenteId = null;
  
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
  
    // Assicura che la modale sia nascosta all'avvio
    editModal.style.display = 'none';
  
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
        clienteCorrenteId = id;
        editNome.value = nome;
        editIndirizzo.value = indirizzo;
        editTelefono.value = telefono;
        editModal.style.display = 'flex';
    };
  
    if (saveChangesBtn) {
        saveChangesBtn.addEventListener('click', () => {
            fetch(`http://localhost:3000/clienti/${clienteCorrenteId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': token },
                body: JSON.stringify({ nome: editNome.value, indirizzo: editIndirizzo.value, telefono: editTelefono.value })
            }).then(() => {
                editModal.style.display = 'none';
                caricaClienti();
            });
        });
    }
  
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            editModal.style.display = 'none';
        });
    }
  
    // Cancella Cliente
    window.cancellaCliente = (id) => {
        const conferma = document.createElement('div');
        conferma.classList.add('modal');
        conferma.innerHTML = `
            <div class='modal-content'>
                <p>Sei sicuro di voler eliminare questo cliente?</p>
                <button id='confirmDelete'>Conferma</button>
                <button onclick='this.parentElement.parentElement.remove()'>Annulla</button>
            </div>
        `;
        document.body.appendChild(conferma);
        document.getElementById('confirmDelete').addEventListener('click', () => {
            fetch(`http://localhost:3000/clienti/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': token }
            }).then(() => {
                conferma.remove();
                caricaClienti();
            });
        });
    };
  
    // Carica i clienti al caricamento della pagina
    caricaClienti();
});