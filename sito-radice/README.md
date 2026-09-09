# La radice del dominio

Questa cartella NON fa parte del gioco. E' il contenuto di un secondo repository,
`antoniovairo-rgb.github.io`, che serve i file della **radice** del dominio.

## Perche' un secondo repository

PLINTO e' pubblicato in una sottocartella: `antoniovairo-rgb.github.io/Plinto/`.
Ma Android cerca il patto fra app e sito **sempre e solo** alla radice del dominio:

    https://antoniovairo-rgb.github.io/.well-known/assetlinks.json

Non alla radice del progetto, non accanto alla pagina. Su GitHub Pages la radice di
`utente.github.io` la serve un repository che si chiama esattamente come il dominio,
e quel repository e' un altro. Da qui la copia: il file vive qui perche' e' un pezzo
della configurazione di PLINTO e deve stare col resto, e viene COPIATO li'.

## Cosa dichiara

Che l'app `io.github.antoniovairo_rgb.plinto`, firmata con quel certificato, puo'
aprire questo sito a schermo intero senza la barra dell'indirizzo. E' meta' di un
patto: l'altra meta' e' `assetStatements` in `android/app/src/main/res/values/strings.xml`.
Se una delle due manca o non combacia, Android lascia la barra dell'indirizzo e **non
dice perche'** -- non c'e' errore, non c'e' avviso, l'app semplicemente sembra un
browser. E' l'unico modo di accorgersene: guardarla su un telefono vero.

## L'impronta e' quella di GOOGLE, non la tua

`sha256_cert_fingerprints` contiene l'impronta della **chiave di firma dell'app** di
Google Play (Play App Signing), non quella della chiave di caricamento `plinto.jks`.
Sono due certificati diversi e la Console li mostra vicini. Mettere quello sbagliato
produce esattamente lo stesso silenzio descritto sopra.

Si rilegge in Play Console: Protetto con Play -> Protezione del Play Store ->
Gestisci la firma dell'app di Google Play -> Chiave di firma dell'app -> Chiave
classica -> Fingerprint del certificato SHA-256.

### LE IMPRONTE SONO DUE, E LA SECONDA NON E' FACOLTATIVA

Nella stessa pagina, sotto, c'e' una sezione "Chiavi di firma dell'app precedenti".
Se contiene qualcosa, quella chiave e' ancora in circolazione: Google puo' consegnare
a certi dispositivi un APK firmato con la vecchia invece che con quella "in uso". Con
una sola impronta nell'elenco, su quei dispositivi il confronto fallisce e l'app si
apre con la barra dell'indirizzo -- senza nessun errore, come tutto il resto di questo
meccanismo.

E' successo alla prima installazione, ed e' VERIFICATO, non supposto: `assetlinks.json`
conteneva solo l'impronta della chiave in uso e l'app si apriva come una scheda del
browser; aggiunta la seconda e reinstallata l'app, la barra e' sparita. Nient'altro e'
cambiato in mezzo.

Un dettaglio da non farsi ingannare: la Console mostrava quella chiave con "Installazioni
attive 0%", e quel numero aveva quasi fatto scartare l'ipotesi giusta. Con due sole
installazioni al mondo la percentuale non significa niente.

Il campo e' un elenco apposta: elencarle entrambe non ha controindicazioni, e ometterne
una si paga in un'ora di indagine su un difetto che non dice niente.

## Come si pubblica

Il repository `antoniovairo-rgb.github.io` deve contenere TRE file:

    .well-known/assetlinks.json     <- copia di questo file
    .nojekyll                       <- vuoto
    _config.yml                     <- con `include: [".well-known"]`

GitHub Pages passa il sito da Jekyll, che **salta le cartelle il cui nome comincia con
un punto**: `.well-known/` sparisce e l'indirizzo risponde 404, senza che niente segnali
l'errore.

### `.nojekyll` DA SOLO NON E' BASTATO

Questo merita di essere scritto perche' contraddice tutta la documentazione, compresa
quella ufficiale di GitHub, che indica `.nojekyll` come LA soluzione per questo problema
esatto. Il 9 settembre 2026 il repository conteneva `.nojekyll`, vuoto, alla radice, con
il nome giusto (verificato leggendo l'albero git, non guardando lo schermo), tre
deployment andati a buon fine -- e l'indirizzo rispondeva comunque 404. Ha funzionato
solo dopo aver aggiunto `_config.yml`, cioe' la correzione *dal lato di Jekyll*: la
prova che Jekyll stava girando lo stesso.

Un dettaglio che aveva portato fuori strada: `README.md` veniva servito come testo
grezzo, e sembrava provare che Jekyll fosse spento. Non lo prova. Jekyll trasforma solo
i file che iniziano con un blocco `---`; tutti gli altri li copia identici. Un file
servito "come sta" non dice niente su chi lo abbia servito.

Tenere entrambi i file costa nulla e copre entrambi i comportamenti: se un giorno
`.nojekyll` iniziasse a funzionare come documentato, `_config.yml` verrebbe ignorato.

## Come si verifica

    curl https://antoniovairo-rgb.github.io/.well-known/assetlinks.json

Deve rispondere con questo JSON e `content-type: application/json`. Poi, sul telefono:
installata l'app, **non deve comparire nessuna barra dell'indirizzo** in cima.
