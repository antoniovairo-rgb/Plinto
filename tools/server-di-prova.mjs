/**
 * Il server di sviluppo che uno script di prova si avvia da solo va spento DAVVERO.
 *
 * Gli script lanciano `npx vite ...` quando non trovano un server acceso. `npx` fa partire
 * `vite` come processo figlio, e `server.kill()` fermava soltanto `npx`: vite restava
 * acceso a servire la versione del momento in cui era partito. Il giro successivo lo
 * trovava, lo riusava, e misurava una versione vecchia -- e' il motivo per cui il primo
 * controllo del gate e' "il server di prova serve questa versione", e per cui quel
 * controllo e' fallito piu' di una volta. Verificato il 23 settembre 2026: dopo
 * `npm run schermate`, in /proc restavano vite ed esbuild.
 *
 * La cura ha due parti, e servono tutte e due:
 *   1. lanciare il server con `detached: true`, cosi' ha un GRUPPO DI PROCESSI suo,
 *      con lo stesso numero del processo `npx`;
 *   2. all'uscita dello script uccidere il gruppo intero (`process.kill(-pid)`), che
 *      prende npx, vite ed esbuild insieme.
 * L'uscita si aggancia all'evento `exit`, quindi vale per la fine normale, per ogni
 * `process.exit` sparso nello script e per un'eccezione non gestita; Ctrl+C e SIGTERM
 * passano da li' con un'uscita esplicita.
 *
 * @param {import('node:child_process').ChildProcess|null} server il processo `npx`
 *   lanciato con `detached: true`; null se lo script ha trovato un server gia' acceso,
 *   che non e' suo e non si tocca.
 */
export function chiudiAllUscita(server) {
  if (!server?.pid) return;
  // Il processo figlio non tiene piu' in vita lo script: senza, uno script che si
  // dimentica `server.kill()` non finisce mai, e quindi non arriva mai all'uscita che
  // dovrebbe spegnere il server. Successo a una prova scritta al volo.
  server.unref();
  const chiudi = () => {
    try { process.kill(-server.pid, 'SIGTERM'); } catch { /* gruppo gia' chiuso */ }
  };
  process.on('exit', chiudi);
  for (const segnale of ['SIGINT', 'SIGTERM']) {
    process.once(segnale, () => { chiudi(); process.exit(1); });
  }
}
