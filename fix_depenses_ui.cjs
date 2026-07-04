const fs = require('fs');

let content = fs.readFileSync('src/components/ExpensesView.tsx', 'utf8');

// 1. Fix the upload logic (don't set both states)
const oldUploadState = `          // Save uploaded references for both forms
          setExpReceiptUrl(receiptUrl);
          setExpReceiptFileId(uploadData.fileId);
          setAllocReceiptUrl(receiptUrl);
          setAllocReceiptFileId(uploadData.fileId);`;

const newUploadState = `          // Save uploaded references only for the active form
          if (isAllocFormOpen) {
            setAllocReceiptUrl(receiptUrl);
            setAllocReceiptFileId(uploadData.fileId);
          } else {
            setExpReceiptUrl(receiptUrl);
            setExpReceiptFileId(uploadData.fileId);
          }`;

content = content.replace(oldUploadState, newUploadState);
content = content.replace(oldUploadState.replace(/\r\n/g, '\n'), newUploadState);

// 2. Clear state when opening modals
// Expenses Button
content = content.replace(
  'onClick={() => setIsExpenseFormOpen(true)}',
  `onClick={() => { setIsExpenseFormOpen(true); setUploadedFileName(null); setExpReceiptFileId(''); setExpReceiptUrl(''); setLocalImageForScan(''); setUploadError(null); setScanStatus('idle'); }}`
);

// Allocations Button
content = content.replace(
  'onClick={() => setIsAllocFormOpen(true)}',
  `onClick={() => { setIsAllocFormOpen(true); setUploadedFileName(null); setAllocReceiptFileId(''); setAllocReceiptUrl(''); setLocalImageForScan(''); setUploadError(null); setScanStatus('idle'); }}`
);

// 3. Remove Projet Destinataire column from allocations table
// Remove header
content = content.replace(
  /<th className="p-4 font-semibold">Projet Destinataire<\/th>/g,
  ''
);

// Remove the data cell. First, match the mapping block
// The row has:
// <tr key={a.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20" id={\`alloc-row-\${a.id}\`}>
//   <td className="p-4 font-semibold">
//     {proj ? proj.name : 'Projet Supprimé'}
//   </td>
// ...
const oldTdBlock = `<tr key={a.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20" id={\`alloc-row-\${a.id}\`}>
                        <td className="p-4 font-semibold">
                          {proj ? proj.name : 'Projet Supprimé'}
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-500">`;
const oldTdBlock2 = `<tr key={a.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20" id={\`alloc-row-\${a.id}\`}>
                        <td className="p-4 font-semibold">
                          {proj ? proj.name : 'Projet SupprimAc'}
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-500">`;

const newTdBlock = `<tr key={a.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-800/20" id={\`alloc-row-\${a.id}\`}>
                        <td className="p-4 whitespace-nowrap text-slate-500">`;

content = content.replace(oldTdBlock, newTdBlock);
content = content.replace(oldTdBlock.replace(/\r\n/g, '\n'), newTdBlock);
content = content.replace(oldTdBlock2, newTdBlock);
content = content.replace(oldTdBlock2.replace(/\r\n/g, '\n'), newTdBlock);

// Remove the const proj = projects.find if it's unused, or just leave it.

fs.writeFileSync('src/components/ExpensesView.tsx', content, 'utf8');
console.log('Fixed ExpensesView.tsx UI issues');
