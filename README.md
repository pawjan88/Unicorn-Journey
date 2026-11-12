# Unicorn Journey

[Zagraj w przeglądarce](https://pawjan88.github.io/Unicorn-Journey/)

Dwa epizody: magiczny las i świat dinozaurów. Gra na komputer z klawiaturą; wymaga przeglądarki z WebGL.

## Uruchomienie lokalne

```sh
python3 -m http.server 8080 --directory dist
```

Otwórz `http://localhost:8080`. Pliki gry są w `dist/`, a kod, ilustracje i dźwięki nie wymagają budowania ani instalowania zależności.

## Publikacja na GitHub Pages

Każda zmiana na gałęzi `main` uruchamia testy i publikuje zawartość `dist/` przez GitHub Actions. Workflow można również uruchomić ręcznie. Ustawienia Pages korzystają ze źródła **GitHub Actions**.

Krótka gra na PC, uruchamiana w przeglądarce. Przytrzymaj ↑, skręcaj ← / →, skacz spacją. Ctrl uruchamia tęczowy strzał z roga (oba klawisze Ctrl; można przytrzymać). Esc wstrzymuje grę. Na trasie jest 50 tęcz; wszystkie są opcjonalne. Trolle i smoki na chwilę zatrzymują jazdę. Płotki wymagają skoku, a przed przebiegającym stadem trzeba poczekać.

## Epizod 2 — Świat dinozaurów

Z menu startowego można wybrać epizod 1 lub 2 za pomocą obrazkowych kart w stylu kart koników. Układ gry, styl ilustracji, trzy jednorożce, skok, tęczowy strzał oraz 50 przedmiotów do zebrania są zachowane. Ukończenie pierwszej planszy natychmiast uruchamia epizod dinozaurów, bez ekranu wyników i bez dodatkowego kliknięcia. Wybrany konik i przytrzymane klawisze są zachowane, a konfetti towarzyszy przejściu. Końcowy ekran gratulacji pojawia się po ukończeniu drugiego epizodu.

Druga plansza przedstawia dżunglę z dużym wulkanem, paprociami i palmami. Między roślinami widać sylwetki dinozaurów, a w pobliżu ścieżki latają ważki. Zbiera się 50 bursztynów i 5 dodatkowych bursztynów podczas zachowanego tęczowego przelotu.

Płotki zastępują naprzemiennie rzeczki lawy i powalone drzewa. Przecinające drogę stada to małe ryczące dinozaury, a latające grupy to pterodaktyle z własnym dźwiękiem. Triceratopsy zastępują zwykłe trolle, diplodoki smoki, zaś przed jaskinią stoi tyranozaur rzucający kamieniami. Wymaga trzech trafień Ctrl. Meta znajduje się kilka metrów za wejściem do jaskini w wulkanie, więc gracz wjeżdża do jej wnętrza.

Tło dźwiękowe drugiego epizodu jest miksem przesłanych `owady.mp3` i `jungla.mp3` (`dino-ambient.mp3`). W czasie walki odtwarzane jest przesłane `grzmoty.mp3`. Po walce wraca dżungla. Trzy pliki źródłowe zachowano bez zmiany zawartości. Odgłosy konia pozostają takie jak dostarczone wcześniej. Ryk małych dinozaurów i głosy pterodaktyli to lokalne efekty syntetyczne; nie odtwarzają hihotu wiedźm.

Automatyczne przejście następuje po zakończeniu kroku symulacji, w tej samej klatce, przed rysowaniem. Zapobiega to ujemnemu licznikowi czasu przy resecie i wielokrotnemu uruchomieniu planszy. Test `campaign-ui.test.mjs` wykonuje rzeczywisty kod kontrolera z atrapami DOM, renderera i audio, sprawdzając wybór obrazków, ciągłość sterowania, przejście bez klikania i końcowe gratulacje.

Konfiguracja epizodów znajduje się w `dist/episodes.js`. Symulacja w `rules.js` zachowuje wspólne role mechaniczne obiektów, natomiast gatunki, grafika, opis i oprawa dźwiękowa są przypisane do epizodu. Przy zmianie planszy poprzednia scena zwalnia geometrię, materiały, tekstury, postprocessing i obserwator rozmiaru. Testy obejmują pełne przejazdy obu plansz, zmianę epizodu, powrót, trwałość wyboru konika, 50 bursztynów i zachowanie źródłowych plików audio.

## Wersja 7

Przy skoku jednorożec obraca głowę ku jeźdźcowi. Osobna warstwa szyi i grzywy pozostaje na miejscu, a głowa przechodzi przez trzy pozy: od tyłu, półobrót i spojrzenie z widocznym pyskiem oraz okiem. W środkowej części skoku spojrzenie zatrzymuje się na jeźdźcu, a przy lądowaniu wraca do przodu. Ruch jest uzależniony od zegara skoku, więc pauza zatrzymuje pozę. Każdy z trzech koników zachowuje wybrane kolory maści i roga we wszystkich pozach; magiczny promień nadal wychodzi z aktualnej końcówki roga.

Podczas przelotów czarownic odtwarzany jest warstwowy, upiorny hihot z pogłosem. Jest to lokalny, syntetyczny efekt `witch-cackle.mp3`. Działa jedna pętla, która milknie po przelocie, przy pauzie, wyciszeniu lub ponownym uruchomieniu. Po wznowieniu dźwięk kontynuuje od pozycji zgodnej z zegarem przelotu. Zwykłe stada jednorożców nie odtwarzają hihotu.

Wszystkie trolle mają metalowe zbroje, hełmy i tarcze. Cztery zwykłe trolle noszą miecze, cztery topory. Duży troll przed metą nosi ozdobny hełm, zbroję, topór i tarczę; nadal toczy kamienie i wymaga trzech trafień. Zasady walki oraz dostarczone przez użytkownika nagrania konia pozostają takie same.

## Wersja 6

Na starcie wybiera się jeden z trzech wariantów jednorożca: Słoneczko (kremowy, miedziane kopyta, złoty róg), Nocna Iskierka (niebieski, turkusowe kopyta i róg) albo Różana Chmurka (różowy, fioletowe kopyta i różowy róg). Grafika karty i widok z siodła korzystają z tej samej palety. Wybrany wariant zostaje przy ponownej grze; na mecie można wrócić do wyboru.

Oprócz czterech stad jednorożców są trzy grupy po pięć czarownic na miotłach, które lecą zygzakiem i przecinają tor. Działają jako przyjazny ruch poprzeczny, na który trzeba poczekać. Zegar przekraczania drogi zatrzymuje się podczas pauzy.

W pięciu miejscach dodano po dwa płotki oddalone o 5,2 m. Jeden skok trwa 1,1 s i nie wystarczy na oba płotki; drugi skok można wykonać zaraz po lądowaniu. Cała trasa ma 13 płotków, w tym pięć par.

Na 194. metrze pole „Galop po Tęczy” uruchamia osiem sekund automatycznej, bezpiecznej jazdy po podniebnej tęczowej drodze. Przelot wznosi gracza do 15 m nad ziemią, pokazuje wzgórza z zamkiem i przyznaje pięć małych tęcz. Bonus liczy się osobno od 50 tęcz na głównej trasie. Prędkość i odległość powrotu są zsynchronizowane z drogą; pauza zatrzymuje bonus. Podczas przelotu nie ma kolizji z przeciwnikami, a dźwięk kroków jest wyłączony.

Przed metą stoi większy troll z trzema punktami wytrzymałości. Budzi się na 373. metrze, toczy kamienie w stronę gracza i blokuje wyjazd, dopóki nie otrzyma trzech trafień Ctrl. Kamienie omija się strzałkami; trafienie kamieniem powoduje krótkie, odwracalne zatrzymanie i odsunięcie. Wystrzelone wcześniej kamienie toczą się także po pokonaniu trolla. Nie ma utraty żyć.

## Wersja 5

Nagranie `step_konia_3s.mp3` jest zapętlane podczas jazdy po ziemi. Działa tylko jedna pętla, bez nakładania kolejnych trzysekundowych nagrań. Kopyta milkną natychmiast po puszczeniu strzałki, przy płotku lub stadzie, podczas skoku, po włączeniu pauzy i po wyciszeniu. Plik `rzenie_konia_3s.mp3` odtwarza się przy skoku. Kolejny skok rozpoczyna nowe rżenie bez nakładania głosów. Oba dostarczone pliki MP3 zachowano bez zmian.

## Wersja 4

Spokojna autorska muzyka instrumentalna, odgłosy kopyt podczas jazdy po ziemi, rżenie przy skoku, magiczny świst pocisku i wystrzał konfetti na mecie. Muzyka i efekty ruszają dopiero po kliknięciu Start, z powodu reguł automatycznego odtwarzania w przeglądarkach. Jeden przycisk wycisza całą oprawę. Pauza i utrata fokusu zatrzymują dźwięki; wznowienie zachowuje pozycję muzyki. Dźwięki kopyt ustają w powietrzu i przy przeszkodach. Pliki MP3 znajdują się lokalnie w `dist/audio/`; nie ma zależności od zewnętrznych serwisów audio. Efekty są syntezowane.

Płotki stoją na całą szerokość drogi i nie znikają po próbie przejazdu. Nie ma komunikatu po zatrzymaniu. Można przeskoczyć płotek także po zatrzymaniu tuż przed nim.

Cztery stada po sześć jednorożców przekraczają tor na 92., 183., 273. i 361. metrze. Przed stadem ruch do przodu jest blokowany; nie da się go ominąć skokiem ani strzałem. Stado kończy przebieg również wtedy, gdy gracz puści strzałkę, a pauza zatrzymuje jego zegar. Sama jazda nadal zajmuje 99 sekund; czas oczekiwania wydłuża całą przygodę.

Ilustracje i tęcze mają bardziej nasycone kolory. Na mecie z dwóch stron wystrzeliwuje konfetti z błyszczącymi złotymi drobinkami. Warstwa konfetti jest rysowana nad ekranem gratulacji, nie blokuje przycisków i czyści się przy ponownej grze.

## Wersja 3

Ilustracyjna oprawa inspirowana dostarczonym obrazkiem: krem, morelowy pomarańcz, zgaszony turkus i granatowe cienie. Lokalne ilustracje SVG drzew, trolla, smoka i jednorożca zastępują modele tych postaci. Scena zachowuje perspektywę pierwszej osoby oraz bufor Full HD. Niebieskie cienie i delikatna faktura papieru uzupełniają styl.

Trasa ma 396 m zamiast 495 m, przy tej samej prędkości 4 m/s. Czysty przejazd trwa 99 s zamiast 123,75 s (20% krócej). Wszystkie 50 tęcz mieszczą się przed metą. Przy każdym z 8 trolli stoi smok.

Ctrl tworzy sześciokolorowy promień z roga i usuwa najbliższego trolla lub smoka w kierunku jazdy, z łagodną pomocą w celowaniu. Zasięg 20 m, odstęp między strzałami 0,45 s, bez limitu amunicji. Płotki i tęcze są odporne. Postacie znikają w tęczowych iskierkach. Pauza blokuje strzelanie; restart odtwarza wszystkie postacie i usuwa efekty.

## Wersja 2

Widok pierwszoosobowy z siodła jednorożca, węższa ścieżka i szybsza jazda. Scena 3D obejmuje cienie, poświatę, promienie słońca, świetliki, tęczową grzywę oraz złoty róg. Przycisk pełnego ekranu pozwala wykorzystać cały monitor. Na typowym ekranie PC bufor ma 1920×1080; wielkość dostosowuje się do okna i gęstości pikseli, z limitem szerokości 2560 px i DPR 2.

## Pliki

- `dist/characters.js`: palety i pliki graficzne trzech koników.
- `dist/animation.js`: płynna animacja spojrzenia podczas skoku.
- `dist/rules.js`: stan gry, parametry trasy, kolizje, skok, czarownice, tęczowy galop i walka przy mecie. Dystanse w metrach.
- `dist/forest.js`: lokalna scena Three.js, kamera i efekty. Drobna roślinność korzysta z instancji geometrii; las jest ponownie wykorzystywany podczas jazdy.
- `dist/game.js`: klawiatura, stały krok symulacji 120 Hz i interfejs.
- `dist/audio.js`, `dist/audio/`: oprawa muzyczna i efekty Web Audio.
- `dist/celebration.js`: konfetti i złoty brokat na mecie.
- `dist/index.html`, `dist/style.css`: interfejs i pełny ekran.
- `dist/vendor/`: Three.js 0.160.0 i efekty postprocessing, licencja MIT w `LICENSE-three.txt`. Importy dodatków zmieniono na lokalne ścieżki. Gra nie pobiera silnika z CDN.

Ilustracje znajdują się w `dist/assets/` i są ładowane z tej samej witryny przed udostępnieniem przycisku startu.

Brak procesu budowania. GitHub Pages publikuje katalog `dist/` przez workflow `.github/workflows/pages.yml`. Dźwięk jest domyślnie włączony po kliknięciu Start; można go wyciszyć. Czcionki Google Fonts mają lokalne czcionki zastępcze.

## Sprawdzenie

`npm test` sprawdza sterowanie, granice drogi, 50 tęcz, skok, płotki, trolle, pauzę, metę bez tęcz oraz restart i niezależność prędkości od FPS, czas przejazdu, smoki, strzelanie, zasięg i odporność płotków/tęcz. Testy obejmują także spójność kolorów koników, pięć sekwencji dwóch skoków, trzy grupy czarownic, bezpieczny tęczowy bonus z pięcioma punktami i powrotem oraz trzy trafienia w dużego trolla, unikanie kamieni i odtwarzanie stanu po restarcie. Testy obejmują również solidne płotki, przebiegające stada, przerwy w muzyce, odgłosy kopyt i konfetti. Zmiany sceny wymagają dodatkowo sprawdzenia na PC z WebGL, szczególnie płynności, wyglądu i pełnego ekranu.
