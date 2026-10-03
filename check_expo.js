const fs = require('fs');
const path = require('path');

const expoPath = path.join(__dirname, 'node_modules', 'expo');
console.log('expo exists:', fs.existsSync(expoPath));
console.log('expo/package.json:', fs.existsSync(path.join(expoPath, 'package.json')));
console.log('expo/bin/cli:', fs.existsSync(path.join(expoPath, 'bin', 'cli')));
console.log('expo/bin/autolinking:', fs.existsSync(path.join(expoPath, 'bin', 'autolinking')));

try {
  const pkg = require('./node_modules/expo/package.json');
  console.log('expo version:', pkg.version);
  console.log('expo bin:', pkg.bin);
} catch (e) {
  console.log('Error reading package.json:', e.message);
}

const atExpoCli = path.join(__dirname, 'node_modules', '@expo', 'cli');
console.log('@expo/cli exists:', fs.existsSync(atExpoCli));

if (fs.existsSync(atExpoCli)) {
  console.log('@expo/cli contents:', fs.readdirSync(atExpoCli));
}