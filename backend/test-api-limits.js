/**
 * Test pour comprendre les limites de l'API
 */

const axios = require('axios');

const BASE_URL = 'https://recherche-entreprises.api.gouv.fr';

async function testPageLimit(page, codePostal) {
  try {
    const params = {
      code_postal: codePostal,
      per_page: 25,
      page: page,
      est_entrepreneur_individuel: false,
      tranche_effectif_salarie: '12,21,22,31,32,41,42,51,52,53',
      etat_administratif: 'A'
    };

    const response = await axios.get(`${BASE_URL}/search`, { params });
    return {
      page,
      success: true,
      count: response.data.results?.length || 0,
      total: response.data.total_results || 0
    };
  } catch (error) {
    return {
      page,
      success: false,
      error: error.response?.status || error.message
    };
  }
}

async function testWithDifferentZones() {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   TEST DES LIMITES ET ZONES GÉOGRAPHIQUES           ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  // Test 1 : Limites avec tous les arrondissements de Paris
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1 : Tous les arrondissements de Paris');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const allParis = '75001,75002,75003,75004,75005,75006,75007,75008,75009,75010,75011,75012,75013,75014,75015,75016,75017,75018,75019,75020';

  const testPages = [1, 100, 200, 250, 300];
  for (const page of testPages) {
    const result = await testPageLimit(page, allParis);
    console.log(`Page ${page}: ${result.success ? `✅ ${result.count} résultats (total: ${result.total})` : `❌ ${result.error}`}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Test 2 : Un seul arrondissement
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2 : Un seul arrondissement (75008)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const page of testPages) {
    const result = await testPageLimit(page, '75008');
    console.log(`Page ${page}: ${result.success ? `✅ ${result.count} résultats (total: ${result.total})` : `❌ ${result.error}`}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Test 3 : Plusieurs arrondissements différents
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3 : 3 arrondissements (75001,75008,75016)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  for (const page of testPages) {
    const result = await testPageLimit(page, '75001,75008,75016');
    console.log(`Page ${page}: ${result.success ? `✅ ${result.count} résultats (total: ${result.total})` : `❌ ${result.error}`}`);
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║                    CONCLUSIONS                        ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('\n💡 STRATÉGIE RECOMMANDÉE :');
  console.log('   1. Au lieu de chercher dans TOUS les arrondissements,');
  console.log('   2. Randomiser d\'abord 2-3 arrondissements');
  console.log('   3. Puis randomiser les pages dans ces arrondissements');
  console.log('   4. = Accès à beaucoup plus d\'entreprises uniques !');
}

testWithDifferentZones().catch(console.error);
