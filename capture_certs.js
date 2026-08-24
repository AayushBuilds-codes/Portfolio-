const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

const PORT = 3006;
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
    console.log(`Server running on port ${PORT}`);
    launchEdge();
});

let edgeProcess = null;
function launchEdge() {
    const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
    edgeProcess = spawn(edgePath, [
        '--remote-debugging-port=9228',
        '--headless',
        '--disable-gpu',
        '--window-size=1200,1000',
        `http://127.0.0.1:${PORT}/index.html`
    ]);
    setTimeout(connectDevTools, 2000);
}

function connectDevTools() {
    http.get('http://127.0.0.1:9228/json/list', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const list = JSON.parse(data);
            const page = list.find(p => p.type === 'page');
            const ws = new WebSocket(page.webSocketDebuggerUrl);

            ws.on('open', () => {
                ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
                ws.send(JSON.stringify({ id: 2, method: 'Page.enable' }));
                
                // Scroll to certifications and reveal cards
                setTimeout(() => {
                    ws.send(JSON.stringify({
                        id: 3,
                        method: 'Runtime.evaluate',
                        params: {
                            expression: `(() => {
                                const el = document.getElementById('certifications');
                                if (el) {
                                    el.scrollIntoView();
                                    // Trigger reveal classes
                                    const reveals = el.querySelectorAll('.scroll-reveal');
                                    reveals.forEach(r => r.classList.add('show'));
                                    return 'Scrolled to certifications';
                                }
                                return 'Section not found';
                            })()`
                        }
                    }));
                }, 1000);
            });

            ws.on('message', (message) => {
                const msg = JSON.parse(message);
                
                if (msg.id === 3) {
                    console.log('SCROLL:', msg.result.result.value);
                    
                    // Capture screenshot
                    setTimeout(() => {
                        console.log('Capturing screenshot...');
                        ws.send(JSON.stringify({ id: 4, method: 'Page.captureScreenshot' }));
                    }, 500);
                }

                if (msg.id === 4 && msg.result && msg.result.data) {
                    const buffer = Buffer.from(msg.result.data, 'base64');
                    const screenshotPath = path.join(__dirname, 'screenshot_certs.png');
                    fs.writeFileSync(screenshotPath, buffer);
                    console.log(`Certifications screenshot saved to: ${screenshotPath}`);
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
