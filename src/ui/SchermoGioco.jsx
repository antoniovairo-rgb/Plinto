import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Plancia } from './Plancia.jsx';
import { Tray } from './Tray.jsx';
import { Hud, BarraCatena } from './Hud.jsx';
import { Pezzo } from './Pezzo.jsx';
import { useTrascinamento, origineDaCella } from './useTrascinamento.js';
import { useTastiera } from './useTastiera.js';
import { Annunci, frasePerMossa } from './Annunci.jsx';
import { BarraObiettivo } from './BarraObiettivo.jsx';
import { MagazzinoAttrezzi, PannelloAttrezzi, Mensola } from './Attrezzi.jsx';
import { MASSIMO as ATTREZZI_MASSIMO, OGNI_LIVELLI } from '../persistence/attrezzi.js';
import { idx } from '../core/grid.js';
import { useEffettiMossa } from '../feel/useEffettiMossa.js';
import { CampoParticelle } from '../feel/particelle.js';
import { suonoPresa, suonoRifiuto, sbloccaAudio } from '../audio/suoni.js';
import { vibraRifiuto } from '../feel/vibrazione.js';
import { canPlace, placeShape, findCompletedGroups, shapeCellsAt, rowOf, colOf } from '../core/grid.js';
import { AnteprimaTerna } from './AnteprimaTerna.jsx';
import { MODALITA , TINTA_SOGLIA } from '../config/rules.js';
import { giornoDiOggi } from '../core/sfida.js';
import { dataDistesa } from '../i18n/formato.js';

/**
 * La schermata di gioco: e' l'unica che conta davvero.
 *
 * Tutto quello che non e' la griglia sta ai bordi e in secondo piano. Il punteggio
 * e la Catena stanno in alto perche' li si guarda tra una mossa e l'altra; i pezzi
 * stanno in basso perche' li' arriva il pollice.
 */
/**
 * L'intestazione della Sfida del Giorno: QUALE sfida, e che cosa chiede.
 *
 * Prima diceva soltanto "Sfida del giorno", cioe' il nome della modalita'. Chi apriva la
 * schermata non poteva sapere due cose, e le voleva sapere entrambe: quale giorno stesse
 * giocando -- l'archivio permette di riaprire i giorni passati, e da dentro la partita
 * erano indistinguibili da quella di oggi -- e che cosa fosse "la sfida", visto che a
 * differenza di un livello non c'e' nessun obiettivo scritto da nessuna parte.
 *
 * La riga sotto e' precisa e non ottimista. Il seme e' la data, quindi la partita PARTE
 * uguale per tutti; ma il generatore legge la griglia per decidere i pezzi, quindi due
 * persone che giocano diversamente ricevono pezzi diversi dopo poche mani (misurato: le
 * prime sei mani coincidono, poi divergono). "Stessi pezzi per tutti" sarebbe stata la
 * frase comoda ed e' falsa; "parte uguale per tutti" e' vera.
 */
function IntestazioneSfida({ giorno, t }) {
  const oggi = giornoDiOggi();
  const eOggi = !giorno || giorno === oggi;
  const quando = dataDistesa(giorno ?? oggi);
  return (
    <div className="pl-modalita pl-modalita--sfida">
      <span className="pl-modalita__titolo">
        {t(eOggi ? 'modo.sfidaOggi' : 'modo.sfidaDelGiorno').replace('{giorno}', quando)}
      </span>
      <span className="pl-modalita__nota">
        {t(eOggi ? 'modo.sfidaCosa' : 'modo.sfidaCosaPassata')}
      </span>
    </div>
  );
}

/**
 * Per quante mosse resta scritto "trascina un pezzo sulla griglia".
 * Tre bastano: chi ha appoggiato tre pezzi ha capito come si appoggia un pezzo.
 */
const MOSSE_CON_ISTRUZIONI = 3;

