const fs = require('fs');
const path = require('path');

const replacements = {
    'Åž': 'Ş',
    'Äž': 'Ğ',
    'Ã§': 'ç',
    'Ã‡': 'Ç',
    'Ä±': 'ı',
    'Ä°': 'İ',
    'ÄŸ': 'ğ',
    'Ã¶': 'ö',
    'Ã–': 'Ö',
    'ÅŸ': 'ş',
    'Ã¼': 'ü',
    'Ãœ': 'Ü',
    'âœ“': '✓',
    'âœ—': '✗',
    'Ã¢': 'â',
    'Ã®': 'î',
    'Ã»': 'û',
    'Ã‚': 'Â',
    'ÃŽ': 'Î',
    'Ã›': 'Û'
};

function replaceInFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        for (const [search, replace] of Object.entries(replacements)) {
            // Use a global regex to replace all occurrences
            const regex = new RegExp(search, 'g');
            newContent = newContent.replace(regex, replace);
        }

        if (content !== newContent) {
            fs.writeFileSync(filePath, newContent, 'utf8');
            console.log(`Fixed: ${filePath}`);
        }
    } catch (err) {
        console.error(`Error processing ${filePath}:`, err);
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            walkDir(filePath);
        } else {
            if (filePath.endsWith('.ts') || filePath.endsWith('.tsx') || filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
                replaceInFile(filePath);
            }
        }
    }
}

const srcDir = path.join(__dirname, 'src');
console.log(`Scanning ${srcDir}...`);
walkDir(srcDir);
console.log('Done.');
