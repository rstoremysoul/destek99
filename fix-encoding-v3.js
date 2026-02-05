const fs = require('fs');
const path = require('path');

const replacements = {
    '\u00C5\u009E': 'Ş', // Ş
    '\u00C4\u009E': 'Ğ', // Ğ
    '\u00C4\u00B0': 'İ', // İ
    '\u00C4\u00B1': 'ı', // ı
    '\u00C5\u009F': 'ş', // ş
    '\u00C4\u009F': 'ğ', // ğ
    '\u00C3\u00A7': 'ç', // ç
    '\u00C3\u0087': 'Ç', // Ç
    '\u00C3\u00B6': 'ö', // ö
    '\u00C3\u0096': 'Ö', // Ö
    '\u00C3\u00BC': 'ü', // ü
    '\u00C3\u009C': 'Ü', // Ü
    '\u00E2\u009C\u0093': '✓', // Checkmark (likely UTF-8 bytes E2 9C 93 interpreted as â œ “)
    '\u00E2\u009C\u0097': '✗', // Cross
    // Add common variations just in case
    'Ã§': 'ç',
    'Ã‡': 'Ç',
    'Ä±': 'ı',
    'Ä°': 'İ',
    'ÄŸ': 'ğ',
    'ÄĞ': 'Ğ',
    'Ã¶': 'ö',
    'Ã–': 'Ö',
    'ÅŸ': 'ş',
    'ÅŞ': 'Ş',
    'Ã¼': 'ü',
    'Ãœ': 'Ü'
};

function replaceInFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        let newContent = content;

        for (const [search, replace] of Object.entries(replacements)) {
            // Use a global regex to replace all occurrences
            // Escape special regex characters in the search string if any
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
