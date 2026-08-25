const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = 3004;
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
    console.log(`Command test server running on port ${PORT}`);
    launchEdge();
});

let edgeProcess = null;
function launchEdge() {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    edgeProcess = spawn(edgePath, [
        '--remote-debugging-port=9226',
        '--headless',
        '--disable-gpu',
        `http://127.0.0.1:${PORT}/index.html`
    ]);
    setTimeout(connectDevTools, 2000);
}

function connectDevTools() {
    http.get('http://127.0.0.1:9226/json/list', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const list = JSON.parse(data);
            const page = list.find(p => p.type === 'page');
            const ws = new WebSocket(page.webSocketDebuggerUrl);

            ws.on('open', () => {
                ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
                
                // Open Chat launcher
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        id: 2,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: `(() => {
                                const l = document.getElementById('nova-launcher');
                                if (l) l.click();
                                return 'Clicked launcher';
                            })()`
                        }
                    }));
                }, 1000);
            });

            ws.on('message', (message) => {
                const msg = JSON.parse(message);
                
                if (msg.id === 2) {
                    console.log('INIT:', msg.result.result.value);
                    
                    // Command 1: Toggle Theme
                    ws.send(JSON.stringify({
                        id: 3,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: `(() => {
                                const initialTheme = document.documentElement.getAttribute('data-theme');
                                const field = document.getElementById('nova-input-field');
                                const form = document.getElementById('nova-input-form');
                                field.value = 'toggle dark mode';
                                form.dispatchEvent(new Event('submit'));
                                return 'Initial theme: ' + initialTheme;
                            })()`
                        }
                    }));
                }
                
                if (msg.id === 3) {
                    console.log('THEME CMD INPUT:', msg.result.result.value);
                    
                    // Wait for toggle action to execute
                    setTimeout(() => {
                        ws.send(JSON.stringify({
                            id: 4,
                            method: 'Runtime.evaluate',
                            params: {
                                expression: `(() => {
                                    const newTheme = document.documentElement.getAttribute('data-theme');
                                    return 'New theme: ' + newTheme;
                                })()`
                            }
                        }));
                    }, 1500);
                }

                if (msg.id === 4) {
                    console.log('THEME CMD RESULT:', msg.result.result.value);
                    
                    // Command 2: Open project modal details
                    ws.send(JSON.stringify({
                        id: 5,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: `(() => {
                                const initialModal = document.getElementById('project-modal').classList.contains('open');
                                const field = document.getElementById('nova-input-field');
                                const form = document.getElementById('nova-input-form');
                                field.value = 'open weather dashboard project';
                                form.dispatchEvent(new Event('submit'));
                                return 'Initial modal state (open?): ' + initialModal;
                            })()`
                        }
                    }));
                }

                if (msg.id === 5) {
                    console.log('MODAL CMD INPUT:', msg.result.result.value);
                    
                    // Wait for modal action
                    setTimeout(() => {
                        ws.send(JSON.stringify({
                            id: 6,
                            method: 'Runtime.evaluate',
                            params: {
                                expression: `(() => {
                                    const newModal = document.getElementById('project-modal').classList.contains('open');
                                    const modalTitle = document.getElementById('modal-title').textContent;
                                    return 'New modal state (open?): ' + newModal + ', Title: ' + modalTitle;
                                })()`
                            }
                        }));
                    }, 1500);
                }

                if (msg.id === 6) {
                    console.log('MODAL CMD RESULT:', msg.result.result.value);
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
