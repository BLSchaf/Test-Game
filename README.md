# Eichelpfad 🌰

Ein gemütliches Pixel-Art-Puzzlespiel für Handy und Desktop (englischer Name: *Acorn Trail*).

## Spielprinzip

Eichhörnchen Fips flitzt immer geradeaus, bis etwas im Weg ist. Sammle alle Eicheln und kehre dann in den Baumbau zurück – mit möglichst wenigen Zügen. Unterwegs kommen Laubhaufen (bremsen), rollende Baumstämme, Federzweige (lenken um), Erdlöcher (Tunnel) und Affe Kiko (tauscht den Platz) dazu.

## Modi

- **Endlose Reise:** prozedural erzeugte Level mit steigender Schwierigkeit, bis zu 3 Sterne pro Level.
- **Tagesrätsel:** jeden Tag ein Level, für alle gleich.
- Der Fortschritt lässt sich in den Einstellungen zurücksetzen.

## Steuerung

- **Touch:** wischen.
- **Tastatur:** Pfeiltasten oder WASD.
- **Z** = Rückgängig, **R** = Neustart, **H** = Tipp von Kiko, **Esc** = Menü.

## Lokal starten

Das Spiel nutzt ES-Module und braucht deshalb einen kleinen statischen Webserver. Im Projektordner einfach:

```bash
python3 -m http.server 8000
```

Dann im Browser http://localhost:8000 öffnen.

## Veröffentlichen (GitHub Pages)

Im Repository unter **Settings → Pages** bei „Source“ den Eintrag **GitHub Actions** wählen. Jeder Push auf `main` veröffentlicht das Spiel dann automatisch. Die URL erscheint im jeweiligen Actions-Lauf.

## Technik

Reines HTML, Canvas und JavaScript – ohne Build-Schritt und ohne Abhängigkeiten. Grafik und Sound werden im Code erzeugt. Level entstehen über einen seed-basierten Generator und werden von einem Solver geprüft, der außerdem die minimale Zahl an Zügen ermittelt.

Schrift: Pixelify Sans (SIL Open Font License, siehe `fonts/OFL.txt`).
