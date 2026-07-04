const fs = require('fs');

let appTs = fs.readFileSync('src/App.tsx', 'utf8');

appTs = appTs.replace(
`  const handleAddCategory = async (name: string) => {
    const res = await secureFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur ajout catégorie');
    }
    await fetchData(false);
  };`,
`  const handleAddCategory = async (name: string, is_personal: boolean = false) => {
    const res = await secureFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, is_personal })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur ajout catégorie');
    }
    await fetchData(false);
  };

  const handleEditCategory = async (id: string, name: string, is_personal: boolean = false) => {
    const res = await secureFetch(\`/api/categories/\${id}\`, {
      method: 'PUT',
      body: JSON.stringify({ name, is_personal })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Erreur modification catégorie');
    }
    await fetchData(false);
  };`
);

appTs = appTs.replace(
`        <SettingsView
          currentRole={activeRole}
          onChangeRole={handleRoleChange}
          currentUser={currentUser}
          categories={categories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
        />`,
`        <SettingsView
          currentRole={activeRole}
          onChangeRole={handleRoleChange}
          currentUser={currentUser}
          categories={categories}
          onAddCategory={handleAddCategory}
          onDeleteCategory={handleDeleteCategory}
          onEditCategory={handleEditCategory}
        />`
);

fs.writeFileSync('src/App.tsx', appTs);
console.log('Fixed App.tsx');
