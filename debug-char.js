const fs = require('fs');
const content = fs.readFileSync('src/components/location-form-dialog.tsx', 'utf8');
const lines = content.split('\n');
const line = lines[79]; // Line 80 (0-indexed 79)
console.log('Line content:', line);
for (let i = 0; i < line.length; i++) {
    console.log(line[i], line.charCodeAt(i).toString(16));
}
