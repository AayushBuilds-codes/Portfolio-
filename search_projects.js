const fs = require('fs');
const content = fs.readFileSync('../js/app.js', 'utf8');
content.split('\n').forEach((line, idx) => {
    if (line.toLowerCase().includes('projects')) {
        console.log(`${idx + 1}: ${line.trim()}`);
    }
});
