const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = 3003;
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
    console.log(`Test server running on port ${PORT}`);
    launchEdge();
});

let edgeProcess = null;
function launchEdge() {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    edgeProcess = spawn(edgePath, [
        '--remote-debugging-port=9225',
        '--headless',
        '--disable-gpu',
        `http://127.0.0.1:${PORT}/index.html`
    ]);
    setTimeout(connectDevTools, 2000);
}

function connectDevTools() {
    http.get('http://127.0.0.1:9225/json/list', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const list = JSON.parse(data);
            const page = list.find(p => p.type === 'page');
            const ws = new WebSocket(page.webSocketDebuggerUrl);

            ws.on('open', () => {
                ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
                
                // Click launcher, type question, submit, verify reply
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        id: 2,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: `(() => {
                                const launcher = document.getElementById('nova-launcher');
                                if (!launcher) return 'No launcher';
                                launcher.click();
                                const windowOpen = document.getElementById('nova-chat-window').classList.contains('open');
                                return 'Window open: ' + windowOpen;
                            })()`
                        }
                    }));
                }, 1000);
            });

            ws.on('message', (message) => {
                const msg = JSON.parse(message);
                if (msg.id === 2 && msg.result && msg.result.result) {
                    console.log('STEP 1 (Open Chat):', msg.result.result.value);
                    
                    // Step 2: Submit a question
                    ws.send(JSON.stringify({
                        id: 3,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: `(() => {
                                const field = document.getElementById('nova-input-field');
                                const form = document.getElementById('nova-input-form');
                                if (!field || !form) return 'No form';
                                field.value = 'What ML projects have you built?';
                                form.dispatchEvent(new Event('submit'));
                                return 'Submitted question';
                            })()`
                        }
                    }));
                }
                
                if (msg.id === 3 && msg.result && msg.result.result) {
                    console.log('STEP 2 (Send Query):', msg.result.result.value);
                    
                    // Step 3: Wait 2.5 seconds for reply and inspect DOM
                    setTimeout(() => {
                        ws.send(JSON.stringify({
                            id: 4,
                            method: 'Runtime.evaluate',
                            params: {
                                expression: `(() => {
                                    const messages = document.querySelectorAll('.nova-message-bubble');
                                    const res = [];
                                    messages.forEach(m => {
                                        res.push({
                                            sender: m.className.includes('user') ? 'user' : 'assistant',
                                            text: m.querySelector('.message-content').innerHTML
                                        });
                                    });
                                    return JSON.stringify(res);
                                })()`
                            }
                        }));
                    }, 2500);
                }

                if (msg.id === 4 && msg.result && msg.result.result) {
                    console.log('STEP 3 (Chat History):', msg.result.result.value);
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
