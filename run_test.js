const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

// 1. Start a simple HTTP server to serve the Portfolio directory
const PORT = 3000;
const server = http.createServer((req, res) => {
    console.log(`[SERVER REQUEST] ${req.url}`);
    // Resolve file path relative to the parent Portfolio directory
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
            console.log(`[SERVER 404] ${req.url}`);
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        
        // Content-type matching
        let contentType = 'text/html';
        if (filePath.endsWith('.js')) contentType = 'application/javascript';
        else if (filePath.endsWith('.css')) contentType = 'text/css';
        else if (filePath.endsWith('.png')) contentType = 'image/png';
        else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(data);
    });
});

server.listen(PORT, '127.0.0.1', () => {
    console.log(`HTTP Server running at http://127.0.0.1:${PORT}`);
    launchEdge();
});

// 2. Launch Microsoft Edge in headless debugging mode
let edgeProcess = null;
function launchEdge() {
    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    
    let edgePath = edgePaths.find(fs.existsSync);
    if (!edgePath) {
        console.error('Microsoft Edge executable not found');
        cleanupAndExit(1);
        return;
    }

    console.log(`Spawning Edge from: ${edgePath}`);
    const fileUrl = 'file:///C:/Users/aayus/OneDrive/Pinnacle/Portfolio/index.html';
    console.log(`Navigating to: ${fileUrl}`);
    edgeProcess = spawn(edgePath, [
        '--remote-debugging-port=9222',
        '--headless',
        '--disable-gpu',
        '--disable-cache',
        '--disk-cache-size=1',
        '--media-cache-size=1',
        '--window-size=1920,5000',
        fileUrl
    ]);

    edgeProcess.on('error', (err) => {
        console.error('Failed to start Edge:', err);
        cleanupAndExit(1);
    });

    // Wait 2 seconds for Edge to initialize, then connect DevTools
    setTimeout(connectDevTools, 2000);
}

// 3. Connect to Edge DevTools Protocol over WebSocket
function connectDevTools() {
    http.get('http://127.0.0.1:9222/json/list', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const list = JSON.parse(data);
                const page = list.find(p => p.type === 'page');
                if (!page || !page.webSocketDebuggerUrl) {
                    console.error('No debugging page found in Edge json/list:', data);
                    cleanupAndExit(1);
                    return;
                }

                const wsUrl = page.webSocketDebuggerUrl;
                console.log(`Connecting to WebSocket: ${wsUrl}`);
                const ws = new WebSocket(wsUrl);

                ws.on('open', () => {
                    // Enable Console, Runtime, and Page domains
                    ws.send(JSON.stringify({ id: 1, method: 'Console.enable' }));
                    ws.send(JSON.stringify({ id: 2, method: 'Runtime.enable' }));
                    ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
                    console.log('DevTools Protocol sessions enabled. Monitoring logs...');
                });

                ws.on('message', (message) => {
                    const msg = JSON.parse(message);
                    
                    // Capture console API calls
                    if (msg.method === 'Console.messageAdded') {
                        const { text, level, source } = msg.params.message;
                        console.log(`[BROWSER CONSOLE] [${level.toUpperCase()}] ${text} (source: ${source})`);
                    }

                    // Capture unhandled JS exceptions
                    if (msg.method === 'Runtime.exceptionThrown') {
                        const { exceptionDetails } = msg.params;
                        const text = exceptionDetails.exception ? exceptionDetails.exception.description : exceptionDetails.text;
                        console.error(`\n!!! [BROWSER EXCEPTION] !!!`);
                        console.error(text);
                        console.error(`Line: ${exceptionDetails.lineNumber}, Col: ${exceptionDetails.columnNumber}`);
                        if (exceptionDetails.url) console.error(`Source URL: ${exceptionDetails.url}`);
                        console.error(`!!!!!!!!!!!!!!!!!!!!!!!!!!!\n`);
                    }

                    // Handle screenshot response
                    if (msg.id === 4 && msg.result && msg.result.data) {
                        const buffer = Buffer.from(msg.result.data, 'base64');
                        const screenshotPath = path.join(__dirname, 'screenshot.png');
                        fs.writeFileSync(screenshotPath, buffer);
                        console.log(`Screenshot saved to: ${screenshotPath}`);
                    }
                });

                ws.on('error', (err) => {
                    console.error('WebSocket Error:', err);
                });

                // Run for 5 seconds, capture screenshot, then exit
                setTimeout(() => {
                    console.log('Capturing screenshot...');
                    ws.send(JSON.stringify({ id: 4, method: 'Page.captureScreenshot' }));
                }, 3000);

                setTimeout(() => {
                    console.log('Test completed.');
                    cleanupAndExit(0);
                }, 5000);

            } catch (e) {
                console.error('Failed to parse Edge JSON target list:', e);
                cleanupAndExit(1);
            }
        });
    }).on('error', (err) => {
        console.error('Failed to reach Edge debugging port:', err.message);
        cleanupAndExit(1);
    });
}

function cleanupAndExit(code) {
    console.log('Cleaning up processes...');
    if (edgeProcess) {
        try {
            edgeProcess.kill();
        } catch (e) {}
    }
    server.close(() => {
        console.log('HTTP Server closed.');
        process.exit(code);
    });
}
