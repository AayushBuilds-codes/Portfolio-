const fs = require('fs');
const content = fs.readFileSync('../js/app.js', 'utf8') + fs.readFileSync('../js/projects.js', 'utf8');
content.split('\n').forEach((line, idx) => {
    if (line.includes('querySelectorAll')) {
        console.log(`${idx + 1}: ${line.trim()}`);
    }
});
