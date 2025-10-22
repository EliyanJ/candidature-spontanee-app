/**
 * Script de test pour vérifier l'accès aux différentes pages de l'API
 */

const axios = require('axios');

const BASE_URL = 'https://recherche-entreprises.api.gouv.fr';

async function testPage(pageNumber) {
  try {
    console.log(`\n🔍 Test de la page ${pageNumber}...`);

    const params = {
      code_postal: '75001,75002,75003,75004,75005', // Paris
      per_page: 25,
      page: pageNumber,
      est_entrepreneur_individuel: false,
      tranche_effectif_salarie: '12,21,22,31,32,41,42,51,52,53', // >= 20 employés
      etat_administratif: 'A'
    };

    const response = await axios.get(`${BASE_URL}/search`, { params });
    const results = response.data.results || [];

    console.log(`✅ Page ${pageNumber} : ${results.length} entreprises récupérées`);

    // Afficher quelques infos sur la première entreprise pour vérifier
    if (results.length > 0) {
      const first = results[0];
      console.log(`   Exemple: ${first.nom_complet || first.nom_raison_sociale} (${first.siren})`);
    }

    return {
      page: pageNumber,
      count: results.length,
      success: true,
      siren: results[0]?.siren || null
    };

  } catch (error) {
    if (error.response?.status === 429) {
      console.log(`⚠️  Rate limit atteint à la page ${pageNumber}`);
      return { page: pageNumber, success: false, reason: 'rate_limit' };
    } else if (error.response?.status === 404) {
      console.log(`❌ Page ${pageNumber} : Non trouvée (probablement au-delà du max)`);
      return { page: pageNumber, success: false, reason: 'not_found' };
    } else {
      console.log(`❌ Erreur page ${pageNumber}:`, error.message);
      return { page: pageNumber, success: false, reason: error.message };
    }
  }
}

async function main() {
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║   TEST DE L\'ACCÈS AUX PAGES DE L\'API        ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  // Test de pages progressives
  const pagesToTest = [1, 5, 10, 20, 50, 100, 200, 500];
  const results = [];

  for (const pageNum of pagesToTest) {
    const result = await testPage(pageNum);
    results.push(result);

    // Attendre 300ms entre chaque requête pour éviter le rate limit
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              RÉSULTATS DU TEST               ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  const successPages = results.filter(r => r.success);
  const failedPages = results.filter(r => !r.success);

  console.log(`✅ Pages accessibles : ${successPages.length}/${results.length}`);
  console.log(`   Pages testées avec succès : ${successPages.map(r => r.page).join(', ')}`);

  if (failedPages.length > 0) {
    console.log(`\n❌ Pages échouées : ${failedPages.length}`);
    failedPages.forEach(r => {
      console.log(`   Page ${r.page} : ${r.reason}`);
    });
  }

  // Trouver la limite
  const maxSuccessPage = Math.max(...successPages.map(r => r.page));
  console.log(`\n📊 Page max accessible : ${maxSuccessPage}`);

  // Vérifier si les SIREN sont différents
  const sirens = successPages.map(r => r.siren).filter(s => s);
  const uniqueSirens = new Set(sirens);
  console.log(`\n🎲 Diversité des résultats : ${uniqueSirens.size}/${sirens.length} SIREN uniques`);

  if (uniqueSirens.size === sirens.length) {
    console.log('   ✅ Toutes les pages renvoient des entreprises différentes !');
  } else {
    console.log('   ⚠️  Certaines pages peuvent contenir les mêmes entreprises');
  }
}

main().catch(console.error);
