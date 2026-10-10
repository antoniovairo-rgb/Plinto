import { describe, it, expect } from 'vitest';
import { apertaDallApp } from '../src/persistence/recensione.js';
import { PLAY_URL } from '../src/config/progetto.js';

/**
 * L'invito a recensire compare solo nell'app del Play Store: qui si prova il
 * riconoscimento, che e' la parte che decide a chi mostrarlo.
 */
describe('riconoscimento dell app del Play Store', () => {
  const id = new URL(PLAY_URL).searchParams.get('id');

  it('il pacchetto si legge dal collegamento al Play Store', () => {
    expect(id).toBe('io.github.antoniovairo_rgb.plinto');
  });

  it('riconosce il parametro di avvio ?origine=play', () => {
    expect(apertaDallApp('?origine=play', '')).toBe(true);
    expect(apertaDallApp('?x=1&origine=play', '')).toBe(true);
  });

  it('riconosce il referrer dell app, con o senza barra finale', () => {
    expect(apertaDallApp('', `android-app://${id}`)).toBe(true);
    expect(apertaDallApp('', `android-app://${id}/`)).toBe(true);
  });

  it('non si fa ingannare da altri referrer o parametri', () => {
    expect(apertaDallApp('', '')).toBe(false);
    expect(apertaDallApp('', 'https://www.google.com/')).toBe(false);
    expect(apertaDallApp('', 'android-app://com.android.chrome/')).toBe(false);
    expect(apertaDallApp('', `android-app://${id}.falso`)).toBe(false);
    expect(apertaDallApp('?origine=browser', '')).toBe(false);
    expect(apertaDallApp(undefined, undefined)).toBe(false);
  });
});
