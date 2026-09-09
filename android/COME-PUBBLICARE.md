# PLINTO sul Play Store — quello che serve, in ordine

Questo non è un tutorial generico: è la sequenza esatta per **questo** progetto, con i
valori già decisi. Il progetto Android è scritto e sta in questa cartella; va aperto e
compilato in Android Studio su una macchina con rete libera.

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

**Orientamento: nessun blocco, da nessuna parte.** Va detto perché è facile crederlo il
contrario: il gioco è disegnato per il pollice su una mano sola, ma né il manifest web né
quello Android impongono il verticale. Ruotando il telefono l'app ruota, e la disposizione
si adatta — le prove su schermi larghi passano — ma la plancia diventa piccola e i pezzi
finiscono lontani dal pollice.

È una decisione aperta, non un difetto: si può bloccare in verticale aggiungendo
`"orientation": "portrait"` a `public/manifest.webmanifest`. Meglio lì che nel manifest
Android — così vale anche per chi gioca dal browser, e la regola resta in un posto solo.

**Notifiche: disattivate.** PLINTO non manda notifiche e non ne chiederà il permesso.

## Il livello API, che scade

Google alza periodicamente il livello API minimo per i NUOVI caricamenti, e il rifiuto
arriva al momento del caricamento, non prima. Dal **31 agosto 2026** il minimo e' **36**
(Android 16): il primo caricamento di PLINTO fu respinto proprio per questo, perche' il
progetto era stato scritto per 35.

Le tre righe si muovono insieme, e cambiarne una sola non compila:

| voce | dove | valore | perche' e' legato |
| --- | --- | --- | --- |
| `targetSdk` / `compileSdk` | `app/build.gradle` | 36 | lo impone Play |
| AGP | `build.gradle` | >= 8.9.1 | il minimo per `compileSdk 36` |
| Gradle | wrapper, locale | >= 8.11.1 | il minimo per AGP 8.9 |
| `androidbrowserhelper` | `app/build.gradle` | 2.7.3 | la prima che disegna la
  schermata d'avvio "edge-to-edge", che Android 16 impone senza possibilita' di rinuncia |
| `minSdk` | `app/build.gradle` | 24 | non e' una scelta: e' il minimo della 2.7 |

Quando questa soglia si rialzera' ancora, il sintomo sara' identico: un errore rosso in
"Crea release" che parla di livello API target. Si riparte da questa tabella.

## La sequenza

### 1. Costruire il pacchetto, in Android Studio

Il progetto Android e' **gia' scritto** in questa cartella. Non serve Bubblewrap, non serve
scaricare un JDK ne' un SDK: usa la catena di strumenti di Android Studio.

*Perche' non Bubblewrap.* E' lo strumento ufficiale di Google e genera esattamente questo
progetto, ma si porta dietro una PROPRIA catena -- JDK 17 e SDK Android da scaricare --
accanto a quella gia' installata. Su una macchina dove Android Studio c'e' gia', sono
mezzo giga di download e un punto di rottura in piu' per zero vantaggi.

**Apri il progetto:** Android Studio → *Open* → seleziona la cartella `android` di questo
repository. Alla prima apertura Gradle sincronizza e scarica le sue dipendenze (qualche
minuto, una volta sola).

**Genera il pacchetto firmato:** *Build → Generate Signed App Bundle / APK → Android App
Bundle → Create new…*

| campo | valore |
| --- | --- |
| Key store path | **fuori dal repository**, es. `C:\Users\<tu>\chiavi\plinto.jks` |
| Alias | `plinto` |
| Validita' | 25 anni o piu' |

⚠️ **Quella chiave e le sue password decidono chi potra' aggiornare PLINTO, per sempre.**
Tienile in un gestore di password e fanne una copia altrove. Il `.gitignore` di questa
cartella esclude `*.keystore` e `*.jks`, ma la strada piu' sicura e' non metterla proprio
dentro il repository.

Scegli **release** e compila. Esce `app/release/app-release.aab`.

**Per provarlo subito sul telefono** senza passare dallo store, ripeti con *APK* invece di
*Android App Bundle*: ottieni un file installabile via cavo. Attenzione pero': un APK
firmato in locale porta l'impronta della TUA chiave, mentre quello che arriva dal Play
Store porta quella di Google. Servono entrambe in `assetlinks.json` (vedi passo 4).

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
