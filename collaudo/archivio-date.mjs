// Archivio: date limite (prima sfida, bisestile, fine anno, fusi estremi) con orologio simulato.
import { apri, testo, shot, overflow } from './lib.mjs';
const casi = [
  ['2026-09-06T00:00:30+02:00', 'Europe/Rome', 'primo giorno in assoluto'],
  ['2026-09-05T23:59:30+02:00', 'Europe/Rome', 'giorno PRIMA della prima sfida'],
  ['2028-02-29T12:00:00+01:00', 'Europe/Rome', '29 febbraio 2028'],
  ['2026-12-31T23:59:00-08:00', 'America/Los_Angeles', 'fine anno a Los Angeles'],
  ['2026-10-15T08:00:00+14:00', 'Pacific/Kiritimati', 'UTC+14'],
  ['2026-10-31T23:30:00-11:00', 'Pacific/Pago_Pago', 'UTC-11 fine mese'],
  ['2026-03-29T03:30:00+02:00', 'Europe/Rome', 'cambio ora legale (anno prima della sfida: solo calendario)'],
];
for (const [t, tz, nome] of casi) {
  const { browser, page, errori } = await apri({ clock: t, ctxOpts: { timezoneId: tz }, storage: { settings: { versione: 1, introVista: true } } });
  const data = await page.evaluate(() => new Date().toString());
  await page.getByRole('button', { name: 'Archivio delle sfide' }).click(); await page.waitForTimeout(300);
  const info = await page.evaluate(() => {
    const giorni = [...document.querySelectorAll('.pl-archivio button, .pl-archivio [role=gridcell], table button')];
    const abil = giorni.filter((b) => !b.disabled && !b.getAttribute('aria-disabled'));
    return { mese: document.querySelector('.pl-archivio__mese')?.innerText, nGiorni: giorni.length, abilitati: abil.length, primo: abil[0]?.getAttribute('aria-label') ?? abil[0]?.innerText, ultimo: abil.at(-1)?.getAttribute('aria-label') ?? abil.at(-1)?.innerText, prec: !document.querySelector('[aria-label*="precedente" i]')?.disabled, succ: !document.querySelector('[aria-label*="successivo" i]')?.disabled };
  });
  console.log(`\n${nome} | ${data}\n  `, JSON.stringify(info), (await overflow(page)).filter((x) => !/pl-sr/.test(x)), errori.length ? errori : '');
  await shot(page, 'archivio-' + nome.replace(/\W+/g, '_').slice(0, 30));
  await browser.close();
}
