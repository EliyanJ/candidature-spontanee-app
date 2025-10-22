/**
 * Script de test pour vérifier la diversité des résultats avec randomisation
 */

const sireneService = require('./services/sireneService');

async function testRandomization() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   TEST DE DIVERSITÉ AVEC RANDOMISATION DES PAGES    ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const filters = {
    location: 'Paris',
    nombre: 10 // Demander 10 entreprises
  };

  const results = [];

  // Faire 3 recherches successives
  for (let i = 1; i <= 3; i++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  RECHERCHE #${i}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const companies = await sireneService.searchCompanies(filters, null);

      results.push({
        searchNumber: i,
        companies: companies,
        sirens: companies.map(c => c.siren)
      });

      console.log(`\n📊 Résumé recherche #${i}:`);
      console.log(`   ${companies.length} entreprises récupérées`);
      console.log(`   Premier SIREN: ${companies[0]?.siren}`);
      console.log(`   Dernier SIREN: ${companies[companies.length - 1]?.siren}`);

    } catch (error) {
      console.error(`❌ Erreur recherche #${i}:`, error.message);
    }

    // Attendre 500ms entre chaque recherche
    if (i < 3) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Analyser la diversité
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║              ANALYSE DE LA DIVERSITÉ                 ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Comparer les SIREN entre les recherches
  const search1Sirens = new Set(results[0]?.sirens || []);
  const search2Sirens = new Set(results[1]?.sirens || []);
  const search3Sirens = new Set(results[2]?.sirens || []);

  // Intersection recherche 1 & 2
  const common12 = [...search1Sirens].filter(s => search2Sirens.has(s));
  console.log(`🔍 Recherche 1 vs 2:`);
  console.log(`   Entreprises communes: ${common12.length}/${results[0]?.sirens.length || 0}`);
  console.log(`   Taux de renouvellement: ${(100 - (common12.length / (results[0]?.sirens.length || 1)) * 100).toFixed(1)}%`);

  // Intersection recherche 2 & 3
  const common23 = [...search2Sirens].filter(s => search3Sirens.has(s));
  console.log(`\n🔍 Recherche 2 vs 3:`);
  console.log(`   Entreprises communes: ${common23.length}/${results[1]?.sirens.length || 0}`);
  console.log(`   Taux de renouvellement: ${(100 - (common23.length / (results[1]?.sirens.length || 1)) * 100).toFixed(1)}%`);

  // Intersection recherche 1 & 3
  const common13 = [...search1Sirens].filter(s => search3Sirens.has(s));
  console.log(`\n🔍 Recherche 1 vs 3:`);
  console.log(`   Entreprises communes: ${common13.length}/${results[0]?.sirens.length || 0}`);
  console.log(`   Taux de renouvellement: ${(100 - (common13.length / (results[0]?.sirens.length || 1)) * 100).toFixed(1)}%`);

  // Union de tous les SIREN uniques
  const allSirens = new Set([...search1Sirens, ...search2Sirens, ...search3Sirens]);
  const totalRequested = (results[0]?.sirens.length || 0) * 3;

  console.log(`\n📊 STATISTIQUES GLOBALES:`);
  console.log(`   Total d'entreprises demandées: ${totalRequested}`);
  console.log(`   Total d'entreprises uniques: ${allSirens.size}`);
  console.log(`   Taux de diversité: ${(allSirens.size / totalRequested * 100).toFixed(1)}%`);

  if (allSirens.size === totalRequested) {
    console.log(`\n✅ EXCELLENT ! Aucune entreprise en double sur les 3 recherches !`);
    console.log(`   La randomisation des pages fonctionne parfaitement.`);
  } else if (allSirens.size >= totalRequested * 0.9) {
    console.log(`\n✅ TRÈS BON ! ${((allSirens.size / totalRequested) * 100).toFixed(0)}% d'entreprises uniques.`);
    console.log(`   La randomisation améliore grandement la diversité.`);
  } else if (allSirens.size >= totalRequested * 0.7) {
    console.log(`\n⚠️  BON : ${((allSirens.size / totalRequested) * 100).toFixed(0)}% d'entreprises uniques.`);
    console.log(`   Il y a encore quelques doublons mais c'est acceptable.`);
  } else {
    console.log(`\n❌ INSUFFISANT : Seulement ${((allSirens.size / totalRequested) * 100).toFixed(0)}% d'entreprises uniques.`);
    console.log(`   La randomisation ne fonctionne pas comme prévu.`);
  }

  console.log('\n');
}

testRandomization().catch(console.error);
