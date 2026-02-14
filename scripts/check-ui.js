const fs = require('fs');
const path = require('path');

const uiPath = path.join(process.cwd(), 'src', 'components', 'ui');
const components = ['checkbox.tsx', 'dropdown-menu.tsx', 'dialog.tsx', 'badge.tsx', 'table.tsx', 'card.tsx'];

console.log('--- UI COMPONENT CHECK ---');
components.forEach(c => {
    const exists = fs.existsSync(path.join(uiPath, c));
    console.log(`${c}: ${exists ? '✅ OK' : '❌ MISSING'}`);
});
