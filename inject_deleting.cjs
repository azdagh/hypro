const fs = require('fs');

function injectDeleteLoading(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes('const [deletingId, setDeletingId]')) return; // Already injected
  if (!content.includes('Trash2') && !content.includes('Supprimer')) return; // No delete button

  // Inject state
  content = content.replace(
    /(const \[.*?\] = useState.*?;)/,
    '$1\n  const [deletingId, setDeletingId] = useState<string | null>(null);'
  );

  // For ExpensesView
  content = content.replace(
    /onClick=\{\(\) => onDeleteExpense\((e\.id)\)\}([\s\S]*?)<Trash2 className="w-3\.5 h-3\.5" \/>/g,
    'onClick={async () => { setDeletingId($1); try { await onDeleteExpense($1); } finally { setDeletingId(null); } }} disabled={deletingId === $1}$2{deletingId === $1 ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}'
  );

  // For ProcurementView & InventoryView
  if (content.includes('const handleDelete = async (action: () => void, itemName: string)')) {
    content = content.replace(
      /const handleDelete = async \(action: \(\) => void, itemName: string\) => \{/,
      `const handleDelete = async (action: () => Promise<void> | void, itemName: string, id?: string) => {
    if (id) setDeletingId(id);`
    );
    content = content.replace(
      /await action\(\);[\s]*\}/,
      `await action();
    } finally {
      if (id) setDeletingId(null);
    }`
    );

    // Replace onClick and icon for PR
    content = content.replace(
      /onClick=\{\(\) => handleDelete\(\(\) => onDeletePurchaseRequest\?\.\((pr\.id)\), (.*?)\)\}([\s\S]*?)<Trash2 className="w-4 h-4" \/>/g,
      'onClick={() => handleDelete(() => onDeletePurchaseRequest?.($1), $2, $1)} disabled={deletingId === $1}$3{deletingId === $1 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}'
    );
    content = content.replace(
      /onClick=\{\(\) => handleDelete\(\(\) => onDeletePurchaseOrder\?\.\((po\.id)\), (.*?)\)\}([\s\S]*?)<Trash2 className="w-4 h-4" \/>/g,
      'onClick={() => handleDelete(() => onDeletePurchaseOrder?.($1), $2, $1)} disabled={deletingId === $1}$3{deletingId === $1 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}'
    );
    content = content.replace(
      /onClick=\{\(\) => handleDelete\(\(\) => onDeleteSubcontractor\?\.\((sub\.id)\), (.*?)\)\}([\s\S]*?)<Trash2 className="w-4 h-4" \/>/g,
      'onClick={() => handleDelete(() => onDeleteSubcontractor?.($1), $2, $1)} disabled={deletingId === $1}$3{deletingId === $1 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}'
    );
    content = content.replace(
      /onClick=\{\(\) => handleDelete\(\(\) => onDeletePartner\?\.\((partner\.id)\), (.*?)\)\}([\s\S]*?)<Trash2 className="w-4 h-4" \/>/g,
      'onClick={() => handleDelete(() => onDeletePartner?.($1), $2, $1)} disabled={deletingId === $1}$3{deletingId === $1 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}'
    );
    // InventoryView replacements
    content = content.replace(
      /onClick=\{\(\) => handleDelete\(\(\) => onDeleteStockItem\?\.\((s\.id)\), (.*?)\)\}([\s\S]*?)<Trash2 className="w-4 h-4" \/>/g,
      'onClick={() => handleDelete(() => onDeleteStockItem?.($1), $2, $1)} disabled={deletingId === $1}$3{deletingId === $1 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}'
    );
    content = content.replace(
      /onClick=\{\(\) => handleDelete\(\(\) => onDeleteEquipment\?\.\((e\.id)\), (.*?)\)\}([\s\S]*?)<Trash2 className="w-4 h-4" \/>/g,
      'onClick={() => handleDelete(() => onDeleteEquipment?.($1), $2, $1)} disabled={deletingId === $1}$3{deletingId === $1 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}'
    );
  }

  // Ensure RefreshCw is imported
  if (!content.includes('RefreshCw')) {
    content = content.replace(/import \{(.*?)\} from 'lucide-react';/, 'import {$1, RefreshCw} from \'lucide-react\';');
  }

  fs.writeFileSync(filePath, content, 'utf8');
}

['src/components/ExpensesView.tsx', 'src/components/ProcurementView.tsx', 'src/components/InventoryView.tsx'].forEach(f => {
  injectDeleteLoading(f);
  console.log('Processed', f);
});

