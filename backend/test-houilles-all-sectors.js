/**
 * Test : Recherche à Houilles avec "Tous les secteurs"
 * Doit retourner ~20 entreprises
 */

const sireneService = require('./services/sireneService');

async function testHouillesAllSectors() {
  console.log('🧪 Test : Houilles avec TOUS LES SECTEURS\n');

  const filters = {
    location: 'Houilles',
    // codeApe: undefined = pas de filtre sur le secteur
    nombre: 20
  };

  console.log('📋 Filtres:', filters);
  console.log('');

  try {
    const companies = await sireneService.searchCompanies(filters);

    console.log('\n✅ Résultats:');
    console.log(`   Entreprises trouvées: ${companies.length}`);
    console.log(`   Objectif: 20\n`);

    if (companies.length > 0) {
      console.log('📊 Aperçu des secteurs trouvés:');
      const secteurs = {};
      companies.forEach(c => {
        const ape = c.libelle_ape || 'Inconnu';
        secteurs[ape] = (secteurs[ape] || 0) + 1;
      });

      Object.entries(secteurs)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([ape, count]) => {
          console.log(`   - ${ape}: ${count} entreprise(s)`);
        });

      console.log('\n📋 Quelques exemples:');
      companies.slice(0, 5).forEach((c, i) => {
        console.log(`   ${i + 1}. ${c.nom} - ${c.libelle_ape}`);
      });
    } else {
      console.log('❌ Aucune entreprise trouvée !');
    }

    console.log('\n✅ Test terminé !');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    console.error(error.stack);
  }
}

testHouillesAllSectors();
