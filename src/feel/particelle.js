/**
 * Particelle delle eliminazioni.
 *
 * Un solo canvas sovrapposto alla plancia, non un nodo DOM per scintilla: con quattro
 * gruppi chiusi insieme si parla di oltre trenta celle, e altrettanti elementi animati
 * dal browser farebbero scattare i telefoni lenti proprio nel momento piu' bello.
 *
 * Il ciclo di animazione ESISTE SOLO QUANDO SERVE: nessun requestAnimationFrame gira
 * a vuoto mentre il giocatore pensa. Un puzzle si gioca a lungo e spesso in mobilita':
 * tenere acceso un loop inutile e' batteria rubata.
 */

const GRAVITA = 0.14;
const ATTRITO = 0.985;

/**
 * Tetto delle particelle vive insieme. Oltre questa soglia l'occhio non distingue
 * piu' nulla e si paga solo in fotogrammi persi.
 */
const TETTO_PARTICELLE = 900;

export class CampoParticelle {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particelle = [];
    // Le onde d'urto stanno in una lista a parte perche' si disegnano PRIMA delle
    // particelle (sono lo sfondo del botto, non i suoi coriandoli) e perche' sono
    // pochissime: una per gruppo chiuso, non una per cella.
    this.onde = [];
    this.frame = null;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    this.attivo = true;
  }

  /** Adegua il canvas alla dimensione reale del suo contenitore. */
  ridimensiona(larghezza, altezza) {
    this.canvas.width = Math.round(larghezza * this.dpr);
    this.canvas.height = Math.round(altezza * this.dpr);
    this.canvas.style.width = `${larghezza}px`;
    this.canvas.style.height = `${altezza}px`;
  }

  /** Spegne del tutto le particelle (impostazione "animazioni" disattivata). */
  imposta(attivo) {
    this.attivo = attivo;
    if (!attivo) this.svuota();
  }

  svuota() {
    this.particelle.length = 0;
    this.onde.length = 0;
    if (this.frame) { cancelAnimationFrame(this.frame); this.frame = null; }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Genera un'esplosione.
   * @param {{x:number,y:number,lato:number,colore:string}[]} celle celle esplose
   * @param {number} intensita 1 = eliminazione normale, cresce con i gruppi chiusi
   * @param {number} brillantezza 1 = normale; sopra 1 le schegge sono piu' grandi,
   *   piu' veloci e restano a schermo piu' a lungo. E' la leva con cui la Tinta e
   *   le bombe si distinguono a occhio da un'eliminazione qualunque.
   */
  esplodi(celle, intensita = 1, brillantezza = 1) {
    if (!this.attivo) return;
    const perCella = Math.min(14, 3 + Math.round(intensita * 1.6 * brillantezza));
    for (const cella of celle) {
      for (let i = 0; i < perCella; i += 1) {
        const angolo = Math.random() * Math.PI * 2;
        const velocita = (0.9 + Math.random() * 2.4) * (0.8 + intensita * 0.25) * brillantezza;
        this.particelle.push({
          x: cella.x + cella.lato / 2,
          y: cella.y + cella.lato / 2,
          vx: Math.cos(angolo) * velocita,
          vy: Math.sin(angolo) * velocita - 1.1 * brillantezza,
          vita: 1,
          // Piu' e' brillante, piu' lentamente svanisce: un botto grosso che sparisce
          // alla stessa velocita' di uno piccolo non sembra piu' grosso, sembra solo
          // piu' affollato.
          decadimento: (0.016 + Math.random() * 0.018) / brillantezza,
          lato: cella.lato * (0.12 + Math.random() * 0.16) * Math.min(1.6, brillantezza),
          colore: cella.colore,
          rotazione: Math.random() * Math.PI,
          giro: (Math.random() - 0.5) * 0.22,
        });
      }
    }
    if (this.particelle.length > TETTO_PARTICELLE) {
      this.particelle.splice(0, this.particelle.length - TETTO_PARTICELLE);
    }
    this.avvia();
  }

  /**
   * Onda d'urto: un anello che si allarga e sbiadisce dal centro di cio' che e'
   * appena sparito.
   *
   * PERCHE' ESISTE. Le schegge raccontano QUANTE celle sono saltate, ma non DOVE:
   * con quattro gruppi chiusi insieme il tabellone diventa una nuvola uniforme e
   * l'intreccio -- la cosa piu' difficile del gioco -- si vede meno di una riga
   * singola. L'anello parte dal centro di ogni gruppo: quattro anelli che si
   * allargano insieme si contano a colpo d'occhio, quattro nuvole no.
   *
   * L'onda e' un'ELLISSE, non un cerchio, e la forma la decide chi la chiede: una riga
   * chiusa manda un'onda larga e schiacciata che corre lungo la riga, una colonna una
   * alta e stretta, un quadrante una tonda. Con i cerchi per tutti, l'onda di una riga
   * era un arco enorme che invadeva mezzo tabellone senza dire da dove veniva: provato
   * a schermo, sembrava un disegno fuori posto e non un'onda.
   *
   * @param {{x:number,y:number,raggioX:number,raggioY:number,colore:string,
   *          spessore?:number,opacita?:number}[]} centri
   */
  onda(centri) {
    if (!this.attivo) return;
    for (const c of centri) {
      this.onde.push({
        x: c.x,
        y: c.y,
        raggioX: c.raggioX * 0.3,
        raggioY: c.raggioY * 0.3,
        maxX: c.raggioX,
        maxY: c.raggioY,
        vita: 1,
        decadimento: 0.045,
        colore: c.colore,
        spessore: c.spessore ?? 3,
        opacita: c.opacita ?? 0.55,
      });
    }
    // Stesso ragionamento del tetto sulle particelle, con un numero molto piu' basso:
    // gli anelli sono grandi e trasparenti, e sovrapposti diventano una macchia.
    if (this.onde.length > 12) this.onde.splice(0, this.onde.length - 12);
    this.avvia();
  }

  avvia() {
    if (this.frame !== null) return;
    const passo = () => {
      this.frame = null;
      const { ctx, canvas, dpr } = this;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Gli anelli per primi: stanno SOTTO le schegge, come il lampo sta sotto
      // i detriti. Disegnarli dopo li farebbe sembrare un velo sopra il tabellone.
      for (let i = this.onde.length - 1; i >= 0; i -= 1) {
        const o = this.onde[i];
        o.vita -= o.decadimento;
        if (o.vita <= 0) { this.onde.splice(i, 1); continue; }
        // Si allarga in fretta all'inizio e rallenta: e' il profilo di un'onda vera,
        // e soprattutto e' quello che rende leggibile il centro da cui e' partita.
        const avanzamento = 1 - o.vita * o.vita;
        const rx = o.raggioX + (o.maxX - o.raggioX) * avanzamento;
        const ry = o.raggioY + (o.maxY - o.raggioY) * avanzamento;
        ctx.save();
        ctx.globalAlpha = Math.max(0, o.vita * o.opacita);
        ctx.strokeStyle = o.colore;
        ctx.lineWidth = o.spessore * dpr * Math.max(0.35, o.vita);
        ctx.beginPath();
        ctx.ellipse(
          o.x * dpr, o.y * dpr,
          Math.max(0, rx * dpr), Math.max(0, ry * dpr),
          0, 0, Math.PI * 2,
        );
        ctx.stroke();
        ctx.restore();
      }

      for (let i = this.particelle.length - 1; i >= 0; i -= 1) {
        const p = this.particelle[i];
        p.vx *= ATTRITO;
        p.vy = p.vy * ATTRITO + GRAVITA;
        p.x += p.vx;
        p.y += p.vy;
        p.rotazione += p.giro;
        p.vita -= p.decadimento;
        if (p.vita <= 0) { this.particelle.splice(i, 1); continue; }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.vita);
        ctx.translate(p.x * dpr, p.y * dpr);
        ctx.rotate(p.rotazione);
        ctx.fillStyle = p.colore;
        const l = p.lato * dpr;
        ctx.fillRect(-l / 2, -l / 2, l, l);
        ctx.restore();
      }

      if (this.particelle.length > 0 || this.onde.length > 0) {
        this.frame = requestAnimationFrame(passo);
      }
    };
    this.frame = requestAnimationFrame(passo);
  }

  distruggi() {
    this.svuota();
  }
}
