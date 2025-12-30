import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = 3001;
const LOG_FILE = path.join(process.cwd(), 'chat-log.json');

// Initial setup
if (!fs.existsSync(LOG_FILE)) {
    fs.writeFileSync(LOG_FILE, JSON.stringify([]));
}

const server = http.createServer((req, res) => {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.url === '/messages') {
        if (req.method === 'GET') {
            const messages = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(messages));
        } else if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', () => {
                try {
                    const newMessage = JSON.parse(body);
                    const messages = JSON.parse(fs.readFileSync(LOG_FILE, 'utf8'));
                    
                    // Add consistent ID and timestamp if missing
                    newMessage.id = Date.now() + Math.random();
                    newMessage.timestamp = new Date().toISOString();
                    
                    messages.push(newMessage);
                    
                    // Limit history to 100 messages
                    const trimmedMessages = messages.slice(-100);
                    fs.writeFileSync(LOG_FILE, JSON.stringify(trimmedMessages));
                    
                    res.writeHead(201, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(newMessage));
                } catch (e) {
                    res.writeHead(400);
                    res.end('Invalid JSON');
                }
            });
        }
    } else {
        res.writeHead(404);
        res.end('Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`Chat server running at http://localhost:${PORT}`);
    console.log(`Storing messages in: ${LOG_FILE}`);
});
