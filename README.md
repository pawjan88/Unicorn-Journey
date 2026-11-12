# Unicorn Journey

Gra przeglądarkowa na komputer z klawiaturą. Wersja **low-poly 3D** przedstawia dwa połączone epizody: magiczny las i świat dinozaurów. Modele koników, przeciwników i roślin są przestrzenną geometrią Three.js z płaskim cieniowaniem. Menu i HUD korzystają z lokalnej czcionki Fredoka oraz zdjęć tych samych modeli, które występują w grze.

Nowa szata jest udostępniana do testów w [prywatnym podglądzie](https://unicorn-journey-pixel-preview.paw-jan-88.chatgpt.site). Publikacja nowej wersji na GitHubie wymaga osobnej zgody właściciela. Publiczna wersja produkcyjna: [GitHub Pages](https://pawjan88.github.io/Unicorn-Journey/).

## Sterowanie

- Przytrzymaj **↑**, aby jechać; **← / →** sterują na boki.
- **Spacja**: skok. W powietrzu konik odwraca przestrzenną głowę ku jeźdźcowi; widać oko i pysk.
- **Ctrl**: tęczowa magia z aktualnego końca roga. Można przytrzymać.
- **Esc**: pauza. Menu pauzy ma suwaki głośności muzyki i efektów oraz powrót do wyboru przygody.

## Przygoda

Na starcie wybiera się jeden z trzech koników o innych kolorach maści, kopyt i roga. Można wybrać dowolny epizod. Ukończenie lasu automatycznie przenosi do świata dinozaurów, zachowując konika i przytrzymane sterowanie.

**Tęczowy Las:** 50 opcjonalnych tęcz, płotki (w tym pięć par wymagających dwóch skoków), stada jednorożców, latające czarownice, zbrojne trolle z mieczami lub toporami i tarczami, smoki oraz duży troll toczący kamienie. Boss wymaga trzech trafień.

**Świat dinozaurów:** 50 bursztynów, lawowe rzeczki i pnie do przeskoczenia, małe dinozaury i pterodaktyle przecinające drogę, triceratopsy, diplodoki, dinozaury między palmami i ważki. Pod wulkanem stoi tyranozaur, który wymaga trzech trafień. Epizod kończy się wjechaniem do przestrzennej jaskini.

W obu epizodach zachowano osiem sekund Galopu po Tęczy ponad lasem, pięć dodatkowych skarbów oraz wzgórza z zamkiem. Nie ma utraty żyć ani wymogu zebrania wszystkich przedmiotów. Na mecie wybucha konfetti.

## Uruchomienie

Gra nie wymaga budowania ani zależności serwerowych:

```sh
python3 -m http.server 8080 --directory dist
```

Otwórz `http://localhost:8080`. Potrzebna jest aktualna przeglądarka z WebGL. Wszystkie modele powstają lokalnie z geometrii; czcionka, obrazki menu, Three.js i dźwięki są dołączone. Dźwięk uruchamia się dopiero po kliknięciu Start.

## Testy

```sh
npm test
npm ci
npx playwright install chromium
npm run test:browser
```

`CHROMIUM_PATH` pozwala użyć zainstalowanego Chromium. Testy przeglądarkowe zapisują raport i zrzuty w `artifacts/playtest/`. Używają rzeczywistych klawiszy oraz Web Audio, a lokalne punkty kontrolne przyspieszają sprawdzenie przeszkód, lotu, bossów i mety. Pełne przejazdy obu epizodów sprawdzają osobne testy reguł. Narzędzia QA działają wyłącznie na `localhost` / `127.0.0.1` z parametrem `?qa=1`.

Karty wyboru można odtworzyć z modeli:

```sh
node scripts/render-previews.cjs
```

## Kod i zasoby

- `dist/rules.js`: niezależna symulacja 120 Hz, kolizje i przebieg przygody.
- `dist/low-poly-models.js`: geometria postaci i środowiska, wspólne materiały oraz renderowanie kart menu.
- `dist/forest.js`: scena, kamera z siodła, światło, cienie, animacje, pule obiektów i efekty magii.
- `dist/game.js`: klawiatura, interfejs, pauza, wybór konika i przejście między epizodami.
- `dist/audio.js`, `dist/audio/`: mikser oraz nagrania. Dostarczone MP3 zachowano bez zmian.
- `dist/characters.js`, `dist/episodes.js`: palety i konfiguracja epizodów.
- `dist/fonts/`: Fredoka i licencja OFL; `dist/vendor/`: Three.js i licencja MIT.

Otoczenie jest grupowane w `InstancedMesh`, geometria jest współdzielona, cienie mają ograniczony obszar, a rozdzielczość adaptuje się do wolniejszego renderowania. Zamiana epizodu zwalnia zasoby poprzedniej sceny. Utrata kontekstu WebGL wstrzymuje grę; po przywróceniu można kontynuować.

GitHub Actions publikuje `dist/` po zmianie na `main`; obecne prace pozostają na lokalnej gałęzi `refresh/low-poly-3d` do akceptacji.
