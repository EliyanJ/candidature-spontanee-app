/**
 * Test complet : Randomisation géographique + pages
 * Vérifier que chaque recherche pioche dans des pools très différents
 */

const sireneService = require('./services/sireneService');

async function testFullRandomization() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   TEST RANDOMISATION COMPLÈTE (GÉO + PAGES)         ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  const filters = {
    location: 'Paris', // Ville avec 20 arrondissements
    nombre: 10 // Demander 10 entreprises
  };

  const results = [];

  // Faire 5 recherches successives pour voir la diversité
  for (let i = 1; i <= 5; i++) {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  RECHERCHE #${i}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);

    try {
      const companies = await sireneService.searchCompanies(filters, null);

      results.push({
        searchNumber: i,
        companies: companies,
        sirens: companies.map(c => c.siren),
        arrondissements: [...new Set(companies.map(c => c.code_postal))]
      });

      console.log(`\n📊 Résumé recherche #${i}:`);
      console.log(`   Entreprises: ${companies.length}`);
      console.log(`   Premier: ${companies[0]?.nom} (${companies[0]?.code_postal})`);
      console.log(`   Dernier: ${companies[companies.length - 1]?.nom} (${companies[companies.length - 1]?.code_postal})`);
      console.log(`   Arrondissements dans les résultats: [${results[i-1].arrondissements.join(', ')}]`);

    } catch (error) {
      console.error(`❌ Erreur recherche #${i}:`, error.message);
    }

    // Attendre 500ms entre chaque recherche
    if (i < 5) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // Analyser la diversité
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║              ANALYSE DE LA DIVERSITÉ                 ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Comparer les SIREN entre toutes les recherches
  const allSirens = results.map(r => new Set(r.sirens || []));

  let totalComparisons = 0;
  let totalCommon = 0;

  for (let i = 0; i < results.length; i++) {
    for (let j = i + 1; j < results.length; j++) {
      const common = [...allSirens[i]].filter(s => allSirens[j].has(s));
      totalComparisons++;
      totalCommon += common.length;

      console.log(`🔍 Recherche ${i+1} vs ${j+1}:`);
      console.log(`   Entreprises communes: ${common.length}/10`);
      console.log(`   Taux de diversité: ${(100 - (common.length / 10) * 100).toFixed(1)}%`);
    }
  }

  // Union de tous les SIREN uniques
  const allUniqueSirens = new Set();
  results.forEach(r => r.sirens.forEach(s => allUniqueSirens.add(s)));
  const totalRequested = results.length * 10;

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`📊 STATISTIQUES GLOBALES:`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`   Total d'entreprises demandées: ${totalRequested}`);
  console.log(`   Total d'entreprises uniques: ${allUniqueSirens.size}`);
  console.log(`   Taux de diversité global: ${(allUniqueSirens.size / totalRequested * 100).toFixed(1)}%`);
  console.log(`   Moyenne de doublons: ${(totalCommon / totalComparisons).toFixed(1)} par paire`);

  // Analyser les arrondissements utilisés
  const allArrondissements = new Set();
  results.forEach(r => r.arrondissements.forEach(a => allArrondissements.add(a)));

  console.log(`\n🗺️  COUVERTURE GÉOGRAPHIQUE:`);
  console.log(`   Arrondissements distincts visités: ${allArrondissements.size}/20`);
  console.log(`   Arrondissements: [${[...allArrondissements].sort().join(', ')}]`);

  // Verdict
  console.log(`\n╔═══════════════════════════════════════════════════════╗`);
  console.log(`║                     VERDICT                          ║`);
  console.log(`╚═══════════════════════════════════════════════════════╝`);

  if (allUniqueSirens.size >= totalRequested * 0.95) {
    console.log(`\n✅ EXCELLENT ! ${((allUniqueSirens.size / totalRequested) * 100).toFixed(0)}% d'entreprises uniques !`);
    console.log(`   La double randomisation (géo + pages) fonctionne parfaitement.`);
    console.log(`   Pool estimé accessible: ~150 000 entreprises`);
  } else if (allUniqueSirens.size >= totalRequested * 0.85) {
    console.log(`\n✅ TRÈS BON ! ${((allUniqueSirens.size / totalRequested) * 100).toFixed(0)}% d'entreprises uniques.`);
    console.log(`   Très bonne diversité avec quelques doublons occasionnels.`);
  } else if (allUniqueSirens.size >= totalRequested * 0.70) {
    console.log(`\n⚠️  BON : ${((allUniqueSirens.size / totalRequested) * 100).toFixed(0)}% d'entreprises uniques.`);
    console.log(`   Diversité correcte mais il y a encore des doublons.`);
  } else {
    console.log(`\n❌ INSUFFISANT : Seulement ${((allUniqueSirens.size / totalRequested) * 100).toFixed(0)}% d'entreprises uniques.`);
    console.log(`   La randomisation ne fonctionne pas comme prévu.`);
  }

  console.log('\n');
}

testFullRandomization().catch(console.error);
