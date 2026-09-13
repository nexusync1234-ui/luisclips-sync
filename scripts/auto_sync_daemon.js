const { syncAll } = require('./sync_all');

const INTERVAL_MINUTES = 5;
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

async function startDaemon() {
  console.log('=======================================================');
  console.log('🤖 Auto-Sync Daemon iniciado! Atualizacao a cada ' + INTERVAL_MINUTES + ' minutos.');
  console.log('=======================================================');

  if (process.argv.includes('--delay-first')) {
    console.log('Primeira recolha dentro de ' + INTERVAL_MINUTES + ' minutos.');
    await new Promise(resolve => setTimeout(resolve, INTERVAL_MS));
  }

  while (true) {
    const start = Date.now();
    try {
      console.log('[' + new Date().toLocaleTimeString('pt-PT') + '] Iniciando ciclo de sincronizacao...');
      const result = await syncAll();
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      console.log('[' + new Date().toLocaleTimeString('pt-PT') + '] Ciclo concluido em ' + elapsed + 's: ' + result.syncedCount + ' atualizadas, ' + result.errors.length + ' falhas.');
    } catch (err) {
      console.error('[' + new Date().toLocaleTimeString('pt-PT') + '] Erro no ciclo:', err);
    }

    console.log('Proxima sincronizacao em ' + INTERVAL_MINUTES + ' minutos (' + new Date(Date.now() + INTERVAL_MS).toLocaleTimeString('pt-PT') + ')...\n');
    await new Promise((resolve) => setTimeout(resolve, INTERVAL_MS));
  }
}

startDaemon();
