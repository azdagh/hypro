const fs = require('fs');
const path = require('path');

// Fix ProcurementView.tsx
let procContent = fs.readFileSync('src/components/ProcurementView.tsx', 'utf8');

const oldApprove = `  const handleApprovePR = async (id: string, status: 'Approved' | 'Rejected') => {
    setActioningId(id);
    try {
      await onUpdatePRStatus(id, status);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du Traitement de la DA');
    } finally {
      setActioningId(null);
    }
  };`;

const newApprove = `  const handleApprovePR = async (id: string, status: 'Approved' | 'Rejected') => {
    if (status === 'Approved') setApprovingId(id); else setRejectingId(id);
    try {
      await onUpdatePRStatus(id, status);
    } catch (err: any) {
      alert(err.message || 'Erreur lors du Traitement de la DA');
    } finally {
      setApprovingId(null); setRejectingId(null);
    }
  };`;

procContent = procContent.replace(oldApprove, newApprove);
procContent = procContent.replace(oldApprove.replace(/\r\n/g, '\n'), newApprove);
fs.writeFileSync('src/components/ProcurementView.tsx', procContent, 'utf8');
console.log('Fixed handleApprovePR in ProcurementView.tsx');

// Fix mojibake
function walkSync(currentDirPath, callback) {
    fs.readdirSync(currentDirPath).forEach(function (name) {
        var filePath = path.join(currentDirPath, name);
        var stat = fs.statSync(filePath);
        if (stat.isFile() && (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.js'))) {
            callback(filePath, stat);
        } else if (stat.isDirectory()) {
            walkSync(filePath, callback);
        }
    });
}

const mojibakeMap = {
    'Ã©': 'é',
    'Ã¨': 'è',
    'Ãª': 'ê',
    'Ã': 'à',
    'A©': 'é', // Sometimes it renders as A©
    'A¨': 'è',
    'Aª': 'ê',
    'A ': 'à',
    'dAcpense': 'dépense',
    'dAcpenses': 'dépenses',
    'DAcpense': 'Dépense',
    'DAcpenses': 'Dépenses',
    'clAc': 'clé',
    'gAcnAcrale': 'générale',
    'gAcnAcrer': 'générer',
    'mActier': 'métier',
    'rAcglage': 'réglage',
    'AStes-vous sAcr': 'Êtes-vous sûr',
    'sAcr': 'sûr',
    'SAccuritAc': 'Sécurité',
    'CrAcer': 'Créer',
    'crAcer': 'créer',
    'OpAcrational': 'Opérationnel',
    'TraitAcAc': 'Traité',
    'TraitAc': 'Traité',
    'DActails': 'Détails',
    'dAclai': 'délai',
    'BAnAnAfficiaire': 'Bénéficiaire',
    'bAnAnAfficiaire': 'bénéficiaire',
    'coAt': 'coût',
    'quantitAc': 'quantité',
    'QuantitAc': 'Quantité',
    'SuggAcrAc': 'Suggéré',
    'suggAcrAc': 'suggéré',
    'SuggÃ©rÃ©': 'Suggéré',
    'QuantitÃ©': 'Quantité',
    'dÃ©pense': 'dépense',
    'DÃ©pense': 'Dépense',
    'Ã ': 'à '
};

let filesChanged = 0;
walkSync('src', function(filePath, stat) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    for (const [bad, good] of Object.entries(mojibakeMap)) {
        content = content.split(bad).join(good);
    }
    
    // extra fix for standalone Ã
    content = content.split('Ã ').join('à ');

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        filesChanged++;
        console.log('Fixed mojibake in', filePath);
    }
});

console.log('Done. Files changed:', filesChanged);
