# PLINTO sul Play Store — quello che serve, in ordine

Questo non è un tutorial generico: è la sequenza esatta per **questo** progetto, con i
valori già decisi. Il pacchetto Android non è stato costruito qui perché la rete di questo
ambiente blocca `dl.google.com` e quindi l'SDK Android non è scaricabile: i comandi sotto
vanno lanciati su una macchina con rete libera.

## Cos'è che si pubblica

Una **TWA** (Trusted Web Activity): un'app Android che apre a tutto schermo il sito già
online, senza barra degli indirizzi. Il gioco resta uno solo — quando si pubblica una nuova
versione su GitHub Pages, l'app si aggiorna da sola. L'`.aab` si ricarica solo se cambiano
icona, nome o permessi.

## Le decisioni già prese, e perché

**Identificativo del pacchetto: `io.github.antoniovairo_rgb.plinto`.**
È la convenzione del dominio al contrario, che per GitHub Pages è `io.github.<utente>`. Il
trattino di `antoniovairo-rgb` diventa un trattino basso perché i nomi dei pacchetti Java non
ammettono trattini.

⚠️ **Questo nome non si può più cambiare dopo la prima pubblicazione.** È l'identità dell'app
per sempre: cambiarlo significa pubblicare un'app diversa e perdere installazioni e recensioni.
Se un giorno si passa a un dominio proprio (es. `plinto.app`), il *pacchetto* può restare
questo — cambia solo `assetlinks.json`.

**Orientamento: verticale.** Il gioco è pensato per il pollice su una mano sola.

**Notifiche: disattivate.** PLINTO non manda notifiche e non ne chiederà il permesso.

## La sequenza

### 1. Costruire il pacchetto (su macchina con rete libera)

```bash
npm install -g @bubblewrap/cli
cd android
bubblewrap init --manifest https://antoniovairo-rgb.github.io/Plinto/manifest.webmanifest
# accetta di scaricare JDK 17 e Android SDK quando li chiede
bubblewrap build
```

`bubblewrap init` chiede conferma dei valori: quelli giusti sono già in `twa-manifest.json`
di questa cartella — si può copiarlo al posto di quello generato e rilanciare `build`.

Alla prima esecuzione crea `plinto-upload.keystore`: è la **chiave di caricamento**.

⚠️ **Conservare quella chiave e la sua password fuori dal repository.** Non va committata: un
repository pubblico la renderebbe leggibile a chiunque. Se si perde, si può chiedere a Google
un ripristino della chiave di caricamento (non è la fine del mondo come per la vecchia chiave
di firma, ma è una scocciatura evitabile).

### 2. Caricare su Play Console

Crea l'app, carica `app-release-bundle.aab` in **test interno**.

⚠️ **Il test interno NON conta per i 14 giorni.** Su un account personale aperto dopo
novembre 2023, per ottenere l'accesso alla produzione servono almeno **12 tester iscritti a
un TEST CHIUSO per 14 giorni consecutivi**. Il test interno serve solo a verificare che la
TWA funzioni; il conteggio parte da un test chiuso.

Sequenza giusta: test interno per i passi 3-5 qui sotto (bastano un account e un telefono),
poi **test chiuso** con 12 persone, poi — dopo 14 giorni — richiesta di accesso alla
produzione.

**L'accesso alla produzione si sblocca una volta sola per ACCOUNT, non per app.** Quale app
faccia i 14 giorni non conta: conta che qualcuna li faccia. Conviene farli fare all'app che
e' pronta prima.

### 3. Prendere l'impronta VERA e solo allora scrivere assetlinks

Play Console → **Configurazione → Integrità dell'app** → copia il **SHA-256 del certificato di
firma dell'app**.

⚠️ **È qui che quasi tutti sbagliano.** Con Play App Signing (l'impostazione predefinita) la
chiave con cui l'app viene firmata *davvero* ce l'ha Google, non tu: la tua è solo quella di
caricamento. Bubblewrap genera un `assetlinks.json` con l'impronta **locale**, che è quella
sbagliata. Il file c'è, sembra giusto, e la verifica fallisce lo stesso — risultato: il gioco
si apre con la barra dell'indirizzo in cima e non si capisce perché.

### 4. Pubblicare assetlinks sul repository radice

Serve un repository chiamato **`antoniovairo-rgb.github.io`** (il nome deve essere esattamente
questo), con dentro:

```
.nojekyll                        <- file vuoto, indispensabile
.well-known/assetlinks.json
```

⚠️ **Senza `.nojekyll` non funziona**: GitHub Pages ignora le cartelle che iniziano con un
punto, e `.well-known` inizia con un punto. Il file risulterebbe assente senza alcun errore.

Contenuto di `.well-known/assetlinks.json` (sostituire l'impronta con quella del punto 3):

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "io.github.antoniovairo_rgb.plinto",
    "sha256_cert_fingerprints": ["QUI-IL-SHA-256-DELLA-PLAY-CONSOLE"]
  }
}]
```

Il file è un **elenco**: quando arriverà il secondo gioco basta aggiungere un altro blocco,
non serve un altro repository.

### 5. Verificare

```bash
curl https://antoniovairo-rgb.github.io/.well-known/assetlinks.json
```

Deve rispondere con il JSON e `content-type: application/json`. Poi si installa l'app dal
canale di test: **se in cima compare la barra dell'indirizzo, la verifica non è passata** — e
la causa è quasi sempre l'impronta sbagliata del punto 3.

## Cosa serve ancora sulla scheda

- **URL dell'informativa privacy**: `https://antoniovairo-rgb.github.io/Plinto/` non ha una
  pagina dedicata raggiungibile da fuori. La Play Console vuole un indirizzo pubblico che
  apra direttamente l'informativa. Il testo esiste già in `PRIVACY.md` del repository: va
  pubblicato a un indirizzo proprio.
- **Classificazione dei contenuti**: questionario da compilare in console. PLINTO non ha
  violenza, contenuti sensibili, acquisti né pubblicità.
- **Dichiarazione sulla sicurezza dei dati**: PLINTO **non raccoglie e non trasmette niente**.
  Tutto resta nella memoria del browser. È la dichiarazione più semplice possibile, ma va
  compilata.
