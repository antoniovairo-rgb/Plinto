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

export class CampoParticelle {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.particelle = [];
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
    if (this.frame) { cancelAnimationFrame(this.frame); this.frame = null; }
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  /**
   * Genera un'esplosione.
   * @param {{x:number,y:number,lato:number,colore:string}[]} celle celle esplose
   * @param {number} intensita 1 = eliminazione normale, cresce con i gruppi chiusi
   */
  esplodi(celle, intensita = 1) {
    if (!this.attivo) return;
    const perCella = Math.min(9, 3 + Math.round(intensita * 1.6));
    for (const cella of celle) {
      for (let i = 0; i < perCella; i += 1) {
        const angolo = Math.random() * Math.PI * 2;
        const velocita = (0.9 + Math.random() * 2.4) * (0.8 + intensita * 0.25);
        this.particelle.push({
          x: cella.x + cella.lato / 2,
          y: cella.y + cella.lato / 2,
          vx: Math.cos(angolo) * velocita,
          vy: Math.sin(angolo) * velocita - 1.1,
          vita: 1,
          decadimento: 0.016 + Math.random() * 0.018,
          lato: cella.lato * (0.12 + Math.random() * 0.16),
          colore: cella.colore,
          rotazione: Math.random() * Math.PI,
          giro: (Math.random() - 0.5) * 0.22,
        });
      }
    }
    // Tetto di sicurezza: oltre questa soglia l'occhio non distingue piu' nulla
    // e si paga solo in fotogrammi persi.
    if (this.particelle.length > 900) this.particelle.splice(0, this.particelle.length - 900);
    this.avvia();
  }

  avvia() {
    if (this.frame !== null) return;
    const passo = () => {
      this.frame = null;
      const { ctx, canvas, dpr } = this;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

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

      if (this.particelle.length > 0) this.frame = requestAnimationFrame(passo);
    };
    this.frame = requestAnimationFrame(passo);
  }

  distruggi() {
    this.svuota();
  }
}
