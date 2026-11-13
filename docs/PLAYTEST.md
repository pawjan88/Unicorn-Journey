# Unicorn Journey — trzy epizody low-poly 3D: raport testów

Wersja z trzema epizodami przeszła testy i została zatwierdzona przez właściciela do publikacji na GitHubie. Gra: https://pawjan88.github.io/Unicorn-Journey/.

## Zakres

- Trzy obrazkowe karty epizodów i trzy koniki. Wybór maści, kopyt i roga zachowuje się w kolejnych światach.
- Kampania przechodzi bez dodatkowego kliknięcia z lasu do dinozaurów, następnie po wjeździe do wulkanu do jaskiń. Wynik i ponowny start pojawiają się po trzecim epizodzie.
- Jaskinie mają lawowe tunele, grotę grzybów i kryształów, podziemne jezioro, komnatę Serca i wyjazd na słoneczną polanę. Sklepienie pozostaje ponad całą tęczą i wielkim żółwiem. Sceneria jest grupowana w instancje.
- Zbieramy 50 opcjonalnych kryształów. Szczeliny i przewrócone kolumny wymagają skoku; zachowano pięć podwójnych przeszkód.
- Golemy i kryształowe kraby wymagają jednego trafienia. Przyjazne jaszczurki, nietoperze i żółw przecinają drogę; para wymaga oczekiwania. Tych przeszkód nie usuwa magia ani skok.
- Tęczowy most nad jeziorem daje pięć bonusowych kryształków. Po zjeździe do pierwszej pary przeciwników pozostaje 16 m, czyli około czterech sekund jazdy, we wszystkich epizodach.
- Obsydianowy Strażnik toczy kamienie i wymaga trzech trafień. Zapalają się kryształy pancerza i trzy części Serca; po wygranej posąg odsuwa się na bok, a jaskinia rozjaśnia się przy wyjeździe. Na końcu wybucha konfetti.
- Zachowano sterowanie strzałkami, spacją i Ctrl, głowę w siodle mniejszą o 20%, brak napisów na trasie, brak cienia promienia i bezpieczny zjazd z tęczy.

## Dźwięk

Dołączono siedem lokalnych plików jaskiniowych: wodę i powietrze, kamienie, parę, nietoperze i skrzydła, małe gady, oddech żółwia oraz nagrany kryształowy dzwonek. Źródła CC0, autorzy, obróbka i charakter każdego pliku opisano w `dist/audio/CAVE-SOURCES.md`. Pomruk żółwia jest gotowym naturalistycznym foley AI, nie nagraniem terenowym żółwia. Pozostałe efekty bazują na nagraniach i foley.

Dostarczone MP3 konia, owadów, dżungli i grzmotów pozostają bez zmian. W jaskiniach kopyta i rżenie mają krótki pogłos; magia brzmi jak delikatny strumień powietrza. Działają pauza, wyciszenie i osobne suwaki. Mikser ładuje 20 buforów, ogranicza nakładanie efektów, a nieobecny plik dźwiękowy nie blokuje gry.

## Weryfikacja

- `npm test`: 15 zestawów, 0 niepowodzeń; testy reguł, pełne przejazdy trzech epizodów, wybory i przejścia, audio, animacja, konstrukcja modeli, sklepienie i jezioro, Serce oraz odstęp po tęczy.
- `npm run test:browser`: 31 scenariuszy, 41 zrzutów, 0 błędów JavaScript i nieudanych żądań zasobów.
- `npm run test:cave`: 15 scenariuszy, 20 zrzutów, 0 błędów; osobny przebieg trzeciego epizodu i końcowych ujęć, z ponownym sprawdzeniem interfejsu, pauzy, pełnego ekranu, kontekstu WebGL i ograniczonego ruchu.
- `npm run test:landing`: osobny scenariusz zjazdu, spokojnego odcinka i trafiania przeciwnika w każdym z trzech światów.

Scenariusze przeglądarkowe używają rzeczywistych klawiszy i Web Audio. Lokalne punkty kontrolne przyspieszają dotarcie do przeszkód, bonusu, spotkań i bossów. Pełne przejazdy sprawdzają dodatkowo testy symulacji. Narzędzia QA działają tylko na localhost z parametrem `?qa=1`.

Zrzuty oceniano wizualnie pod kątem widoczności drogi, postaci, sklepienia, zjazdu i Serca. Przy pełnym ekranie test czeka na dwie klatki po zmianie rozmiaru płótna, aby ocenić wyrenderowaną scenę. Menu jest sprawdzane w rozmiarach 1440 × 960 i 390 × 844.

Raporty i obrazy: `artifacts/playtest/`, `artifacts/cave-playtest/`, `artifacts/landing-playtest/` (artefakty poza Git). Chromium z programowym WebGL; wyniki nie stanowią benchmarku fizycznego komputera ani weryfikacji wszystkich silników przeglądarek.
