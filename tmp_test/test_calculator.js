const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const WebSocket = require('ws');

// Verify server is already running on PORT 8080
const PORT = 8080;
console.log(`Connecting to calculator test at http://127.0.0.1:${PORT}/Calculator basic/index.html`);

let edgeProcess = null;
launchEdge();
function launchEdge() {
    const edgePaths = [
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
    ];
    
    let edgePath = edgePaths.find(fs.existsSync);
    if (!edgePath) {
        console.error('Microsoft Edge executable not found');
        process.exit(1);
    }

    console.log(`Spawning Edge from: ${edgePath}`);
    edgeProcess = spawn(edgePath, [
        '--remote-debugging-port=9228',
        '--headless',
        '--disable-gpu',
        '--disable-cache',
        `http://127.0.0.1:${PORT}/Calculator%20basic/index.html`
    ]);

    edgeProcess.on('error', (err) => {
        console.error('Failed to start Edge:', err);
        process.exit(1);
    });

    // Wait 3 seconds for Edge to initialize and load the page
    setTimeout(connectDevTools, 3000);
}

function connectDevTools() {
    http.get('http://127.0.0.1:9228/json/list', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const list = JSON.parse(data);
                const page = list.find(p => p.type === 'page');
                if (!page) {
                    console.error('No page target found');
                    cleanupAndExit(1);
                    return;
                }

                const wsUrl = page.webSocketDebuggerUrl;
                console.log(`Connecting WebSocket to: ${wsUrl}`);
                const ws = new WebSocket(wsUrl);

                ws.on('open', () => {
                    ws.send(JSON.stringify({ id: 1, method: 'Runtime.enable' }));
                    ws.send(JSON.stringify({ id: 2, method: 'Console.enable' }));
                    ws.send(JSON.stringify({ id: 3, method: 'Page.enable' }));
                    
                    // Run step 1: Click 7 + 8 =
                    setTimeout(() => {
                        ws.send(JSON.stringify({
                            id: 10,
                            method: 'Runtime.evaluate',
                            params: {
                                expression: `(() => {
                                    // Helper to find button by text content
                                    const clickBtn = (text) => {
                                        const btns = Array.from(document.querySelectorAll('.calc-btn'));
                                        const b = btns.find(btn => btn.textContent.trim() === text);
                                        if (b) {
                                            b.click();
                                            return true;
                                        }
                                        return false;
                                    };
                                    
                                    clickBtn('7');
                                    clickBtn('+');
                                    clickBtn('8');
                                    clickBtn('=');
                                    
                                    const outVal = document.getElementById('calc-output').textContent;
                                    const formulaVal = document.getElementById('calc-formula').textContent;
                                    return JSON.stringify({ formulaVal, outVal });
                                })()`
                            }
                        }));
                    }, 1000);
                });

                ws.on('message', (message) => {
                    const msg = JSON.parse(message);

                    // Track exceptions
                    if (msg.method === 'Runtime.exceptionThrown') {
                        const { exceptionDetails } = msg.params;
                        console.error('BROWSER EXCEPTION:', exceptionDetails.exception ? exceptionDetails.exception.description : exceptionDetails.text);
                        cleanupAndExit(1);
                        return;
                    }

                    if (msg.id === 10 && msg.result && msg.result.result) {
                        console.log('STEP 1 (Calculator evaluation results):', msg.result.result.value);

                        // Run step 2: Open Nova, type "calculate 5! * 2" and evaluate
                        ws.send(JSON.stringify({
                            id: 11,
                            method: 'Runtime.evaluate',
                            params: {
                                expression: `(() => {
                                    const launcher = document.getElementById('nova-launcher');
                                    if (launcher) launcher.click();
                                    
                                    const input = document.getElementById('nova-input-field');
                                    const form = document.getElementById('nova-input-form');
                                    if (input && form) {
                                        input.value = "calculate 5! * 2";
                                        form.dispatchEvent(new Event('submit'));
                                        return "Nova prompted with calculate command";
                                    }
                                    return "No Nova elements";
                                })()`
                            }
                        }));
                    }

                    if (msg.id === 11) {
                        console.log('STEP 2 (Nova Automation input):', msg.result.result.value);

                        // Wait 3 seconds for Nova to respond and calculator to execute
                        setTimeout(() => {
                            ws.send(JSON.stringify({
                                id: 12,
                                method: 'Runtime.evaluate',
                                params: {
                                    expression: `(() => {
                                        const outVal = document.getElementById('calc-output').textContent;
                                        const formulaVal = document.getElementById('calc-formula').textContent;
                                        
                                        // Retrieve last bubble message content
                                        const bubbles = document.querySelectorAll('.nova-message-bubble.assistant .message-content');
                                        const lastMsg = bubbles.length ? bubbles[bubbles.length - 1].textContent : '';
                                        
                                        return JSON.stringify({ formulaVal, outVal, lastMsg });
                                    })()`
                                }
                            }));
                        }, 3000);
                    }

                    if (msg.id === 12 && msg.result && msg.result.result) {
                        console.log('STEP 3 (Calculator automated evaluation results):', msg.result.result.value);

                        // Take screenshot
                        ws.send(JSON.stringify({
                            id: 20,
                            method: 'Page.captureScreenshot'
                        }));
                    }

                    if (msg.id === 20 && msg.result && msg.result.data) {
                        const buffer = Buffer.from(msg.result.data, 'base64');
                        const screenshotPath = path.join(__dirname, 'screenshot_calculator.png');
                        fs.writeFileSync(screenshotPath, buffer);
                        console.log(`Screenshot saved to: ${screenshotPath}`);
                        console.log('Test completed successfully!');
                        cleanupAndExit(0);
                    }
                });

            } catch (e) {
                console.error('DevTools WS processing error:', e);
                cleanupAndExit(1);
            }
        });
    }).on('error', (err) => {
        console.error('Failed to contact Edge:', err.message);
        cleanupAndExit(1);
    });
}

function cleanupAndExit(code) {
    if (edgeProcess) {
        try {
            edgeProcess.kill();
        } catch (e) {}
    }
    process.exit(code);
}
