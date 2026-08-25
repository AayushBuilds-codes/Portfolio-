const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = 3001;
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url);
    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end();
            return;
        }
        let contentType = 'text/html';
        if (filePath.endsWith('.js')) contentType = 'application/javascript';
        else if (filePath.endsWith('.css')) contentType = 'text/css';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    launchEdge();
});

let edgeProcess = null;
function launchEdge() {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    edgeProcess = spawn(edgePath, [
        '--remote-debugging-port=9223',
        '--headless',
        '--disable-gpu',
        `http://127.0.0.1:${PORT}/index.html`
    ]);
    setTimeout(connectDevTools, 2000);
}

function connectDevTools() {
    http.get('http://127.0.0.1:9223/json/list', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const list = JSON.parse(data);
            const page = list.find(p => p.type === 'page');
            const ws = new WebSocket(page.webSocketDebuggerUrl);

            ws.on('open', () => {
                ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
                
                // Evaluate the number of project cards in the DOM after 1 second
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        id: 2,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: "document.querySelectorAll('.project-card').length"
                        }
                    }));
                }, 1000);
            });

            ws.on('message', (message) => {
                const msg = JSON.parse(message);
                if (msg.id === 2 && msg.result && msg.result.result) {
                    console.log('NUMBER OF PROJECT CARDS IN DOM:', msg.result.result.value);
                    cleanupAndExit(0);
                }
            });
        });
    });
}

function cleanupAndExit(code) {
    if (edgeProcess) edgeProcess.kill();
    server.close(() => {
        process.exit(code);
    });
}
