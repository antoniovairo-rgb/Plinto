# Gate di rilascio — PLINTO

Stato al **6 settembre 2026**. Il gioco **non è pronto per la pubblicazione**: le voci
aperte sono elencate per prime, senza addolcirle.

Legenda: **FATTO** verificato eseguendo qualcosa · **APERTO** da fare · **BLOCCATO** dipende da una decisione o da un dato che non abbiamo · **DA VERIFICARE FUORI** richiede una competenza che questo progetto non ha.

---

## Bloccanti: senza queste non si pubblica

| Voce | Stato | Nota |
| --- | --- | --- |
| Link PayPal per la donazione | **BLOCCATO** | `src/config/progetto.js` ha `PAYPAL_URL = ''`. Finché è vuoto, l'interfaccia lo dichiara apertamente invece di mostrare un pulsante che non porta da nessuna parte. Serve il link reale del proprietario del progetto |
| Verifica di anteriorità sul nome PLINTO | **DA VERIFICARE FUORI** | La ricerca fatta (vedi `DIFFERENZIAZIONE.md`) non ha trovato collisioni nella categoria puzzle, ma **non è una verifica legale**: non è stato consultato nessun registro di marchi e le schede degli store non erano raggiungibili. Serve una ricerca professionale nelle classi pertinenti |
| Prova su dispositivi fisici | **APERTO** | Tutto è stato verificato in Chromium su viewport simulate. Nessun telefono vero, nessun iOS, nessuna prova con dita vere. È il divario più grande fra ciò che sappiamo e ciò che l'utente sperimenterà |
| Playtest con persone reali | **APERTO** | Nessun essere umano ha ancora giocato. Le domande "è divertente" e "ho voglia di rigiocare" non hanno risposta: nessuna simulazione può darla |

## Prodotto

| Voce | Stato | Nota |
| --- | --- | --- |
| Nucleo di gioco stabile | **FATTO** | 240 test in 16 file; invarianti verificate a ogni mossa su 240 partite complete |
| Nessun difetto critico noto | **FATTO** | Nessuno aperto al momento di questa revisione |
| Bilanciamento misurato | **FATTO** | Simulazioni su migliaia di partite, quattro profili di abilità, `npm run sim` |
| Equità verificata con numeri | **FATTO** | Il 91% delle partite finisce con la griglia fra il 40% e il 70%; sotto il 30% è lo 0,7% |
| Fine partita informativa | **FATTO** | Dice il motivo, mostra i numeri, il pulsante per rigiocare è il primo sotto il pollice |
| Nessuna pubblicità di alcun tipo | **FATTO** | Verificato dal test di privacy: nessuna rete, nessun dominio esterno |
| Nessun acquisto, energia, vite, timer | **FATTO** | Non esistono nel codice |
| Nessuna serie giornaliera da mantenere | **FATTO** | Scelta esplicita: le serie funzionano facendo paura di perdere qualcosa |

## Interfaccia e accessibilità

| Voce | Stato | Nota |
| --- | --- | --- |
| Contrasti conformi WCAG AA | **FATTO** | Misurati sul fondo più sfavorevole di ciascun tema e documentati in `DESIGN_SYSTEM.md`. Non è più una verifica manuale: `npm run contrasti` li ricalcola dai token e `tests/contrasti.test.js` lo esegue a ogni `npm test`, quindi una regressione fa fallire la suite |
| Partita completa da tastiera | **FATTO** | Verificata dallo scenario e2e |
| Annunci per lettori di schermo | **FATTO** | Verificati dallo scenario e2e |
| Bersagli tattili ≥ 44 px | **FATTO** | Portati a 48 px minimi dopo averli misurati a 34 px |
| Rispetto di prefers-reduced-motion | **FATTO** | Token e cicli continui, non solo le transizioni |
| Layout verticale e orizzontale | **FATTO** | Verificato in Chromium, non su dispositivi fisici |
| Traduzioni italiano e inglese | **FATTO** | Parità di chiavi, assenza di chiavi orfane e inventate: tutto sotto test |
| Prova su lettore di schermo reale (VoiceOver, TalkBack) | **APERTO** | Gli annunci sono corretti nel DOM; come suonino davvero non è stato ascoltato |

## Prestazioni

| Voce | Stato | Nota |
| --- | --- | --- |
| Fluidità in sessione lunga | **FATTO** | `npm run soak`: 377 mosse valide su 400 tentativi, fotogramma mediano 16,7 ms, nessuno oltre 50 ms su 2537, memoria da 10,9 a 11,7 MB, zero particelle rimaste. La prova era rimasta rotta per due versioni perché era l'unico controllo fuori da `npm run verifica`: ora ne fa parte |
| Nessuna perdita di memoria | **FATTO** | Memoria piatta a fine sessione; canvas ripulito a riposo |
| Peso del pacchetto | **FATTO** | Circa 63 kB compressi in totale |
| Prestazioni su dispositivo lento reale | **APERTO** | Misurato solo su un contenitore, non su un telefono di fascia bassa |

## Legale e conformità

| Voce | Stato | Nota |
| --- | --- | --- |
| Licenze delle risorse | **FATTO** | Nessuna risorsa di terze parti: nessuna immagine, nessun font, nessun file audio. Registro in `ASSET_LICENSES.md` |
| Audio senza campioni di terzi | **FATTO** | Generato a runtime da oscillatori |
| Informativa privacy | **FATTO** | `PRIVACY.md`, coerente col codice e protetta da un test automatico |
| Audit di differenziazione | **FATTO** | `DIFFERENZIAZIONE.md`, con i limiti della ricerca dichiarati |
| Revisione legale del prodotto | **DA VERIFICARE FUORI** | Nessuno può dichiarare "legalmente sicuro" senza un professionista, e questo documento non lo fa |
| Informativa pubblicata in una pagina raggiungibile | **APERTO** | Serve quando ci sarà un indirizzo pubblico |

## Materiali di pubblicazione

| Voce | Stato | Nota |
| --- | --- | --- |
| Icona | **FATTO** | SVG originale, coerente con il marchio |
| Manifest PWA | **FATTO** | Nome, colori, icona; vincolo di orientamento rimosso perché esiste il layout orizzontale |
| Schermate per gli store | **FATTO** | Generate da `npm run schermate`, dal gioco vero |
| Icona in PNG alle dimensioni richieste dagli store | **APERTO** | Ora esiste solo l'SVG |
| Schermata di avvio | **APERTO** | |
| Descrizione del prodotto | **APERTO** | Il messaggio è deciso (Catena, niente pubblicità, accessibilità); il testo va scritto |
| Account sviluppatore sugli store | **BLOCCATO** | Dipende dal proprietario del progetto |

---

## Come si legge questo documento

Una voce è **FATTO** solo se esiste qualcosa che si può rieseguire per dimostrarlo:
un test, uno script, un numero misurato. "Sembra funzionare" non è uno stato.
