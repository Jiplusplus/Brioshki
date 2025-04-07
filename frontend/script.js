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
                        <button onclick="modificaCliente(${cliente.id}, '${cliente.nome.replace(/'/g, "\\'")}', '${cliente.indirizzo.replace(/'/g, "\\'")}', '${cliente.telefono.replace(/'/g, "\\'")}')">Modifica</button>
                        <button onclick="cancellaCliente(${cliente.id})">Cancella</button>
                        <button onclick="apriOrdine(${cliente.id})">Inserisci Ordine</button>
                        <button onclick="visualizzaOrdini(${cliente.id}, '${cliente.nome.replace(/'/g, "\\'")}')">Ordini</button>
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
        })
            .then(response => response.json())
            .then(data => {
                console.log(data);
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
    // Sostituisci il codice esistente del click su #confermaOrdine con:
    document.getElementById('confermaOrdine').addEventListener('click', async () => {
        const briochesTable = document.getElementById('briochesTable').getElementsByTagName('tbody')[0];
        const prodotti = [];
        let totale = 0;

        // Raccogli tutti i prodotti e calcola il totale
        for (let row of briochesTable.rows) {
            const briocheId = row.querySelector('input').getAttribute('data-id');
            const quantita = parseInt(row.querySelector('input').value);
            const prezzo = parseFloat(row.querySelector('td:nth-child(2)').textContent.replace('€', ''));

            if (quantita > 0) {
                prodotti.push({
                    brioche_id: briocheId,
                    quantita: quantita
                });
                totale += prezzo * quantita;
            }
        }

        if (prodotti.length === 0) {
            alert('Seleziona almeno un prodotto!');
            return;
        }

        // Invia l'ordine con il totale calcolato
        try {
            const response = await fetch('http://localhost:3000/ordini/completo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                },
                body: JSON.stringify({
                    cliente_id: clienteCorrenteId,
                    prodotti: prodotti,
                    totale: totale
                })
            });

            const data = await response.json();
            ordineModal.style.display = 'none';
            alert(`Ordine #${data.ordine_id} inserito con successo! Totale: €${totale.toFixed(2)}`);
        } catch (error) {
            console.error('Errore nell\'inserimento ordine:', error);
            alert('Errore nell\'inserimento dell\'ordine');
        }
    });

    // Chiudi la modale ordine
    window.chiudiOrdine = () => {
        ordineModal.style.display = 'none';
    };

    // Carica i clienti al caricamento della pagina
    caricaClienti();
});

// Apri modale visualizzazione ordini cliente
window.visualizzaOrdini = (clienteId, clienteNome) => {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3000/clienti/${clienteId}/ordini`, {
        method: 'GET',
        headers: { 'Authorization': token }
    })
        .then(response => response.json())
        .then(ordini => {
            const ordiniModal = creaModaleOrdini(clienteNome);
            const ordiniContainer = ordiniModal.querySelector('#ordiniContainer');

            if (ordini.length === 0) {
                ordiniContainer.innerHTML = '<p>Nessun ordine trovato per questo cliente.</p>';
            } else {
                ordini.forEach(ordine => {
                    const ordineElement = creaElementoOrdine(ordine);
                    ordiniContainer.appendChild(ordineElement);
                });
            }

            document.body.appendChild(ordiniModal);
            ordiniModal.style.display = 'flex';
        })
        .catch(error => {
            console.error('Errore nel caricamento ordini:', error);
            alert('Errore nel caricamento degli ordini');
        });
};

// Crea la modale per visualizzare gli ordini
function creaModaleOrdini(clienteNome) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <span class="close" onclick="this.parentElement.parentElement.remove()">&times;</span>
            <h2>Ordini di ${clienteNome}</h2>
            <div id="ordiniContainer" style="max-height: 500px; overflow-y: auto;"></div>
        </div>
    `;
    return modal;
}

function creaElementoOrdine(ordine) {
    const ordineElement = document.createElement('div');
    ordineElement.className = 'ordine';
    ordineElement.style.border = '1px solid #ddd';
    ordineElement.style.padding = '15px';
    ordineElement.style.marginBottom = '15px';
    ordineElement.style.borderRadius = '5px';

    // Formattazione data e ora
    let dataFormattata = 'Data non disponibile';
    let oraFormattata = '';

    if (ordine.data_ordine) {
        try {
            const dataOra = new Date(ordine.data_ordine);
            if (ordine.orario_ordine) {
                const [hours, minutes] = ordine.orario_ordine.split(':');
                dataOra.setHours(hours, minutes);
            }
            dataFormattata = dataOra.toLocaleDateString('it-IT');
            oraFormattata = dataOra.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            console.error('Errore formattazione data:', e);
        }
    }

    // Genera lista prodotti e calcola totale (come fallback)
    let prodottiHTML = '';
    let totaleCalcolato = 0;

    if (ordine.prodotti && Array.isArray(ordine.prodotti)) {
        prodottiHTML = ordine.prodotti.map(prodotto => {
            const subtotale = Number(prodotto.prezzo) * Number(prodotto.quantita);
            totaleCalcolato += subtotale;
            return `
                <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                    <span>${prodotto.quantita}x ${prodotto.nome}</span>
                    <span>€${subtotale.toFixed(2)}</span>
                </div>
            `;
        }).join('');
    }

    // Usa il totale salvato nel database
    const totaleFinale = ordine.totale !== undefined ? Number(ordine.totale) : totaleCalcolato;

    ordineElement.innerHTML = `
        <h3 style="margin-top: 0;">Ordine #${ordine.id} - ${dataFormattata} alle ${oraFormattata}</h3>
        <div style="margin-bottom: 10px;">
            ${prodottiHTML}
        </div>
        <div style="text-align: right; font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px;">
            Totale: €${totaleFinale.toFixed(2)}
        </div>
    `;

    return ordineElement;
}

// Chiudi modale modifica
window.chiudiModale = () => {
    document.getElementById('editModal').style.display = 'none';
};