/**
 * La freccia che torna indietro, disegnata sul posto.
 *
 * Un pulsante di sola scritta, con un contorno sottile e nessun segno, sembrava un
 * elemento non finito. Il simbolo lo rende riconoscibile prima di leggerlo, che e'
 * quello che serve a un comando premuto di fretta subito dopo un errore.
 *
 * `currentColor` e non un colore fisso: il pulsante schiarisce al passaggio del mouse
 * e cambia con il tema, e un segno che resta indietro e' peggio che non averlo.
 */
function SegnoAnnulla() {
  return (
    <svg className="pl-annulla__segno" width="16" height="16" viewBox="0 0 24 24"
         fill="none" stroke="currentColor" strokeWidth="2.2"
         strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      {/* Una freccia che torna a sinistra e rientra.
          IL PRIMO DISEGNO ERA UN ARCO CHIUSO con la coda a squadra, la forma classica
          del "torna indietro" circolare. A 15 pixel l'arco diventava un cerchio pieno e
          la coda un puntino: sembrava un simbolo di caricamento, non un ritorno.
          Ingrandito 5 volte si vedeva subito, a dimensione vera no. Questa forma ha
          tratti dritti e una punta netta, e regge anche piccola. */}
      <polyline points="9.5,15 5,10.5 9.5,6" />
      <path d="M5 10.5h9a4.5 4.5 0 0 1 0 9h-1.5" />
    </svg>
  );
}

