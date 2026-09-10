# Informativa privacy di PLINTO

*Ultimo aggiornamento: 6 settembre 2026. Questo testo descrive ciò che il codice fa
davvero: se un giorno il gioco raccogliesse qualcosa, questo documento va cambiato
**prima** di quella modifica, non dopo.*

## In breve

PLINTO non raccoglie nulla. Nessun account, nessuna registrazione, nessun
identificativo, nessuna analitica, nessuna pubblicità, nessun servizio di terze parti.

## Cosa viene salvato, e dove

Il gioco salva alcune informazioni **esclusivamente nel tuo dispositivo**, nell'archivio
locale del browser (`localStorage`), sotto le chiavi con prefisso `plinto:`:

| Dato | A cosa serve |
| --- | --- |
| Record personali | Mostrarti il tuo miglior punteggio |
| Statistiche di gioco | Partite giocate, mosse, gruppi chiusi, tempo totale |
| Partita in corso | Riprendere la partita se chiudi il gioco |
| Risultati della Sfida del Giorno | Il tuo miglior punteggio di ciascun giorno, per gli ultimi 60 giorni |
| Impostazioni | Audio, vibrazione, animazioni, tema, lingua |

Questi dati **non lasciano mai il dispositivo**. Non esiste alcun server a cui possano
essere inviati: il gioco è un'applicazione che gira interamente nel browser.

## Cosa NON viene fatto

- Nessuna richiesta di rete verso domini di terze parti. Non ci sono font esterni,
  librerie caricate da CDN, pixel di tracciamento o servizi di analisi.
- Nessun cookie.
- Nessun identificativo pubblicitario, nessuna profilazione.
- Nessuna raccolta di dati personali: il gioco non chiede né il nome, né l'email,
  né l'età, né la posizione.
- Nessuna condivisione con nessuno, perché non c'è nulla da condividere.

## Le tre eccezioni: tre collegamenti che portano fuori

**Il collegamento alla donazione.** Nella schermata "Sostieni il progetto" c'è un
collegamento a PayPal. **Il collegamento non fa nulla finché non lo tocchi tu.** Se lo
tocchi, si apre il sito di PayPal, che ha una propria informativa privacy sulla quale non
abbiamo alcun controllo. Il gioco non comunica a PayPal chi sei, perché non lo sa.

**Il collegamento per le segnalazioni.** In fondo alla schermata iniziale c'è "Idee e
segnalazioni". È un indirizzo di posta, non un modulo: toccandolo si apre l'applicazione
di posta del tuo telefono con un messaggio già intestato, e **il gioco non contatta
nessun server**. Non sa se scrivi, non sa cosa scrivi e non sa se invii. Se decidi di
mandarlo, quello che arriva è quello che hai scritto tu, con il tuo indirizzo di posta,
esattamente come per qualunque email.

Nell'oggetto del messaggio è precompilato il numero di versione del gioco. Serve a capire
di quale versione parla una segnalazione, ed è l'unico dato che il gioco aggiunge: nessun
identificativo, niente sul dispositivo, niente sulle tue partite.

Un modulo di contatto avrebbe voluto dire un servizio di terze parti, cioè una richiesta di
rete verso un altro dominio: l'unica cosa che questa informativa promette di non fare.

**Il collegamento nelle schede da condividere.** Quando mandi a qualcuno il risultato di
una partita o il tuo avanzamento, in fondo al messaggio c'è un collegamento alla scheda
del gioco sul Play Store. Serve a chi lo riceve per installarlo, se gli va. Anche qui il
gioco non contatta nessuno: scrive un indirizzo dentro un testo, e sei tu a decidere se
mandarlo e a chi.

**Nel collegamento non c'è niente che ti riguardi.** Nessun codice di invito, nessun
identificativo, nessun parametro che dica da chi arriva. È lo stesso identico indirizzo
per tutti, e questo significa anche che chi ha scritto il gioco non può sapere quante
persone lo hanno installato grazie a te. È una rinuncia consapevole: l'alternativa
sarebbe tracciarti.

L'unica eccezione alla frase qui sopra è il collegamento della **sfida del giorno**, che
porta scritta la data della sfida. Non è un dato su di te: serve a far giocare a chi lo
riceve la stessa identica partita, ed è la ragione per cui quel collegamento esiste.

**L'anteprima che si vede in chat.** Quando incolli il collegamento del gioco in una
conversazione, l'applicazione di messaggistica mostra un riquadro con un'immagine. Quel
riquadro lo costruisce lei, leggendo la pagina del gioco, e l'immagine arriva dallo stesso
indirizzo del gioco: nessun servizio di terze parti è coinvolto.

## Il service worker (installazione e uso senza rete)

Da quando il gioco si può installare sul telefono esiste un file, `public/sw.js`, che il
browser esegue per conto del sito. Serve a due cose: rendere il gioco installabile e
farlo funzionare **senza connessione**, tenendone una copia locale.

Merita di essere detto per intero, perché è codice che vede passare le richieste:

- Conserva **solo** i file del gioco stesso (la pagina, il JavaScript, il foglio di stile,
  le icone), presi dallo stesso indirizzo da cui il gioco è servito.
- Le richieste verso qualunque altro dominio **le lascia passare senza toccarle e senza
  registrarle**: c'è una riga esplicita che le esclude, ed è verificata da un test
  (`tests/privacy.test.js`).
- Non manda niente a nessuno: nessun invio in sottofondo, nessuna statistica, nessuna
  connessione aperta.
- Sparisce cancellando i dati del sito dal browser, o disinstallando l'applicazione.

## Cancellare i tuoi dati

Due modi, entrambi immediati e definitivi:

1. **Impostazioni → Azzera i miei dati**, dentro il gioco.
2. Cancellando i dati del sito dal tuo browser.

Non esiste una copia altrove: cancellati lì, sono cancellati e basta.

## Minori

Il gioco non raccoglie dati, quindi non raccoglie dati di minori. Non contiene
pubblicità, acquisti, chat, contenuti generati dagli utenti né collegamenti esterni
oltre a quello della donazione.

## Come verificarlo

Il codice sorgente è ispezionabile. Le uniche funzioni che scrivono dati sono in
`src/persistence/storage.js`, e usano solo `window.localStorage`. Le uniche richieste di
rete dell'intero progetto sono quelle che il service worker fa per **riscaricare i file del
gioco stesso** dallo stesso indirizzo da cui il gioco è servito: nessuna riga di codice si
rivolge a un altro dominio. È possibile controllarlo anche senza leggere il codice, con il
pannello Rete degli strumenti per sviluppatori del browser: giocando una partita intera non
compare nessuna chiamata verso l'esterno.
