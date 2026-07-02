const fs = require('fs');

let content = fs.readFileSync('src/components/ProjectsView.tsx', 'utf8');

console.log('File length:', content.length);
console.log('Has reader.onerror:', content.includes('reader.onerror'));
console.log('Has setIsUploadingFile:', content.includes('setIsUploadingFile'));
console.log('Has previewUrl:', content.includes('previewUrl'));
console.log('Has ArrowUpRight:', content.includes('ArrowUpRight'));

// Find index of key sections
const uploadStart = content.indexOf('const handleFileUpload');
const uploadEnd = content.indexOf('const handleDeleteFile');
console.log('\nUpload handler (chars', uploadStart, 'to', uploadEnd, '):\n');
console.log(content.substring(uploadStart, uploadEnd));
