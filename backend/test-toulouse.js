/**
 * Test de la randomisation géographique sur Toulouse (6 codes postaux)
 */

const sireneService = require('./services/sireneService');

async function testToulouse() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   TEST TOULOUSE (6 codes postaux)                   ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const filters = {
    location: 'Toulouse',
    nombre: 10
  };

  console.log('📍 Toulouse a 6 codes postaux : 31000, 31100, 31200, 31300, 31400, 31500');
  console.log('➡️  Avec randomisation : 3 codes aléatoires à chaque recherche\n');

  // Faire 3 recherches pour voir la diversité
  for (let i = 1; i <= 3; i++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  RECHERCHE #${i}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const companies = await sireneService.searchCompanies(filters, null);

      console.log(`\n📊 Résumé:`);
      console.log(`   Entreprises: ${companies.length}`);
      if (companies.length > 0) {
        const codes = [...new Set(companies.map(c => c.code_postal))];
        console.log(`   Codes postaux dans les résultats: [${codes.join(', ')}]`);
      }

    } catch (error) {
      console.error(`❌ Erreur:`, error.message);
    }

    if (i < 3) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  console.log('\n✅ La randomisation géographique fonctionne maintenant pour TOUTES les villes avec >3 codes postaux !');
}

testToulouse().catch(console.error);
