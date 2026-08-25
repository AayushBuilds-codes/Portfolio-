const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = 3005;
const server = http.createServer((req, res) => {
    let filePath = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url);
    
    // Safety check to keep within Portfolio dir
    const relative = path.relative(path.join(__dirname, '..'), filePath);
    if (relative.startsWith('..') || path.isAbsolute(relative)) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }

    fs.readFile(filePath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end();
            return;
        }
        let contentType = 'text/html';
        if (filePath.endsWith('.js')) contentType = 'application/javascript';
        else if (filePath.endsWith('.css')) contentType = 'text/css';
        else if (filePath.endsWith('.png')) contentType = 'image/png';
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`Verification server running on port ${PORT}`);
    launchEdge();
});

let edgeProcess = null;
function launchEdge() {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    edgeProcess = spawn(edgePath, [
        '--remote-debugging-port=9227',
        '--headless',
        '--disable-gpu',
        `http://127.0.0.1:${PORT}/index.html`
    ]);
    setTimeout(connectDevTools, 2000);
}

function connectDevTools() {
    http.get('http://127.0.0.1:9227/json/list', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const list = JSON.parse(data);
            const page = list.find(p => p.type === 'page');
            const ws = new WebSocket(page.webSocketDebuggerUrl);

            ws.on('open', () => {
                ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
                
                // Query DOM structures
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        id: 2,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: `(() => {
                                const canvasExists = !!document.getElementById('neural-canvas');
                                const certsCount = document.querySelectorAll('.credential-card').length;
                                const micBtnExists = !!document.getElementById('nova-mic-btn');
                                const bgScriptLoaded = !!document.querySelector('script[src="js/neural-bg.js"]');
                                
                                return JSON.stringify({
                                    canvasExists,
                                    certsCount,
                                    micBtnExists,
                                    bgScriptLoaded
                                });
                            })()`
                        }
                    }));
                }, 1000);
            });

            ws.on('message', (message) => {
                const msg = JSON.parse(message);
                if (msg.id === 2 && msg.result && msg.result.result) {
                    console.log('ADVANCED DOM INTEGRATION RESULTS:', msg.result.result.value);
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
