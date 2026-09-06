import { Component } from 'react';

/**
 * Rete di sicurezza attorno a tutta l'applicazione.
 *
 * Perche' esiste. Un errore in un componente React non lascia lo schermo com'era:
 * smonta l'intero albero. Il giocatore vede il fondo e basta — schermo nero, gioco
 * bloccato, nessun pulsante, nemmeno un modo per tornare alla home. E' successo
 * davvero: una schermata di sconfitta chiamava .map() su un oggetto e il gioco si
 * spegneva perdendo un livello.
 *
 * Quel difetto e' stato corretto alla radice, ma la fragilita' che lo rendeva
 * CATASTROFICO invece che fastidioso e' un'altra cosa, e resta finche' non si mette
 * una rete. Un difetto in una schermata deve costare quella schermata, non la
 * partita, non il gioco, non i progressi salvati.
 *
 * Cosa fa e cosa non fa. Mostra un messaggio e un pulsante per ricominciare da capo:
 * ricaricare la pagina e' sufficiente perche' i dati stanno in localStorage e non
 * vengono toccati da un errore di disegno. NON prova a indovinare come rimettersi a
 * posto da sola: uno stato di cui non sappiamo niente non si ripara a tentativi.
 *
 * E' scritta come classe perche' React non offre altro modo di intercettare un errore
 * di rendering: `componentDidCatch` non ha un equivalente fra gli hook.
 */
export class Salvagente extends Component {
  constructor(props) {
    super(props);
    this.state = { errore: null };
  }

  static getDerivedStateFromError(errore) {
    return { errore };
  }

  componentDidCatch(errore) {
    // In produzione non c'e' nessuno a leggere la console, ma chi sviluppa apre gli
    // strumenti: l'errore va lasciato visibile invece che inghiottito dalla rete.
    // Niente invii a servizi esterni: il gioco non parla con nessuno, nemmeno quando
    // si rompe. Vale anche per la diagnostica.
    console.error('PLINTO si e fermato per un errore:', errore);
  }

  render() {
    const { errore } = this.state;
    const { children, t } = this.props;
    if (!errore) return children;

    return (
      <div className="pl-screen pl-crash">
        <div className="pl-crash__corpo">
          <h1 className="pl-crash__titolo">{t('errore.titolo')}</h1>
          <p className="pl-testo">{t('errore.testo')}</p>
          {/* Il messaggio tecnico serve a chi segnala il problema: senza, una
              segnalazione dice solo "si e' bloccato" e non si sa da dove partire. */}
          <p className="pl-nota pl-crash__dettaglio">{String(errore?.message ?? errore)}</p>
          <button
            type="button"
            className="pl-btn pl-btn--primario pl-btn--largo"
            onClick={() => window.location.reload()}
          >
            {t('errore.ricarica')}
          </button>
          <p className="pl-nota pl-nota--piede">{t('errore.dati')}</p>
        </div>
      </div>
    );
  }
}
