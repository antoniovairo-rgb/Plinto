/**
 * Genera public/privacy.html da docs/PRIVACY.md.
 *
 * PERCHE' GENERATA E NON SCRITTA. Il Play Store vuole un indirizzo pubblico che apra
 * l'informativa privacy; il progetto ne ha gia' una, in Markdown, dentro docs/. Copiarla a
 * mano in una pagina HTML vorrebbe dire avere due informative: quella vera e quella che
 * legge la gente. Prima o poi ne cambia una sola, e a quel punto il documento che il
 * giocatore legge dice una cosa che il codice non fa piu'. E' esattamente la bugia che
 * questo progetto esiste per non raccontare -- con l'aggravante che un'informativa privacy
 * inesatta non e' un difetto estetico.
 *
 * `tests/privacy.test.js` controlla che la pagina generata sia allineata al Markdown: se
 * qualcuno modifica l'uno e dimentica l'altra, la verifica fallisce.
 *
 * Uso: npm run privacy
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

const SORGENTE = new URL('../docs/PRIVACY.md', import.meta.url);
const USCITA = new URL('../public/privacy.html', import.meta.url);

/** Le poche marcature usate davvero da PRIVACY.md, e nessuna in piu'. */
function inLinea(testo) {
  return testo
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>');
}

/** Da Markdown a HTML, per il sottoinsieme che questo documento usa. */
export function converti(markdown) {
  const righe = markdown.split('\n');
  const fuori = [];
  let inElenco = false;
  let inTabella = false;

  const chiudi = () => {
    if (inElenco) { fuori.push('</ul>'); inElenco = false; }
    if (inTabella) { fuori.push('</tbody></table>'); inTabella = false; }
  };

  for (let i = 0; i < righe.length; i += 1) {
    const riga = righe[i];
    const nuda = riga.trim();

    if (nuda === '') { chiudi(); continue; }

    const titolo = nuda.match(/^(#{1,3})\s+(.*)$/);
    if (titolo) {
      chiudi();
      const livello = titolo[1].length;
      fuori.push(`<h${livello}>${inLinea(titolo[2])}</h${livello}>`);
      continue;
    }

    if (/^\|/.test(nuda)) {
      // La riga dei trattini separa intestazione e corpo: non si disegna.
      if (/^\|[\s:|-]+\|$/.test(nuda)) continue;
      const celle = nuda.slice(1, -1).split('|').map((c) => inLinea(c.trim()));
      if (!inTabella) {
        inTabella = true;
        fuori.push('<table><thead><tr>' + celle.map((c) => `<th>${c}</th>`).join('') + '</tr></thead><tbody>');
        continue;
      }
      fuori.push('<tr>' + celle.map((c) => `<td>${c}</td>`).join('') + '</tr>');
      continue;
    }

    const voce = nuda.match(/^[-*]\s+(.*)$/) || nuda.match(/^\d+\.\s+(.*)$/);
    if (voce) {
      if (inTabella) chiudi();
      if (!inElenco) { fuori.push('<ul>'); inElenco = true; }
      fuori.push(`<li>${inLinea(voce[1])}</li>`);
      continue;
    }

    // Continuazione di una voce d'elenco o di una riga di tabella: si attacca sopra.
    if (inElenco && /^\s+/.test(riga)) {
      fuori[fuori.length - 1] = fuori[fuori.length - 1].replace(/<\/li>$/, ` ${inLinea(nuda)}</li>`);
      continue;
    }

    chiudi();
    fuori.push(`<p>${inLinea(nuda)}</p>`);
  }
  chiudi();
  return fuori.join('\n');
}

/** La pagina intera, dal Markdown. Esportata perche' il test possa confrontarla. */
export function pagina(markdown) {
  const corpo = converti(markdown);
  return `<!doctype html>
<html lang="it">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Informativa privacy — PLINTO</title>
<meta name="description" content="Informativa privacy di PLINTO: il gioco non raccoglie nulla.">
<!-- GENERATA DA docs/PRIVACY.md — non modificare a mano: usa npm run privacy -->
<style>
  :root { color-scheme: dark; }
  body {
    margin: 0; padding: 32px 20px 64px;
    background: #0E1118; color: #E6E9F0;
    font: 16px/1.65 system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  }
  main { max-width: 44rem; margin: 0 auto; }
  h1 { font-size: 1.7rem; line-height: 1.25; margin: 0 0 1.2rem; }
  h2 { font-size: 1.2rem; margin: 2.2rem 0 .7rem; color: #FFC94A; }
  h3 { font-size: 1.02rem; margin: 1.6rem 0 .5rem; }
  p, li { color: #D2D7E3; }
  a { color: #7FB4FF; }
  code { background: #1A1F2B; padding: .1em .35em; border-radius: 4px; font-size: .92em; }
  table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
  th, td { text-align: left; padding: .55rem .6rem; border-bottom: 1px solid #262C3A; vertical-align: top; }
  th { color: #FFFFFF; font-size: .82rem; text-transform: uppercase; letter-spacing: .08em; }
  ul { padding-left: 1.2rem; }
  li { margin: .35rem 0; }
  em { color: #9AA3B8; }
  .torna { display: inline-block; margin-top: 2.5rem; color: #7FB4FF; }
</style>
</head>
<body>
<main>
${corpo}
<a class="torna" href="./">← Torna al gioco</a>
</main>
</body>
</html>
`;

}

/**
 * Scrive SOLO quando lo script viene lanciato, non quando viene importato.
 *
 * Senza questa guardia il test che controlla l'allineamento fra Markdown e pagina
 * RIGENERAVA la pagina nel momento stesso in cui la importava per confrontarla: passava
 * sempre, per costruzione, e non poteva accorgersi di niente. Un controllo che si aggiusta
 * da solo prima di guardare non e' un controllo.
 */
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const html = pagina(readFileSync(SORGENTE, 'utf8'));
  writeFileSync(USCITA, html);
  console.log(`Scritta public/privacy.html (${html.length} caratteri) da docs/PRIVACY.md`);
}
