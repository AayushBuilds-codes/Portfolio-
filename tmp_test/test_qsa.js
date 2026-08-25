const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = 3002;
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
        '--remote-debugging-port=9224',
        '--headless',
        '--disable-gpu',
        `http://127.0.0.1:${PORT}/index.html`
    ]);
    setTimeout(connectDevTools, 2000);
}

function connectDevTools() {
    http.get('http://127.0.0.1:9224/json/list', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const list = JSON.parse(data);
            const page = list.find(p => p.type === 'page');
            const ws = new WebSocket(page.webSocketDebuggerUrl);

            ws.on('open', () => {
                ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
                
                // Query and inspect elements in the browser console context
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        id: 2,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: `(() => {
                                const cat = document.querySelector('.skill-category');
                                if (!cat) return 'No skill category found';
                                const bars = cat.querySelectorAll('.skill-bar-fill');
                                const res = [];
                                for (let i = 0; i < bars.length; i++) {
                                    res.push({
                                        tagName: bars[i] ? bars[i].tagName : 'null',
                                        className: bars[i] ? bars[i].className : 'null',
                                        dataWidth: bars[i] ? bars[i].getAttribute('data-width') : 'null',
                                        isNull: bars[i] === null
                                    });
                                }
                                return JSON.stringify(res);
                            })()`
                        }
                    }));
                }, 1000);
            });

            ws.on('message', (message) => {
                const msg = JSON.parse(message);
                if (msg.id === 2 && msg.result && msg.result.result) {
                    console.log('QUERY ALL RESULT:', msg.result.result.value);
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
