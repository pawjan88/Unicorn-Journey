# Unicorn Journey

Gra przeglądarkowa na komputer z klawiaturą. Wersja **low-poly 3D** przedstawia cztery połączone epizody: magiczny las, świat dinozaurów, kryształowe jaskinie i krainę lodu. Modele koników, przeciwników i roślin są przestrzenną geometrią Three.js z płaskim cieniowaniem. Głowa w widoku z siodła jest zmniejszona o 20%, a podczas jazdy nie ma komunikatów tekstowych. Kamera w Galopie po Tęczy podąża za nachyleniem drogi i pokazuje zjazd bez przenikania pod powierzchnię. Menu i HUD korzystają z lokalnej czcionki Fredoka oraz zdjęć tych samych modeli, które występują w grze.

**[Zagraj w przeglądarce](https://pawjan88.github.io/Unicorn-Journey/)** · [Repozytorium GitHub](https://github.com/pawjan88/Unicorn-Journey)

Czwarty epizod i lodowy jednorożec są dostępne w [prywatnym podglądzie testowym](https://unicorn-journey-pixel-preview.paw-jan-88.chatgpt.site). Publiczna wersja GitHub Pages zachowuje ostatnie zatwierdzone trzy epizody. Publikacja nowych zmian na GitHubie wymaga akceptacji właściciela.

## Sterowanie

- Przytrzymaj **↑**, aby jechać; **← / →** sterują na boki.
- **Spacja**: skok. W powietrzu konik odwraca przestrzenną głowę ku jeźdźcowi; widać oko i pysk.
- **Ctrl**: tęczowa magia z aktualnego końca roga. Można przytrzymać.
- **Esc**: pauza. Menu pauzy ma suwaki głośności muzyki i efektów oraz powrót do wyboru przygody.

## Przygoda

Na starcie wybiera się jeden z czterech koników o innych kolorach maści, kopyt i roga. Lodowa Iskierka ma półprzezroczystą jasnoniebieską, kryształową maść, lodową grzywę, niebieskie kopyta i cyjanowy róg. Można wybrać dowolny epizod. Ukończenie lasu automatycznie przenosi do świata dinozaurów, wjazd do wulkanu rozpoczyna kryształowe jaskinie, a ich ukończenie przenosi do Krainy Lodu. Konik i przytrzymane sterowanie są zachowane przy każdym przejściu.

**Tęczowy Las:** 50 opcjonalnych tęcz, płotki (w tym pięć par wymagających dwóch skoków), stada jednorożców, latające czarownice, zbrojne trolle z mieczami lub toporami i tarczami, smoki oraz duży troll toczący kamienie. Boss wymaga trzech trafień.

**Świat dinozaurów:** 50 bursztynów, lawowe rzeczki i pnie do przeskoczenia, stada małych stegozaurów z płytami i kolcami oraz pterodaktyle z błoniastymi skrzydłami przecinające drogę, triceratopsy, diplodoki, dinozaury między palmami i ważki. Pod wulkanem stoi tyranozaur, który wymaga trzech trafień. Przed finałem jeden ogromny giganotozaur przechodzi przez drogę, zatrzymuje się na jej środku, odwraca głowę do gracza i ryczy z otwartą paszczą. Trzeba poczekać, aż odejdzie; krokom towarzyszą drżenie kamery i ciężkie odgłosy. Epizod kończy się wjechaniem do przestrzennej jaskini.

**Kryształowe Jaskinie:** 50 opcjonalnych kryształów, szczeliny i przewrócone kamienne kolumny do przeskoczenia, para wymagająca oczekiwania, przyjazne jaszczurki i nietoperze. Golemy i kryształowe kraby znikają po jednym trafieniu. Szlak prowadzi od lawowych tuneli przez grotę świecących grzybów do podziemnego jeziora. Tęczowy most przebiega ponad wodą i daje pięć dodatkowych kryształków. Ogromny żółw z grzybami i kryształami na skorupie przecina drogę i pozdrawia gracza. Obsydianowy Strażnik toczy kamienie; trzy trafienia zapalają Kryształowe Serce, odsuwają strażnika jako posąg i otwierają wyjazd na słoneczną polanę.

**Kraina Lodu:** 50 opcjonalnych złotych śnieżynek, szczeliny w lodzie i ośnieżone drzewa (także pięć par do dwóch skoków), śnieżne chochliki i lodowe smoki. Drogę przecinają renifery, białe sowy i jeden ogromny mamut, który zatrzymuje się, spogląda na gracza i wydaje łagodny odgłos. Tęczowy bonus prowadzi ponad zamarzniętym jeziorem pod zorzą. Król Mrozu przed Lodowym Zamkiem toczy śnieżne kule i wymaga trzech trafień. Każde zapala kryształ korony. Trzecie uwalnia Elzę i Annę: lodowe więzienia pękają, brama się otwiera, zorza nabiera kolorów, a obie postacie przechodzą na dziedziniec i machają do jednorożca. Konfetti świętuje wjazd do zamku.

Lasy w obu światach sięgają szeroko poza pobocza i ponad 600 metrów w głąb sceny. Rośliny i podłoże mają delikatne tekstury. Zakręcające rzeki lawy przepływają przez dżunglę po obu stronach drogi; powierzchnia oraz jasne smugi płyną w czasie gry. Tęczowy promień nie rzuca cienia. Opcja ograniczonego ruchu w przeglądarce wyłącza drżenie kamery.

W każdym epizodzie tęczowy bonus trwa osiem sekund i daje pięć dodatkowych skarbów. W pierwszych dwóch widać wzgórza z zamkiem, w jaskiniach podziemne jezioro, a w Krainie Lodu zamarznięte jezioro oraz zorzę. Nie ma utraty żyć ani wymogu zebrania wszystkich przedmiotów. Na mecie wybucha konfetti. Po zjeździe z tęczy pierwsza para przeciwników czeka 16 metrów dalej, co daje około czterech sekund jazdy na reakcję w każdym epizodzie.

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
npm run test:landing
npm run test:cave
npm run test:winter
```

`CHROMIUM_PATH` pozwala użyć zainstalowanego Chromium. Testy przeglądarkowe zapisują raport i zrzuty w `artifacts/playtest/`. Używają rzeczywistych klawiszy oraz Web Audio, a lokalne punkty kontrolne przyspieszają sprawdzenie przeszkód, lotu, bossów i mety. Pełne przejazdy wszystkich epizodów sprawdzają osobne testy reguł. Narzędzia QA działają wyłącznie na `localhost` / `127.0.0.1` z parametrem `?qa=1`.

Karty wyboru można odtworzyć z modeli:

```sh
node scripts/render-previews.cjs
node scripts/render-cave-preview.cjs
node scripts/render-winter-preview.cjs
node scripts/render-ice-horse-preview.cjs
```

## Kod i zasoby

- `dist/rules.js`: niezależna symulacja 120 Hz, kolizje i przebieg przygody.
- `dist/low-poly-models.js`: geometria postaci i środowiska, wspólne materiały oraz renderowanie kart menu.
- `dist/cave-models.js`, `dist/cave-world.js`: mieszkańcy, sklepienie, komnaty, jezioro, para i Kryształowe Serce trzeciego epizodu.
- `dist/winter-models.js`, `dist/winter-world.js`: śnieżny las, jezioro, zorza, zamek, mamut, lodowe więzienia i animacja uwolnienia Elzy oraz Anny.
- `dist/ice-horse.js`: kryształowe materiały i detale czwartego jednorożca w pełnym modelu i widoku z siodła.
- `dist/forest.js`: scena, kamera z siodła, światło, cienie, animacje, pule obiektów i efekty magii.
- `dist/game.js`: klawiatura, interfejs, pauza, wybór konika i przejście między epizodami.
- `dist/giant-encounter.js`: fazy przejścia, zatrzymania i ryku giganotozaura.
- `dist/environment-profile.js`: wspólny profil terenu i koryt lawy.
- `dist/ride-camera.js`: pozycja i orientacja kamery nad podjazdem, szczytem oraz zjazdem tęczy.
- `dist/audio.js`, `dist/audio/`: mikser oraz nagrania. Dostarczone MP3 zachowano bez zmian. Jaskinia używa naturalnych nagrań i realistycznego foley CC0: kapania wody, kamieni, pary, skrzydeł, zwierząt i kryształowego dzwonka. Kopyta oraz rżenie dostają delikatny pogłos. Dokładne źródła i oznaczenie gotowego foley AI dla żółwia są w [`CAVE-SOURCES.md`](dist/audio/CAVE-SOURCES.md). Kraina Lodu używa nagrań i foley CC0: zimowego wiatru, śniegu, lodu, sów, skrzydeł i oddechu słonia jako odgłosu mamuta. Śnieżny szelest jest dodatkową warstwą pod dostarczonym nagraniem kopyt i zatrzymuje się przy postoju, skoku, pauzie oraz wyciszeniu. Źródła: [`WINTER-SOURCES.md`](dist/audio/WINTER-SOURCES.md).
- `dist/characters.js`, `dist/episodes.js`: palety i konfiguracja epizodów.
- `dist/fonts/`: Fredoka i licencja OFL; `dist/vendor/`: Three.js i licencja MIT.

Otoczenie jest grupowane w `InstancedMesh`, geometria jest współdzielona, cienie mają ograniczony obszar, a rozdzielczość adaptuje się do wolniejszego renderowania. Zamiana epizodu zwalnia zasoby poprzedniej sceny. Utrata kontekstu WebGL wstrzymuje grę; po przywróceniu można kontynuować.

GitHub Actions uruchamia testy i publikuje `dist/` w GitHub Pages po zmianie na `main`. Bieżące prace pozostają lokalnie na gałęzi `refresh/ice-kingdom` oraz w prywatnym podglądzie do akceptacji.
