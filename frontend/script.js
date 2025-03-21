document.addEventListener('DOMContentLoaded', () => {
    const clientiTable = document.getElementById('clientiTable');
    const clienteForm = document.getElementById('clienteForm');
    const editModal = document.getElementById('editModal');
    const ordineModal = document.getElementById('ordineModal');
    const editNome = document.getElementById('editNome');
    const editIndirizzo = document.getElementById('editIndirizzo');
    const editTelefono = document.getElementById('editTelefono');
    const saveChangesBtn = document.getElementById('saveChanges');
    let clienteCorrenteId = null;

    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Nasconde le modali all'avvio
    editModal.style.display = 'none';
    ordineModal.style.display = 'none';

    // Carica i clienti
    function caricaClienti() {
        fetch('http://localhost:3000/clienti', {
            method: 'GET',
            headers: { 'Authorization': token }
        })
        .then(response => response.json())
        .then(data => {
            if (!Array.isArray(data)) {
                console.error("Errore nei dati ricevuti:", data);
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
                        <button onclick="apriOrdine(${cliente.id})">Inserisci Ordine</button>
                    </td>
                `;
                clientiTable.appendChild(row);
            });
        })
        .catch(error => console.error('Errore nel caricamento clienti:', error));
    }

    // Aggiungi Cliente
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
    })
    .then(response => response.json()) // Risposta JSON
    .then(data => {
        console.log(data); // Logga il messaggio di successo
        clienteForm.reset();
        caricaClienti();
    })
    .catch(error => console.error('Errore nell\'aggiunta cliente:', error));
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
            })
            .then(() => {
                editModal.style.display = 'none';
                caricaClienti();
            })
            .catch(error => console.error('Errore nel salvataggio delle modifiche:', error));
        });
    }

    // Cancella Cliente
    window.cancellaCliente = (id) => {
        if (!confirm("Sei sicuro di voler eliminare questo cliente?")) return;
        fetch(`http://localhost:3000/clienti/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': token }
        })
        .then(() => caricaClienti())
        .catch(error => console.error('Errore nella cancellazione cliente:', error));
    };

    // Apri modale per inserire ordine con tabella brioche
    window.apriOrdine = (id) => {
        clienteCorrenteId = id;
        fetch('http://localhost:3000/brioches', {
            method: 'GET',
            headers: { 'Authorization': token }
        })
        .then(response => response.json())
        .then(brioches => {
            if (!Array.isArray(brioches)) {
                console.error("Errore nei dati delle brioche:", brioches);
                return;
            }
            const briochesTable = document.getElementById('briochesTable').getElementsByTagName('tbody')[0];
            briochesTable.innerHTML = '';

            brioches.forEach(brioche => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${brioche.nome}</td>
                    <td>€${brioche.prezzo}</td>
                    <td><input type="number" data-id="${brioche.id}" min="1" value="1"></td>
                `;
                briochesTable.appendChild(row);
            });

            ordineModal.style.display = 'flex';
        })
        .catch(error => console.error('Errore nel caricamento delle brioche:', error));
    };

    // Conferma ordine
    document.getElementById('confermaOrdine').addEventListener('click', () => {
        const briochesTable = document.getElementById('briochesTable').getElementsByTagName('tbody')[0];
        const ordini = [];

        for (let row of briochesTable.rows) {
            const briocheId = row.querySelector('input').getAttribute('data-id'); // Prendi l'ID della brioche
            const quantita = row.querySelector('input').value;

            if (quantita > 0) {
                ordini.push({
                    cliente_id: clienteCorrenteId,
                    brioche_id: briocheId,
                    quantita: quantita
                });
            }
        }

        // Aggiungi un singolo ordine alla volta
        ordini.forEach(ordine => {
            fetch('http://localhost:3000/ordini', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify(ordine)
            })
            .then(() => {
                ordineModal.style.display = 'none';
                alert('Ordine inserito con successo!');
            })
            .catch(error => console.error('Errore nell\'inserimento ordine:', error));
        });
    });

    // Chiudi la modale ordine
    window.chiudiOrdine = () => {
        ordineModal.style.display = 'none';
    };

    // Carica i clienti al caricamento della pagina
    caricaClienti();
});
