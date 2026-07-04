const fs = require('fs');

let content = fs.readFileSync('src/components/ExpensesView.tsx', 'utf8');

const regex = /<td className="p-4 font-semibold">\s*\{proj \? proj\.name : '[^']+'\}\s*<span className="text-\[10px\] text-slate-400 font-mono block">\{proj \? proj\.code : ''\}<\/span>\s*<\/td>/g;

if (regex.test(content)) {
    content = content.replace(regex, '');
    fs.writeFileSync('src/components/ExpensesView.tsx', content, 'utf8');
    console.log("Successfully removed project td.");
} else {
    console.log("Regex did not match.");
}
