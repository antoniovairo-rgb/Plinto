import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Il manifest Android, controllato senza un telefono.
 *
 * PERCHE' ESISTE. La prima installazione di PLINTO su un telefono vero e' morta
 * all'avvio, prima di disegnare qualsiasi cosa:
 *
 *   IllegalArgumentException: Component class ManageDataLauncherActivity
 *   does not exist in io.github.antoniovairo_rgb.plinto
 *
 * `androidbrowserhelper`, all'apertura, prova ad attivare alcuni componenti che si
 * aspetta di trovare dichiarati, e lo fa SENZA verificare che esistano. Un componente
 * mancante non e' un avviso di compilazione ne' un errore di caricamento sullo store:
 * e' un'app che si chiude, e l'unico modo di accorgersene era installarla.
 *
 * Questo file rende quel controllo automatico. Non prova che l'app funzioni: prova che
 * il patto fra il nostro manifest e la libreria sia completo, che e' l'unica parte
 * verificabile senza un dispositivo.
 *
 * Il riferimento e' il progetto ufficiale di Google:
 * https://github.com/GoogleChrome/android-browser-helper/blob/main/demos/twa-basic/src/main/AndroidManifest.xml
 */

const RADICE = new URL('..', import.meta.url).pathname;
const MAIN = join(RADICE, 'android/app/src/main');
const manifest = readFileSync(join(MAIN, 'AndroidManifest.xml'), 'utf8');

/** Tutti gli XML del progetto Android. */
function xmlDelProgetto(cartella = MAIN, trovati = []) {
  for (const voce of readdirSync(cartella, { withFileTypes: true })) {
    const percorso = join(cartella, voce.name);
    if (voce.isDirectory()) xmlDelProgetto(percorso, trovati);
    else if (voce.name.endsWith('.xml')) trovati.push(percorso);
  }
  return trovati;
}

describe('componenti che la libreria si aspetta di trovare', () => {
  // Ognuno di questi, se manca, produce un crash all'avvio invece di un errore di
  // compilazione. Sono elencati per nome e non "controllati genericamente" perche' la
  // lista e' esattamente cio' che va tenuto allineato alla libreria.
  const OBBLIGATORI = [
    'com.google.androidbrowserhelper.trusted.LauncherActivity',
    'com.google.androidbrowserhelper.trusted.ManageDataLauncherActivity',
    'com.google.androidbrowserhelper.trusted.FocusActivity',
    'com.google.androidbrowserhelper.trusted.DelegationService',
  ];

  for (const nome of OBBLIGATORI) {
    it(`dichiara ${nome.split('.').pop()}`, () => {
      expect(manifest).toContain(`android:name="${nome}"`);
    });
  }

  it('indica ManageDataLauncherActivity anche come manageSpaceActivity', () => {
    expect(manifest).toMatch(
      /android:manageSpaceActivity="com\.google\.androidbrowserhelper\.trusted\.ManageDataLauncherActivity"/,
    );
  });

  it('espone DelegationService, perche' + "' chi si collega e' il browser", () => {
    const servizio = manifest.slice(manifest.indexOf('DelegationService'));
    expect(servizio).toMatch(/android:exported="true"/);
  });
});

describe('schermata di avvio', () => {
  // Le tre meta-data della schermata d'avvio chiedono al BROWSER di disegnare
  // un'immagine che sta in questa app. Il passaggio avviene per FileProvider: se se ne
  // dichiara una senza l'altro, il risultato e' di nuovo un crash all'avvio.
  const chiedeLaSchermata = manifest.includes('SPLASH_IMAGE_DRAWABLE');

  it.runIf(chiedeLaSchermata)('dichiara il FileProvider', () => {
    expect(manifest).toContain('androidx.core.content.FileProvider');
    expect(manifest).toContain('android.support.customtabs.trusted.FILE_PROVIDER_AUTHORITY');
  });

  it.runIf(chiedeLaSchermata)('il provider e la meta-data usano la stessa autorita\'', () => {
    const autorita = [...manifest.matchAll(/@string\/(\w*[Aa]utorita\w*)/g)].map((m) => m[1]);
    expect(autorita.length).toBe(2);
    expect(new Set(autorita).size).toBe(1);
  });

  it.runIf(chiedeLaSchermata)('espone la cartella che la libreria usa davvero', () => {
    const percorsi = join(MAIN, 'res/xml/filepaths.xml');
    expect(existsSync(percorsi)).toBe(true);
    // `twa_splash/` non e' un nome scelto da noi: e' dove scrive androidbrowserhelper.
    expect(readFileSync(percorsi, 'utf8')).toContain('twa_splash/');
  });
});

describe('gli XML sono ben formati', () => {
  // Un doppio trattino dentro un commento e' vietato in XML, e la compilazione lo
  // segnala con la sola riga e colonna: "not well-formed (invalid token)". Scrivendo
  // commenti lunghi in italiano ci si finisce dentro con naturalezza.
  for (const file of xmlDelProgetto()) {
    const nome = file.slice(MAIN.length + 1);
    it(`${nome}: nessun doppio trattino nei commenti`, () => {
      const commenti = readFileSync(file, 'utf8').match(/<!--[\s\S]*?-->/g) ?? [];
      for (const commento of commenti) {
        expect(commento.slice(4, -3)).not.toContain('--');
      }
    });
  }
});

describe('il patto con il sito', () => {
  it('il manifest e assetlinks.json parlano dello stesso pacchetto', () => {
    const assetlinks = JSON.parse(
      readFileSync(join(RADICE, 'sito-radice/.well-known/assetlinks.json'), 'utf8'),
    );
    const gradle = readFileSync(join(RADICE, 'android/app/build.gradle'), 'utf8');
    const applicationId = gradle.match(/applicationId '([^']+)'/)[1];
    expect(assetlinks[0].target.package_name).toBe(applicationId);
  });

  it('il sito dichiarato nel manifest e quello aperto dall\'app hanno lo stesso dominio', () => {
    const strings = readFileSync(join(MAIN, 'res/values/strings.xml'), 'utf8');
    const dichiarato = strings.match(/\\"site\\":\s*\\"(https:\/\/[^\\"]+)\\"/)[1];
    const aperto = strings.match(/name="urlIniziale"[^>]*>([^<]+)</)[1];
    expect(new URL(aperto).origin).toBe(new URL(dichiarato).origin);
  });
});
