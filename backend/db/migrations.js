const { db } = require('./database');

/**
 * Migration pour ajouter les nouveaux champs dans la table companies
 */
function migrateCompaniesTable() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // Vérifier quelles colonnes existent déjà
      db.all("PRAGMA table_info(companies)", [], (err, columns) => {
        if (err) {
          console.error('Erreur lors de la vérification des colonnes:', err);
          reject(err);
          return;
        }

        const existingColumns = columns.map(col => col.name);

        // Liste des nouvelles colonnes à ajouter
        const newColumns = [
          { name: 'effectif_code', type: 'TEXT' },
          { name: 'dirigeant_nom', type: 'TEXT' },
          { name: 'dirigeant_prenoms', type: 'TEXT' },
          { name: 'dirigeant_fonction', type: 'TEXT' },
          { name: 'chiffre_affaires', type: 'INTEGER' },
          { name: 'resultat_net', type: 'INTEGER' },
          { name: 'categorie_entreprise', type: 'TEXT' },
          { name: 'latitude', type: 'REAL' },
          { name: 'longitude', type: 'REAL' },
          { name: 'convention_collective', type: 'TEXT' },
          { name: 'labels', type: 'TEXT' },
          { name: 'nombre_etablissements', type: 'INTEGER' },
          { name: 'etat_administratif', type: 'TEXT' },
          { name: 'nature_juridique', type: 'TEXT' },
          { name: 'date_mise_a_jour', type: 'TEXT' }
        ];

        // Ajouter uniquement les colonnes qui n'existent pas encore
        const promises = [];
        newColumns.forEach(column => {
          if (!existingColumns.includes(column.name)) {
            console.log(`➕ Ajout de la colonne '${column.name}'`);
            const promise = new Promise((res, rej) => {
              db.run(
                `ALTER TABLE companies ADD COLUMN ${column.name} ${column.type}`,
                (err) => {
                  if (err) {
                    console.error(`❌ Erreur ajout ${column.name}:`, err.message);
                    rej(err);
                  } else {
                    console.log(`✅ Colonne '${column.name}' ajoutée`);
                    res();
                  }
                }
              );
            });
            promises.push(promise);
          }
        });

        if (promises.length === 0) {
          console.log('✅ Aucune migration nécessaire - toutes les colonnes existent déjà');
          resolve();
        } else {
          Promise.all(promises)
            .then(() => {
              console.log('✅ Migration terminée avec succès');
              resolve();
            })
            .catch(reject);
        }
      });
    });
  });
}

// Exécuter la migration si ce fichier est appelé directement
if (require.main === module) {
  console.log('🔄 Démarrage de la migration...');
  migrateCompaniesTable()
    .then(() => {
      console.log('✅ Migration réussie');
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Erreur migration:', err);
      process.exit(1);
    });
}

module.exports = { migrateCompaniesTable };
