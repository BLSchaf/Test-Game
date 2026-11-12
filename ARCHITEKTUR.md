# Eichelpfad – Code-Überblick (One-Pager)

Reines HTML/CSS/JavaScript, kein Build, keine Abhängigkeiten. Starten: `python3 -m http.server 8000`, dann http://localhost:8000.

## Dateien und ihre Aufgabe

| Datei | Aufgabe |
|---|---|
| `index.html` | Gerüst: Canvas plus alle Menüs, Leisten und Fenster (Panels) als HTML. |
| `style.css` | Aussehen der Oberfläche: Farben (`:root`), Buttons, Leisten, Fenster. |
| `js/main.js` | **Das Spiel selbst:** Speicherstand, Menü, Eingabe, Spielablauf, Sterne, Story-Anzeige. |
| `js/rules.js` | **Die Spielregeln**, rein rechnerisch: `move()` führt einen Wisch aus, `solve()` findet die kürzeste Lösung. |
| `js/generator.js` | Erzeugt Level aus einem Zufallswert (Seed) und prüft sie mit dem Löser. Hier steht die Schwierigkeitskurve. |
| `js/board.js` | Zeichnet das Spielfeld und spielt Animationen, Partikel und Wetter ab. |
| `js/sprites.js` | Alle Pixelgrafiken, im Code als Text-Raster bzw. per Programm erzeugt. Dazu die drei Farbwelten. |
| `js/audio.js` | Musik und Soundeffekte, komplett per Web Audio erzeugt (keine Audiodateien). |
| `js/story.js` | Alle Story- und Kiko-Sprüche in Deutsch und Englisch. |
| `js/strings.js` | Alle Oberflächentexte in Deutsch und Englisch. |
| `.github/workflows/pages.yml` | Veröffentlicht das Spiel bei jedem Push auf `main` auf GitHub Pages. |

## Wie die Teile zusammenspielen

`main.js` hält den Spielzustand. Bei einem Wisch ruft es `rules.move()` auf. Das liefert den neuen Zustand und eine Liste von Ereignissen (Schritt, Eichel, Laub, …). `board.js` spielt diese Ereignisse als Animation ab. Level kommen aus `generator.js`, das mit `rules.solve()` jedes Level auf Lösbarkeit prüft und die Mindestzüge ("Par") bestimmt.

Speicherstand: `localStorage`, Schlüssel `eichelpfad-save-v1` (`main.js`, oben).

## Was du wo anpassen kannst

| Ich möchte … | Datei, Stelle |
|---|---|
| Ab wann neue Elemente auftauchen | `generator.js`: `UNLOCK` (Zeile ~25) |
| Schwierigkeit, Feldgröße, Eichelzahl | `generator.js`: `paramsFor()` (~33) |
| Tagesrätsel schwerer/leichter | `generator.js`: `dailyParams()` (~230) |
| Ab wann man Kiko spielen darf | `main.js`: `MONKEY_UNLOCK` (Zeile 11) |
| Wann es 1/2/3 Sterne gibt | `main.js`: `starsFor()` (~376) |
| Tempo der Animation | `board.js`: `STEP_TIME` (Zeile 6) |
| Neue Regeln für ein Element | `rules.js`: `move()`, dazu Zeichnung in `sprites.js` und `board.js` |
| Figuren, Eicheln, Bäume umzeichnen | `sprites.js`: `MAPS` (~15), jedes Zeichen = ein Pixel, Farben oben in `BASE` |
| Farben der Jahreszeiten/Biome | `sprites.js`: `BIOMES` (~285) |
| Musik ändern | `audio.js`: `TRACK_DEFS` (~34) |
| Soundeffekte ändern | `audio.js`: `SFX` (~167) |
| Story- oder Kiko-Texte | `story.js` (Level-Nummer + Zeilen für `de`/`en`) |
| Buttons, Menütexte | `strings.js` |
| Farben, Rahmen, Schrift der Oberfläche | `style.css` |
| Tasten | `main.js`: `KEY_DIR` (~560) und der `keydown`-Block darunter |

Zeilennummern sind ungefähre Orientierung; nach Änderungen verschieben sie sich. Am besten nach dem Namen suchen.

## Spielelemente (Zahlen in `rules.js`, Tabelle `T`)

Boden, Wand (Baum/Busch/Stein), Laubhaufen (stoppt), zwei Federzweig-Richtungen (lenken um), Erdloch (Tunnel, immer genau zwei), Baumbau (Ziel). Dazu bewegliche Baumstämme und Kiko (Platztausch), die im Zustand mitgeführt werden.

## Testen nach Änderungen

1. Seite lokal starten und kurz durchspielen.
2. Browser-Konsole (F12) auf Fehler prüfen.
3. Nach Änderungen am Generator oder an `rules.js` wichtig: Der Löser prüft Level nur mit denselben Regeln. Ändert man `move()`, stimmen die Mindestzüge weiterhin, weil beides dieselbe Funktion nutzt.
4. Wer den Speicherstand zurücksetzen will: Einstellungen → Fortschritt zurücksetzen.
