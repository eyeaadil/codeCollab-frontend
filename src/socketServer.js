import { WebSocketServer } from 'ws';

const wss = new WebSocketServer({ port: 4000 });

// Store file contents in memory for persistence between connections
const fileContents = new Map();

// Track clients and their subscribed files
const fileSubscriptions = new Map(); // Maps fileName to Set of WebSocket clients
const clientSubscriptions = new Map(); // Maps WebSocket to Set of fileNames

// Ensure a client is alive with ping/pong
function heartbeat() {
  this.isAlive = true;
}

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Setup heartbeat
  ws.isAlive = true;
  ws.on('pong', heartbeat);
  
  // Initialize client subscriptions
  clientSubscriptions.set(ws, new Set());

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`Received: ${JSON.stringify(data)}`);
      
      if (data.type === 'join') {
        // Client wants to join a file's updates
        const fileName = data.fileName;
        
        // Add file to this client's subscriptions
        const clientSubs = clientSubscriptions.get(ws);
        clientSubs.add(fileName);
        
        // Add client to file's subscribers
        if (!fileSubscriptions.has(fileName)) {
          fileSubscriptions.set(fileName, new Set());
        }
        fileSubscriptions.get(fileName).add(ws);
        
        console.log(`Client subscribed to file: ${fileName}`);
        
        // Send the latest content of this file to the client
        if (fileContents.has(fileName)) {
          ws.send(JSON.stringify({
            type: 'update',
            fileName,
            content: fileContents.get(fileName)
          }));
          console.log(`Sent latest content of ${fileName} to new subscriber`);
        }
      }
      else if (data.type === 'update') {
        // Client is updating a file
        const { fileName, content } = data;
        
        // Store the latest content
        fileContents.set(fileName, content);
        
        // Broadcast to all clients subscribed to this file
        if (fileSubscriptions.has(fileName)) {
          const subscribers = fileSubscriptions.get(fileName);
          
          subscribers.forEach((client) => {
            // Don't send back to the original sender
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'update',
                fileName,
                content
              }));
            }
          });
          
          console.log(`Broadcasted update for ${fileName} to ${subscribers.size - 1} other clients`);
        }
      }
      else if (data.type === 'getContent') {
        // Client is requesting current content
        const { fileName } = data;
        
        if (fileContents.has(fileName)) {
          ws.send(JSON.stringify({
            type: 'update',
            fileName,
            content: fileContents.get(fileName)
          }));
          console.log(`Sent requested content of ${fileName}`);
        }
      }
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    
    // Remove this client from all file subscriptions
    const clientSubs = clientSubscriptions.get(ws) || new Set();
    
    clientSubs.forEach(fileName => {
      if (fileSubscriptions.has(fileName)) {
        fileSubscriptions.get(fileName).delete(ws);
        
        // Clean up empty file subscriptions
        if (fileSubscriptions.get(fileName).size === 0) {
          fileSubscriptions.delete(fileName);
        }
      }
    });
    
    // Remove client's subscription tracking
    clientSubscriptions.delete(ws);
  });
});

// Set up ping interval to check for dead connections
const interval = setInterval(() => {
  wss.clients.forEach(ws => {
    if (ws.isAlive === false) {
      // Remove dead connection from subscriptions
      if (clientSubscriptions.has(ws)) {
        const clientSubs = clientSubscriptions.get(ws);
        clientSubs.forEach(fileName => {
          if (fileSubscriptions.has(fileName)) {
            fileSubscriptions.get(fileName).delete(ws);
          }
        });
        clientSubscriptions.delete(ws);
      }
      return ws.terminate();
    }
    
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => {
  clearInterval(interval);
});

console.log('WebSocket server is running on ws://localhost:4000');