const fs = require('fs');
const content = fs.readFileSync('../index.html', 'utf8');
console.log('id="projects" exists:', content.includes('id="projects"'));
console.log('id=\'projects\' exists:', content.includes("id='projects'"));
const matches = content.match(/id="[^"]*"/g);
console.log('All IDs:', matches);
