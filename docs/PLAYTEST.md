# Unicorn Journey — Kraina Lodu i kryształowy jednorożec

Czwarty epizod oraz Lodowa Iskierka przeszły testy automatyczne i prywatne testy właściciela. Po pozytywnym wyniku właściciel zatwierdził aktualizację publicznego repozytorium i GitHub Pages do wersji z czterema epizodami.

## Zakres

- Cztery obrazkowe karty epizodów i cztery koniki. Lodowa Iskierka jest grywalna we wszystkich światach: ma jasnoniebieski, półprzezroczysty kryształowy korpus, lodową grzywę, niebieskie kopyta i cyjanowy róg.
- Oryginalne trzy palety i materiały zachowano. Róg, kopyta i maść nowego konika pasują do portretu; obrót głowy podczas skoku i punkt wyjścia tęczowego strzału pozostają na modelu. Głowa w siodle zachowuje skalę 0,8.
- Kampania przechodzi bez dodatkowego kliknięcia: las → dinozaury → jaskinie → Kraina Lodu. Wybrany konik i przytrzymane sterowanie przechodzą do kolejnych epizodów. Każdy świat można uruchomić bezpośrednio z menu.
- Zimowy świat obejmuje gęsty śnieżny las, zamarznięte jezioro z zorzą, przełęcz, Lodowy Zamek i dziedziniec. Scenerię grupują instancje; śnieg i zorza używają zegara gry.
- Zbieramy 50 opcjonalnych złotych śnieżynek. Szczeliny w lodzie i ośnieżone pnie wymagają skoku; zachowano pięć par podwójnych przeszkód.
- Chochliki i lodowe smoki wymagają jednego trafienia. Renifery, sowy i jeden wielki mamut przecinają drogę i wymagają oczekiwania. Mamut zatrzymuje się, spogląda na jeźdźca i wydaje łagodny odgłos.
- Tęczowy bonus trwa osiem sekund nad zamarzniętym jeziorem i daje pięć dodatkowych śnieżynek. Po lądowaniu do przeciwników pozostaje 16 m, czyli około czterech sekund jazdy.
- Król Mrozu toczy śnieżne kule. Pierwsze dwa trafienia zapalają kryształy korony, pozostawiając Elzę i Annę w lodowych więzieniach. Dopiero trzecie trafienie uwalnia obie postacie i otwiera bramę.
- Lód pęka i zanika, siostry przechodzą na dziedziniec, obracają się do jeźdźca i machają. Zorza odzyskuje kolory. Wjazd do zamku kończy grę konfetti i wynikiem. Ponowny start odtwarza więzienia, bossa, mamuta i stan uwolnienia.
- Zachowano strzałki, spację i Ctrl, precyzyjne zatrzymywanie po puszczeniu ↑, brak napisów podczas jazdy, brak cienia promienia i bezpieczny zjazd z tęczy.

## Dźwięk

Dołączono sześć lokalnych zimowych plików CC0: zimowy wiatr, śnieg, pękający lód, sowy i skrzydła, stado oraz oddech/parsknięcie słonia jako foley mamuta. Dokładne źródła, autorzy i zamienniki gatunkowe są w `dist/audio/WINTER-SOURCES.md`. Dźwięki zimowe nie używają syntezy ani AI.

Dostarczone MP3 pozostają bez zmian. W zimie pod nagraniem kopyt gra cichy śnieżny szelest. Obie warstwy zatrzymują się podczas postoju, skoku, pauzy i wyciszenia, bez powielania pętli. Mikser obsługuje 26 buforów, osobne suwaki, ogranicznik i łagodne wyciszenie tła przy efektach. Brak pojedynczego pliku audio nie blokuje gry.

## Weryfikacja

- `npm test`: 19 zestawów, 0 niepowodzeń. Reguły i pełne przejazdy wszystkich epizodów, jednorazowe uwolnienie dokładnie po trzech trafieniach, wybory/przejścia, audio, modele, materiały i kamera tęczy.
- `npm run test:winter`: 15 scenariuszy, 23 zrzuty, 0 błędów JavaScript i brakujących zasobów. Obejmuje zimowe przeszkody, strzelanie, śnieżne kroki, zwierzęta, bonus, mamuta, więzienia, uwolnienie, pauzę, bramę, dziedziniec, konfetti, ponowny start i układ menu.
- `npm run test:browser`: 39 scenariuszy, 57 zrzutów, 0 błędów JavaScript i brakujących zasobów; pełny przebieg kampanii i kontroli interfejsu. Raport: `artifacts/playtest/report.json`.
- `npm run test:landing`: zjazd, spokojny odcinek i strzał w każdym z czterech epizodów.

Testy przeglądarkowe używają rzeczywistych klawiszy i Web Audio. Lokalne punkty kontrolne przyspieszają dotarcie do przeszkód i finałów; pełne przejazdy sprawdzają też niezależne testy symulacji. Narzędzia QA są dostępne wyłącznie na localhost z `?qa=1`.

Zrzuty sprawdzono wizualnie: przezroczystość i obrót głowy Lodowej Iskierki, postacie w więzieniach, otwarta brama, powitanie sióstr oraz droga pod zorzą. Menu sprawdzane jest przy 1440 × 960 i 390 × 844. Pełny ekran czeka na wyrenderowanie po zmianie rozmiaru płótna. Sprawdzane są również utrata kontekstu WebGL i ograniczony ruch.

Artefakty: `artifacts/playtest/` i `artifacts/winter-playtest/` (poza Git). Chromium z programowym WebGL; wyniki nie są benchmarkiem fizycznego komputera ani testem wszystkich silników przeglądarek.
