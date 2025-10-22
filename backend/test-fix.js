/**
 * Test rapide pour vérifier que les entreprises sont trouvées
 */

const sireneService = require('./services/sireneService');

async function testFix() {
  console.log('Test de la correction...\n');

  const filters = {
    location: 'Paris',
    nombre: 10
  };

  try {
    const companies = await sireneService.searchCompanies(filters, null);

    console.log(`\n✅ ${companies.length} entreprises trouvées !`);
    if (companies.length > 0) {
      console.log(`\nExemples:`);
      companies.slice(0, 3).forEach((c, i) => {
        console.log(`  ${i + 1}. ${c.nom} (${c.code_postal}) - ${c.effectif}`);
      });
    }

  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

testFix().catch(console.error);
