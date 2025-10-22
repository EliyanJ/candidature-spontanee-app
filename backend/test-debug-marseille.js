/**
 * Debug : Combien d'entreprises y a-t-il vraiment avec ces filtres ?
 */

const axios = require('axios');

async function testMarseille() {
  console.log('Debug Marseille avec filtres spécifiques...\n');

  // Test 1 : Avec 3 arrondissements
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1 : 3 arrondissements (13016, 13014, 13015)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const response1 = await axios.get('https://recherche-entreprises.api.gouv.fr/search', {
      params: {
        activite_principale: '73.11Z',
        code_postal: '13016,13014,13015',
        tranche_effectif_salarie: '12',
        est_entrepreneur_individuel: false,
        etat_administratif: 'A',
        per_page: 25,
        page: 1
      }
    });

    console.log(`Total disponible: ${response1.data.total_results} entreprises`);
    console.log(`Page 1: ${response1.data.results?.length || 0} résultats`);
    console.log(`Nombre de pages max: ${Math.ceil(response1.data.total_results / 25)}`);
  } catch (error) {
    console.error('Erreur:', error.message);
  }

  // Test 2 : TOUS les arrondissements
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2 : TOUS les 16 arrondissements');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const allCodes = '13001,13002,13003,13004,13005,13006,13007,13008,13009,13010,13011,13012,13013,13014,13015,13016';
    const response2 = await axios.get('https://recherche-entreprises.api.gouv.fr/search', {
      params: {
        activite_principale: '73.11Z',
        code_postal: allCodes,
        tranche_effectif_salarie: '12',
        est_entrepreneur_individuel: false,
        etat_administratif: 'A',
        per_page: 25,
        page: 1
      }
    });

    console.log(`Total disponible: ${response2.data.total_results} entreprises`);
    console.log(`Page 1: ${response2.data.results?.length || 0} résultats`);
    console.log(`Nombre de pages max: ${Math.ceil(response2.data.total_results / 25)}`);
  } catch (error) {
    console.error('Erreur:', error.message);
  }

  // Test 3 : Sans filtre effectif
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3 : Sans filtre effectif spécifique');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const response3 = await axios.get('https://recherche-entreprises.api.gouv.fr/search', {
      params: {
        activite_principale: '73.11Z',
        code_postal: '13016,13014,13015',
        tranche_effectif_salarie: '12,21,22,31,32,41,42,51,52,53', // >= 20 employés
        est_entrepreneur_individuel: false,
        etat_administratif: 'A',
        per_page: 25,
        page: 1
      }
    });

    console.log(`Total disponible: ${response3.data.total_results} entreprises`);
    console.log(`Page 1: ${response3.data.results?.length || 0} résultats`);
    console.log(`Nombre de pages max: ${Math.ceil(response3.data.total_results / 25)}`);
  } catch (error) {
    console.error('Erreur:', error.message);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('CONCLUSION');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Le problème : On pioche des pages trop hautes (87, 163, 230)');
  console.log('alors qu\'il n\'y a probablement que quelques pages disponibles.');
  console.log('\n💡 Solution : Limiter MAX_API_PAGE en fonction du nombre réel');
  console.log('de résultats disponibles (total_results / per_page)');
}

testMarseille().catch(console.error);
