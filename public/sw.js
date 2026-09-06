/**
 * Service worker di PLINTO: serve a due cose, e a nient'altro.
 *
 * 1. RENDE IL GIOCO INSTALLABILE. Su Android il browser offre "Installa app" solo se
 *    esiste un service worker che gestisce l'evento `fetch`. Senza, il manifest e le
 *    icone maskable che il progetto ha gia' non bastano: al massimo si ottiene una
 *    scorciatoia, non un'applicazione.
 * 2. LO FA FUNZIONARE SENZA RETE. Il gioco e' interamente locale: una volta scaricato
 *    non ha nessun motivo di aver bisogno di una connessione.
 *
 * NON manda niente a nessuno. Le uniche richieste che intercetta sono quelle che la
 * pagina fa gia' verso il proprio stesso indirizzo: le richieste verso altri domini
 * vengono lasciate passare senza toccarle e senza registrarle. La promessa di
 * docs/PRIVACY.md resta intatta, e c'e' un test che lo verifica.
 *
 * LA STRATEGIA DI AGGIORNAMENTO, che e' la parte pericolosa
 *
 * Un service worker scritto male e' il modo piu' rapido di lasciare un giocatore su una
 * versione vecchia per sempre, e in questo progetto abbiamo gia' visto quanto costa
 * dubitare di che cosa ci sia davvero online. Quindi:
 *
 *   - Il documento HTML va sempre in RETE PER PRIMO. E' il file che decide quali
 *     risorse caricare: se resta in cache, resta in cache tutto il resto. La cache
 *     serve solo quando la rete non c'e'.
 *   - Le risorse in assets/ si prendono dalla cache per prime, ma SOLO perche' Vite ne
 *     mette il contenuto nel nome del file: `index-Xs2cOo-w.js` non cambia mai
 *     contenuto a parita' di nome. Una versione nuova ha nomi nuovi, e un nome nuovo
 *     non e' in cache.
 *   - Il nome della cache contiene la versione, passata nell'indirizzo di
 *     registrazione (`sw.js?v=<versione>`). Cambiando versione cambia l'indirizzo: il
 *     browser considera il service worker modificato, lo reinstalla, e all'attivazione
 *     le cache delle versioni precedenti vengono cancellate.
 *   - `skipWaiting` e `clients.claim`: la versione nuova prende il posto della vecchia
 *     subito, senza aspettare che tutte le schede vengano chiuse.
 */

const VERSIONE = new URL(self.location.href).searchParams.get('v') ?? 'sviluppo';
const CACHE = `plinto-${VERSIONE}`;

/**
 * Tutto cio' che serve ad aprire il gioco senza rete.
 *
 * L'elenco delle risorse (il JavaScript e il foglio di stile) NON e' scritto qui: i
 * loro nomi contengono un'impronta del contenuto e cambiano a ogni build. Li scrive la
 * build stessa, sostituendo il segnaposto qui sotto -- vedi il plugin in vite.config.js.
 *
 * Perche' precaricarli invece di fidarsi della cache che si riempie navigando: alla
 * PRIMA visita il service worker non controlla ancora la pagina, quindi il JavaScript e
 * il CSS arrivano senza passare da lui e non finiscono in nessuna cache. Chi installava
 * il gioco e provava ad aprirlo in aereo trovava una pagina bianca. Trovato da questo
 * scenario, non a mente: e' esattamente il genere di dettaglio che sembra funzionare
 * finche' non si stacca davvero la rete.
 */
const GUSCIO = ['./', './index.html', './manifest.webmanifest', './icon.svg', /* PRECARICA */];

self.addEventListener('install', (evento) => {
  evento.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    // `reload` evita di precaricare in cache cio' che era gia' nella cache HTTP del
    // browser: sarebbe come installare la versione nuova con i file della vecchia.
    await cache.addAll(GUSCIO.map((u) => new Request(u, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil((async () => {
    const nomi = await caches.keys();
    await Promise.all(nomi.filter((n) => n.startsWith('plinto-') && n !== CACHE).map((n) => caches.delete(n)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (evento) => {
  const richiesta = evento.request;

  // Solo GET e solo il proprio dominio: tutto il resto passa senza essere toccato.
  if (richiesta.method !== 'GET') return;
  if (new URL(richiesta.url).origin !== self.location.origin) return;

  // Il documento: rete per prima, cache solo se la rete non risponde.
  if (richiesta.mode === 'navigate') {
    evento.respondWith((async () => {
      try {
        const risposta = await fetch(richiesta);
        const cache = await caches.open(CACHE);
        cache.put('./index.html', risposta.clone());
        return risposta;
      } catch {
        return (await caches.match('./index.html')) ?? Response.error();
      }
    })());
    return;
  }

  // Tutto il resto: cache per prima, e cio' che arriva dalla rete si conserva.
  evento.respondWith((async () => {
    const inCache = await caches.match(richiesta);
    if (inCache) return inCache;
    try {
      const risposta = await fetch(richiesta);
      if (risposta.ok && risposta.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(richiesta, risposta.clone());
      }
      return risposta;
    } catch {
      return Response.error();
    }
  })());
});
