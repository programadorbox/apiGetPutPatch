const http = require('http');
const fs = require('fs');
const url = require('url');
 
// Función que carga tickets desde un archivo JSON y asigna un ID a cada uno
const cargarTickets = () => {
  const data = fs.readFileSync('tickets.json', 'utf8');
  try {
      const ticketsData = JSON.parse(data);
      return Object.values(ticketsData).map((tickets, index) => ({ id: index + 1, ...tickets }));
  } catch (error) {
      console.error('Error al leer el archivo tickets.json:', error);
      return []; //
  }
};
 
// Función que guarda los tickets en el archivo JSON, excluyendo el ID en la salida
const guardarTickets = (data) => fs.writeFileSync('tickets.json', JSON.stringify(Object.fromEntries(data.map((tickets) => [tickets.id, { ...tickets, id: undefined }])), null, 2));
 
const requestListener = (req, res) => {
    const { pathname } = url.parse(req.url, true);
    let tickets = cargarTickets();
 
    if (req.method === 'GET' && pathname === '/tickets') {
      const query = url.parse(req.url, true).query;
      if (query.id) {
          const id = parseInt(query.id, 10);
          const ticket = tickets.find(a => a.id === id);
          if (ticket) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(ticket));
          } else {
              res.writeHead(404, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ error: 'Tickets no encontrado' }));
          }
          // Si no hay ID, retorna todos los tickets
      } else {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(tickets));
      }
  } else if (req.method === 'POST' && pathname === '/tickets') {
        let body = '';
        req.on('data', chunk => {
            body += chunk;
        });
        req.on('end', () => {
            try {
                const nuevoTicket = JSON.parse(body);
                nuevoTicket.id = tickets.length + 1;
                tickets.push(nuevoTicket);
                guardarTickets(tickets);
                res.writeHead(201, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(nuevoTicket));
            } catch (error) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Error al crear el ticket: JSON inválido' }));
 
                
            }
        });


    } else if (req.method === 'PATCH' && pathname === '/tickets') {
        const query = url.parse(req.url, true).query;
        if (query.id) {
            const id = parseInt(query.id, 10);
            const ticket = tickets.find(a => a.id === id);
            if (ticket) {
                let body = '';
                req.on('data', chunk => {
                    body += chunk;
                });
                req.on('end', () => {
                    try {
                        const cambios = JSON.parse(body);
                        Object.assign(ticket, cambios);
                        guardarTickets(tickets);
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(ticket));
                    } catch (error) {
                        res.writeHead(400, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: 'Error al actualizar el ticket: JSON inválido' }));
                    }
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Tickets no encontrado' }));
            }
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Falta el parámetro id' }));
        }
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
    }
};
 
 
// Crea el servidor HTTP y lo inicia
 
const server = http.createServer(requestListener);
if (require.main === module) {
    const PORT = 3000;
    server.listen(PORT, () => {
        console.log(`Servidor corriendo en el puerto ${PORT}`);
    });
}
 
module.exports = server;
