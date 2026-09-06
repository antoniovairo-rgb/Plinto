# Provare PLINTO

## Sul computer, subito

Serve **Node.js 20 o superiore** ([nodejs.org](https://nodejs.org)). Una volta sola:

```bash
git clone https://github.com/antoniovairo-rgb/plinto
cd plinto
npm install
```

Poi, ogni volta che vuoi giocare:

```bash
npm run dev
```

Il terminale stampa due indirizzi:

```
➜  Local:   http://localhost:5173/
➜  Network: http://192.168.x.x:5173/
```

- **Local** si apre nel browser del computer.
- **Network** si apre dal **telefono**, se telefono e computer sono sulla stessa
  rete Wi-Fi. È il modo più veloce per provarlo con le dita vere, senza pubblicare
  niente online.

Per fermarlo: `Ctrl+C` nel terminale.

## Su Windows

Stessi comandi dal Prompt dei comandi o da PowerShell, dopo aver installato Node.js.

## Online, su GitHub Pages

Il flusso di pubblicazione è già pronto in `.github/workflows/pages.yml` e parte a ogni
push su `main`. Va abilitato **una volta sola**:

**Settings → Pages → Source: `GitHub Actions`**

L'indirizzo sarà `https://antoniovairo-rgb.github.io/plinto/`.

> **Vincolo da conoscere prima di provarci.** GitHub Pages su una repository
> **privata** richiede un piano a pagamento (Pro, Team o Enterprise). Con il piano
> gratuito il flusso fallisce finché la repository non viene resa pubblica
> (Settings → General → Danger Zone → Change visibility).
>
> Rendere pubblica la repository significa rendere pubblici codice, documentazione e
> gioco **prima** che il nome PLINTO sia stato verificato da un professionista (vedi
> `docs/RELEASE_CHECKLIST.md`). Non è un ostacolo tecnico, è una scelta da fare
> consapevolmente.

La build è verificata per funzionare da una sottocartella: `npm run prova-pages`.

## Cosa guardare mentre provi

Il gioco è stato verificato a macchina, ma le domande che contano non hanno ancora
risposta. Se ti va di annotare qualcosa mentre giochi:

1. **Hai capito cosa fare senza pensarci?** La schermata iniziale compare una volta sola:
   se ti serve rivederla, Impostazioni → Azzera i miei dati.
2. **Il pezzo si posa dove volevi?** Su schermo grande il dito non copre nulla, su
   telefono sì: il pezzo si solleva sopra il dito apposta.
3. **Le animazioni sono troppo lente?** Fra una mossa e l'altra non devi mai aspettare.
4. **Quando perdi, ti sembra colpa tua?** È la domanda più importante di tutte.
5. **Hai voglia di rigiocare subito?** Se la risposta è no, il resto conta poco.
6. **La Catena si capisce?** Il moltiplicatore in alto cala di uno quando non elimini,
   non si azzera.

## Le altre modalità di verifica

```bash
npm test           # 100 test, meno di due secondi
npm run e2e        # una partita completa guidata in un browser
npm run sim        # migliaia di partite simulate, per il bilanciamento
npm run schermate  # rigenera le immagini in store/
```
