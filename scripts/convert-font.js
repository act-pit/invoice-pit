const fs = require('fs');
const path = require('path');

const fontPath = path.join(__dirname, '../public/fonts/NotoSansJP-Regular.ttf');
const outputPath = path.join(__dirname, '../src/lib/font-base64.ts');

if (!fs.existsSync(fontPath)) {
  console.error('フォントファイルが見つかりません:', fontPath);
  process.exit(1);
}

const fontBuffer = fs.readFileSync(fontPath);
const base64Font = fontBuffer.toString('base64');

const output = `// Auto-generated font file
export const NotoSansJPBase64 = '${base64Font}';
`;

fs.writeFileSync(outputPath, output);
console.log('✅ フォントをBase64に変換しました:', outputPath);