export function SchermoGioco({
  partita, record, pezziMorti, onGioca, onMenu, animazioni,
  quadro = null, statoQuadro = null, modalita = 'libera',
  siPuoAnnullare = false, onAnnulla = null,
  // Gli attrezzi arrivano solo dai livelli: negli altri modi questi restano a zero e
  // la pastiglia non compare.
  attrezzi = null, suggerimento = null, onGru = null, onGessetto = null,
  onPiccone = null, onMensola = null, onRiprendiMensola = null, t,
}) {
  /*
   * I modi dell'attrezzo in corso:
   *   'chiuso'   si gioca normalmente
   *   'scelta'   il pannello e' aperto
   *   'gru'      si aspetta QUALE pezzo cambiare
   *   'mensola'  si aspetta QUALE pezzo mettere da parte
   *   'piccone'  si aspetta QUALE casella togliere
   *   'scambio'  la mano e' piena e si aspetta con quale pezzo scambiare la mensola
   * I primi tre esistevano gia': gli altri riusano lo stesso meccanismo invece di
   * inventarne uno nuovo, che e' una cosa in meno che puo' rompersi.
   */
  const [modoAttrezzo, setModoAttrezzo] = useState('chiuso');
  const conAttrezzi = attrezzi !== null && onGru && onGessetto && onPiccone && onMensola;
  /** In questi modi si sceglie un pezzo dalla mano, e il tray smette di essere il tray. */
  const sceltaPezzo = modoAttrezzo === 'gru' || modoAttrezzo === 'mensola'
    || modoAttrezzo === 'scambio';

  /* Le caselle che il gesso ha segnato. Si ricavano dal suggerimento e dalla forma del
     pezzo consigliato: il motore dice "questo pezzo, li'", e qui si traduce in caselle. */
  const segnate = useMemo(() => {
    if (!suggerimento) return null;
    const pezzo = partita.hand[suggerimento.handIndex];
    if (!pezzo) return null;
    const celle = new Set();
    for (const [dr, dc] of pezzo.shape.cells) {
      celle.add(idx(suggerimento.row + dr, suggerimento.col + dc));
    }
    return celle;
  }, [suggerimento, partita.hand]);
  const cellRefs = useRef([]);
  const plancia = useRef(null);
  const canvas = useRef(null);
  const campo = useRef(null);

  // --- canvas delle particelle: creato una volta, ridimensionato con la plancia ---
  useEffect(() => {
    if (!canvas.current) return undefined;
    campo.current = new CampoParticelle(canvas.current);
    const adegua = () => {
      const r = plancia.current?.getBoundingClientRect();
      if (r) campo.current?.ridimensiona(r.width, r.height);
    };
    adegua();
    const osservatore = new ResizeObserver(adegua);
    if (plancia.current) osservatore.observe(plancia.current);
    return () => { osservatore.disconnect(); campo.current?.distruggi(); campo.current = null; };
  }, []);

  useEffect(() => { campo.current?.imposta(animazioni); }, [animazioni]);

  /**
   * Il tasto P porta il fuoco sull'anteprima.
   *
   * Perche' un tasto dedicato invece di metterla nel ciclo di Tab: quel ciclo serve a
   * scegliere il pezzo e appoggiarlo, e si percorre a OGNI mossa. Infilarci dentro un
   * elemento che non si puo' appoggiare renderebbe piu' lenta ogni singola mossa di chi
   * gioca da tastiera, per un'informazione che si consulta ogni tanto.
   *
   * Non fa niente mentre si sta scrivendo da qualche parte: rubare la "p" a un campo di
   * testo e' il difetto classico delle scorciatoie a lettera singola.
   */
  useEffect(() => {
    if (partita.modalita !== MODALITA.ANTEPRIMA) return undefined;
    const ascolta = (evento) => {
      if (evento.key !== 'p' && evento.key !== 'P') return;
      if (evento.metaKey || evento.ctrlKey || evento.altKey) return;
      const attivo = document.activeElement;
      if (attivo && (attivo.tagName === 'INPUT' || attivo.tagName === 'TEXTAREA' || attivo.isContentEditable)) return;
      evento.preventDefault();
      document.getElementById('pl-anteprima')?.focus();
    };
    window.addEventListener('keydown', ascolta);
    return () => window.removeEventListener('keydown', ascolta);
  }, [partita.modalita]);

  const effetti = useEffettiMossa({
    lastMove: partita.lastMove,
    campo,
    cellRefs,
    plancia,
    animazioni,
  });

  /** Una mossa rifiutata deve dirlo: il silenzio sembra un gioco rotto. */
  const posiziona = useCallback(
    (handIndex, row, col) => {
      const pezzo = partita.hand[handIndex];
      if (pezzo && !canPlace(partita.grid, pezzo.shape, row, col)) {
        suonoRifiuto();
        vibraRifiuto();
        return;
      }
      onGioca(handIndex, row, col);
    },
    [onGioca, partita.hand, partita.grid],
  );

  const drag = useTrascinamento({
    mano: partita.hand,
    cellRefs,
    onPosiziona: posiziona,
    attivo: partita.status === 'playing',
  });

  const tastiera = useTastiera({
    attivo: partita.status === 'playing',
    selezionato: drag.selezionato,
    conTastiera: drag.selezionatoDaTastiera,
    mano: partita.hand,
    onAnnulla: drag.annulla,
    onPosiziona: (indice, row, col) => {
      const pezzo = partita.hand[indice];
      if (!pezzo) return;
      const origine = origineDaCella(pezzo.shape, row, col);
      posiziona(indice, origine.row, origine.col);
      drag.annulla();
    },
  });

  const prendi = useCallback((evento, handIndex, cella) => {
    sbloccaAudio();
    suonoPresa();
    drag.iniziaTrascinamento(evento, handIndex, cella);
  }, [drag]);

  /**
   * Anteprima della mossa in corso: dove finirebbe il pezzo, se e' una mossa legale,
   * e quali celle sparirebbero. Quest'ultima informazione e' il vero aiuto strategico
   * del gioco: rende leggibile una mossa a tre gruppi che altrimenti si vede solo dopo.
   */
  const anteprima = useMemo(() => {
    // L'intenzione puo' arrivare da tre strade diverse — dito, tocco doppio, tastiera —
    // ma da qui in giu' il gioco non deve sapere quale: l'anteprima e' una sola.
    let indice = null;
    let destinazione = null;
    if (drag.preso) {
      indice = drag.preso.handIndex;
      destinazione = drag.destinazione;
    } else if (drag.selezionato !== null && tastiera.cursore) {
      indice = drag.selezionato;
      const pezzoSelezionato = partita.hand[indice];
      destinazione = pezzoSelezionato
        ? origineDaCella(pezzoSelezionato.shape, tastiera.cursore.row, tastiera.cursore.col)
        : null;
    }
    if (indice == null || !destinazione) return null;
    const pezzo = partita.hand[indice];
    if (!pezzo) return null;

    const celle = shapeCellsAt(pezzo.shape, destinazione.row, destinazione.col);
    if (celle === null) return null;              // fuori griglia: niente da mostrare

    const valida = canPlace(partita.grid, pezzo.shape, destinazione.row, destinazione.col);
    // L'evidenziazione dei gruppi che stanno per chiudersi c'e' sempre: non spiega
    // qualcosa che si potrebbe indovinare, spiega la regola centrale del gioco. Averla
    // dietro un interruttore voleva dire lasciare a caso se un giocatore la capisse.
    let incandidate = null;
    if (valida) {
      const { grid: dopo } = placeShape(
        partita.grid, pezzo.shape, destinazione.row, destinazione.col, pezzo.color,
      );
      const gruppi = findCompletedGroups(dopo);
      if (gruppi.length > 0) {
        incandidate = new Set();
        gruppi.forEach((g) => g.cells.forEach((c) => incandidate.add(c)));
      }
    }
    return { celle: new Set(celle), colore: pezzo.color, valida, incandidate };
  }, [drag.preso, drag.destinazione, drag.selezionato, tastiera.cursore,
      partita.hand, partita.grid]);

  const pezzoTrascinato = drag.preso ? partita.hand[drag.preso.handIndex] : null;

  /**
   * Posizione dei punti volanti, in percentuale sulla plancia.
   *
   * I valori vengono riportati verso il centro: l'etichetta e' larga (un "+612" con
   * sotto la scritta ECCELLENTE) ed e' centrata sulla cella, quindi su una mossa fatta
   * nell'ultima colonna finiva mezza fuori dallo schermo. Meglio un numero spostato di
   * mezza cella che un numero tagliato: serve a far vedere quanto hai guadagnato.
   */
  const puntiVolanti = effetti.puntiVolanti;
  const dentro = (percentuale, margine) =>
    Math.max(margine, Math.min(100 - margine, percentuale));
  const posizionePunti = puntiVolanti != null
    ? {
      left: `${dentro(((colOf(puntiVolanti.cella) + 0.5) / 9) * 100, 22)}%`,
      top: `${dentro(((rowOf(puntiVolanti.cella) + 0.5) / 9) * 100, 12)}%`,
    }
    : null;

  return (
    <div className="pl-screen pl-screen--gioco">
      <Hud
        punteggio={partita.score}
        record={record.best}
        onMenu={onMenu}
        scatta={Boolean(puntiVolanti)}
        t={t}
      />

      {/* Nei livelli l'obiettivo sta sopra la plancia: e' l'unica informazione che
          serve PRIMA di muovere, mentre il punteggio si guarda dopo.

          Nelle altre modalita' al suo posto c'e' il NOME della modalita'. Non e'
          decorazione: senza, la partita libera e un livello si distinguevano solo per
          l'assenza di una striscia, cioe' per una cosa che non c'e' — e un giocatore
          ha creduto di essere al livello 1 mentre era in partita libera, concludendo
          che il livello 1 non avesse obiettivo. Un'assenza non si nota; un'etichetta
          si legge. */}
      {quadro && statoQuadro ? (
        <BarraObiettivo quadro={quadro} stato={statoQuadro} t={t} />
      ) : modalita === 'sfida' ? (
        <IntestazioneSfida giorno={partita.seedLabel} t={t} />
      ) : (
        <p className="pl-modalita">{t(`modo.${modalita}`)}</p>
      )}

      {/* Catena, plancia e suggerimento formano un blocco unico centrato: su schermi
          alti lo spazio che avanza diventa respiro attorno al tavolo da gioco, non
          tre buchi scollegati fra elementi che parlano della stessa cosa. */}
      <div className="pl-plancia-area">
        <div className="pl-tavolo">
          <BarraCatena livello={partita.chain} digiuno={partita.chainDigiuno ?? 0} t={t} />

          <div className={`pl-plancia-involucro ${modoAttrezzo === 'piccone' ? 'pl-plancia-scavo' : ''}`}>
            <Plancia
              ref={plancia}
              grid={partita.grid}
              anteprima={anteprima?.celle}
              anteprimaColore={anteprima?.colore}
              anteprimaValida={anteprima?.valida ?? true}
              incandidate={anteprima?.incandidate}
              appoggiate={effetti.appoggiate}
              esplosioni={effetti.esplosioni}
              celleEsplose={effetti.celleEsplose}
              svuotata={effetti.svuotata}
              cursore={tastiera.cursore}
              segnate={segnate}
              pezzoInMano={drag.selezionato !== null}
              t={t}
              cellRefs={cellRefs}
              canvasRef={canvas}
              onCellPointerUp={
                /* Con il piccone in mano il tocco sulla griglia non appoggia: scava.
                   Il modo si chiude SOLO se una casella e' stata tolta davvero, cosi'
                   chi tocca il vuoto per sbaglio resta in scavo invece di aver perso
                   il giro -- e, nel gestore del livello, non paga niente. */
                modoAttrezzo === 'piccone'
                  ? (e, r, c) => { e.preventDefault(); if (onPiccone(idx(r, c))) setModoAttrezzo('chiuso'); }
                  : drag.selezionato !== null
                    ? (e, r, c) => { e.preventDefault(); drag.posizionaSuCella(r, c); }
                    : undefined
              }
            />
            {puntiVolanti ? (
              <span
                key={puntiVolanti.chiave}
                className={`pl-punti-volanti pl-punti-volanti--${puntiVolanti.tier ?? 'buona'}`}
                style={posizionePunti}
              >
                +{puntiVolanti.punti}
                {puntiVolanti.tinta >= TINTA_SOGLIA ? (
                  <span className="pl-etichetta-tinta">
                    {t('gioca.tinta', { quante: puntiVolanti.tinta })}
                  </span>
                ) : null}
              </span>
            ) : null}

            {/* La frase di incitamento, sopra la griglia.
                E' qui e non sotto la plancia perche' li' sta l'occhio nel momento in cui
                la mossa va a segno: un complimento che arriva dove lo sguardo non e'
                ancora tornato e' un complimento che non si legge.

                `aria-hidden` non la nasconde a chi non vede: la stessa frase e' gia'
                dentro l'annuncio di `Annunci`, insieme a quanto si e' eliminato e a
                quanti punti sono arrivati. Leggerla due volte da due regioni diverse
                renderebbe l'annuncio piu' lungo senza aggiungere niente.

                Non intercetta il tocco (`pointer-events: none` nel foglio di stile): sta
                in mezzo alla griglia, e una casella che smette di rispondere al dito per
                un secondo perche' sopra c'e' un elogio sarebbe il modo piu' sciocco di
                rovinare una mossa.

                LA CHIAVE HA UN PREFISSO perche' i punti volanti, il fratello qui
                sopra, usano lo stesso numero di mossa. Due fratelli con la stessa chiave
                non sono un avviso da ignorare: React puo' scambiarli o ometterne uno, e
                qui vorrebbe dire una frase che non riparte o dei punti che restano
                appesi. L'ha trovato il gate, che tratta come errore ogni avviso della
                console -- 591 avvisi e tre controlli caduti -- dopo che il controllo
                nuovo, che la console non la guardava, l'aveva lasciato passare.

                Con le animazioni spente la frase resta, per lo stesso tempo, ma senza lo
                scatto: chi le ha spente ha chiesto uno schermo piu' calmo, non un gioco
                che smette di parlargli. Il foglio di stile fa la stessa cosa da solo per
                chi ha chiesto meno movimento al sistema operativo; questa classe serve
                per chi l'ha chiesto qui dentro, dove il CSS non puo' saperlo. */}
            {effetti.incita ? (
              <p
                key={`frase-${effetti.incita.chiave}`}
                className={
                  `pl-incitamento pl-incitamento--l${effetti.incita.livello}`
                  + (animazioni ? '' : ' pl-incitamento--fermo')
                }
                aria-hidden="true"
              >
                {t(
                  `incita.${effetti.incita.categoria}.${effetti.incita.variante}`,
                  { quanti: effetti.incita.catena },
                )}
              </p>
            ) : null}
          </div>

          {/* Una riga sola per tre cose che non capitano mai insieme: come si muove, dove
              appoggiare, e il "rimetti a posto". L'altezza e' riservata sempre, anche
              quando e' vuota: se crescesse all'apparire del pulsante, la plancia si
              restringerebbe di colpo a meta' partita, e un tabellone che cambia misura
              sotto il dito e' peggio del difetto che si voleva curare.

              L'ordine di precedenza non e' casuale. Se un pezzo e' gia' in mano, quello
              che serve sapere e' dove appoggiarlo: l'annulla puo' aspettare, e comunque
              resta disponibile appena si lascia la presa.

              PERCHE' L'ISTRUZIONE SPARISCE DOPO LE PRIME MOSSE. "Trascina un pezzo sulla
              griglia" e' utile finche' non si e' trascinato il primo pezzo; dopo e' una
              frase che si rilegge per tutta la partita senza mai servire. E c'era di
              peggio: il pulsante e' disponibile sul 63% delle mosse (misurato sul
              simulatore), quindi la riga passava la partita a rimbalzare fra il pulsante
              e quell'istruzione, una mossa si' e una no. Uno sfarfallio continuo in mezzo
              allo schermo, per dire una cosa che il giocatore sapeva gia'. */}
          <p className={`pl-suggerimento ${conAttrezzi ? 'pl-suggerimento--conattrezzi' : ''}`}>
            {/* IL MESSAGGIO STA DENTRO UN ELEMENTO SUO, e non e' un dettaglio di stile.
                Alcuni di questi rami sono testo nudo: in una griglia un nodo di testo
                diventa un elemento anonimo, che il foglio di stile non puo' collocare e
                che finisce nella prima cella libera. Incartandolo, la riga puo' mettere
                il messaggio al centro e la pastiglia a destra con una regola sola,
                invece di sovrapporli. */}
            <span className="pl-suggerimento__testo">
            {modoAttrezzo === 'gru' || modoAttrezzo === 'mensola' || modoAttrezzo === 'piccone' ? (
              /* Con un attrezzo in corso la riga smette di dire qualunque altra cosa:
                 c'e' una domanda aperta, e due messaggi insieme sarebbero due. */
              <span className="pl-attrezzi__invito">
                {t(`attrezzi.${modoAttrezzo}Scegli`)}
                <button type="button" className="pl-attrezzi__annulla"
                        onClick={() => setModoAttrezzo('chiuso')}>
                  {t('attrezzi.lasciaStare')}
                </button>
              </span>
            ) : drag.selezionato !== null ? (
              t('gioca.tocca')
            ) : siPuoAnnullare ? (
              <button type="button" className="pl-annulla" onClick={onAnnulla}>
                <SegnoAnnulla />
                {t('gioca.annulla')}
              </button>
            ) : partita.stats.moves < MOSSE_CON_ISTRUZIONI ? (
              t('gioca.trascina')
            ) : null}
            </span>
            {conAttrezzi && modoAttrezzo === 'chiuso' ? (
              <MagazzinoAttrezzi
                quanti={attrezzi}
                massimo={ATTREZZI_MASSIMO}
                onApri={() => setModoAttrezzo('scelta')}
                t={t}
              />
            ) : null}
          </p>
          <p className="pl-sr">{t('a11y.istruzioni')}</p>
        </div>
      </div>

      {conAttrezzi ? (
        <Mensola
          pezzo={partita.mensola ?? null}
          inScambio={modoAttrezzo === 'scambio'}
          onRiprendi={() => {
            // Un posto libero c'e': si riprende e basta, con un tocco solo. Se la mano
            // e' piena si passa allo scambio, che e' l'unica cosa che impedisce al pezzo
            // di restare bloccato sulla mensola per sempre.
            const libero = partita.hand.findIndex((p) => p === null);
            if (libero >= 0) onRiprendiMensola(libero);
            else setModoAttrezzo('scambio');
          }}
          onAnnullaScambio={() => setModoAttrezzo('chiuso')}
          t={t}
        />
      ) : null}

      <div className={sceltaPezzo ? 'pl-tray-scelta' : ''}>
        <Tray
          mano={partita.hand}
          pezziMorti={pezziMorti}
          selezionato={sceltaPezzo ? null : drag.selezionato}
          presoIndex={drag.preso?.handIndex ?? null}
          onPointerDownPezzo={sceltaPezzo ? () => {} : prendi}
          onTapPezzo={
            modoAttrezzo === 'gru' ? (i) => { if (onGru(i)) setModoAttrezzo('chiuso'); }
              : modoAttrezzo === 'mensola' ? (i) => { if (onMensola(i)) setModoAttrezzo('chiuso'); }
                : modoAttrezzo === 'scambio'
                  ? (i) => { if (onRiprendiMensola(i)) setModoAttrezzo('chiuso'); }
                  : drag.selezionaPezzo
          }
          t={t}
        />
      </div>

      {/* L'anteprima sta SOTTO i pezzi in mano, e non sopra la plancia dov'era prima.
          La terna successiva viene DOPO quella che hai in mano, e si legge nell'ordine
          in cui arriva: sopra il tabellone era lontana dai pezzi di cui parla, e
          costringeva a saltare avanti e indietro con lo sguardo per confrontarle. */}
      {partita.modalita === MODALITA.ANTEPRIMA ? (
        <AnteprimaTerna mano={partita.manoSuccessiva} t={t} />
      ) : null}

      {pezzoTrascinato && drag.preso ? (
        <div
          className="pl-trascinato"
          style={{ left: `${drag.preso.x}px`, top: `${drag.preso.y}px` }}
        >
          <Pezzo
            shape={pezzoTrascinato.shape}
            color={pezzoTrascinato.color}
            bombe={pezzoTrascinato.bombe}
            cella={drag.preso.cella}
          />
        </div>
      ) : null}

      {modoAttrezzo === 'scelta' ? (
        <PannelloAttrezzi
          quanti={attrezzi}
          ogniLivelli={OGNI_LIVELLI}
          onChiudi={() => setModoAttrezzo('chiuso')}
          /* La mensola si puo' scegliere solo se e' libera: due pezzi su una mensola
             sola non ci stanno, e un pulsante che si preme e non fa niente e' peggio
             di un pulsante spento che dice perche'. */
          disabilitati={partita.mensola ? ['mensola'] : []}
          onScegli={(quale) => {
            if (quale === 'gessetto') { onGessetto(); setModoAttrezzo('chiuso'); return; }
            setModoAttrezzo(quale);
          }}
          t={t}
        />
      ) : null}

      <Annunci testo={frasePerMossa(partita.lastMove, t)} />
    </div>
  );
}
