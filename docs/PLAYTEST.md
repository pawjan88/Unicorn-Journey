# Unicorn Journey — low-poly 3D: raport testów

Status: gotowa wersja do testów właściciela, bez publikacji zmian na GitHubie.

## Aktualne rozszerzenie świata

- Dodano ponad 1300 drzew w głębi każdego świata, do 100 metrów na boki i ponad 600 metrów w głąb. Tło jest grupowane w mniej niż 15 dodatkowych partii instancji. Zagęszczono także drzewa i roślinność na bliższych planach. Korony, liście i podłoże mają proceduralne tekstury zachowujące styl low-poly.
- Wszystkie elementy tęczowego promienia mają wyłączone rzucanie i odbieranie cienia; cienie otoczenia pozostają.
- Pterodaktyle mają długie dzioby, kostny grzebień, łapy z pazurami i błoniaste skrzydła rozpięte na długich palcach. Stada małych dinozaurów zastąpiono małymi stegozaurami z dziewięcioma płytami w dwóch rzędach i czterema kolcami ogonowymi.
- Rzeki lawy mają 180 metrów szerokości świata, płyną przez dżunglę poza drogą, meandrują i dopasowują wysokość do terenu. Animowane są tekstura, jasne smugi i żar powierzchni. Rzeka pozostaje widoczna po przeskoczeniu.
- W drugim epizodzie jest jeden ogromny giganotozaur. Przechodzi z lewej strony, zatrzymuje się na środku drogi, patrzy na gracza, otwiera szczękę i ryczy, następnie odchodzi. Gracz musi poczekać; magia i skok nie pozwalają ominąć blokady. Po ponownym rozpoczęciu gry spotkanie się odtwarza.
- Kroki poruszają kamerą i mają ciężki dźwięk; ryk jest zsynchronizowany ze sceną. Pauza zatrzymuje scenę i dźwięk, wyciszenie działa, wznowienie kontynuuje od bieżącego miejsca. Ograniczony ruch wyłącza drżenie kamery. Nie dodano komunikatów na trasie.
- Zachowano wcześniejsze poprawki: głowa w siodle mniejsza o 20%, brak tekstowych nakładek podczas jazdy, kamera i cały konik ponad powierzchnią tęczy przy zjeździe.

## Zakres zmiany

- Wszystkie postacie i elementy środowiska zostały zastąpione przestrzennymi modelami z płaskim cieniowaniem: jednorożec w widoku z siodła, koniki stadne, zbrojne trolle, smoki, czarownice, dinozaury, pterodaktyle, drzewa, palmy, paprocie, skały, zamek, wulkan i jaskinia.
- Głowa konika obraca się przestrzennie; oko i pysk są widoczne w skoku. Koniec magicznego promienia podąża za rzeczywistym położeniem roga.
- Menu, HUD, ikony, konfetti i typografia zostały dostosowane do nowej oprawy. Karty wyboru są renderowane z tych samych modeli co w grze. Dołączono lokalną czcionkę Fredoka z licencją OFL.
- Zachowano oba epizody, wybór trzech koników, 50 przedmiotów, pięć par przeszkód, stada, latające grupy, tęczowy galop, bossów wymagających trzech trafień i automatyczne przejście między epizodami.
- Dostarczone MP3 i zasady rozgrywki pozostają zachowane.

## Poprawki po testach

- Puszczenie strzałki w górę lub rozpoczęcie skoku od razu zatrzymuje dźwięk kopyt, także przy wolniejszym renderowaniu.
- Otoczenie połączono w duże grupy instancji; materiały powierzchni uproszczono do oświetlenia odpowiedniego dla stylu low-poly. Metalowe elementy zachowują połysk.
- Rozdzielczość renderowania może łagodnie zmniejszyć się na wolniejszym urządzeniu; tekst menu pozostaje niezależną, ostrą warstwą DOM.
- Początek tęczowego strzału jest wyświetlany co najmniej przez jedną klatkę i pozostaje na końcu obracającego się roga.
- Przy niskiej liczbie klatek krótki impuls drżenia mógł wygasnąć jeszcze przed rysowaniem. Nowy impuls jest wyświetlany przynajmniej przez jedną klatkę. Drżenie nie sumuje obrotu kamery, więc pauza nie powoduje jej dryfowania.
- Poprzednie ilustracje i moduł pixel art usunięto z dystrybucji.

## Weryfikacja

- `npm test`: 11 zestawów, 0 niepowodzeń. Obejmuje reguły i pełne przejazdy obu epizodów, wejście, audio, animację, wybory, przejścia oraz budowę modeli 3D i ich palety.
- `npm run test:browser`: 23 scenariusze, 0 niepowodzeń; 27 zrzutów ekranu.
- Końcowy przebieg: 0 błędów JavaScript i 0 nieudanych żądań zasobów.
- Chromium headless z programowym renderowaniem WebGL. Okna 1440 × 960 i 390 × 844 oraz tryb pełnego ekranu.
- Scenariusze używają rzeczywistych klawiszy i sygnału Web Audio. Lokalne punkty kontrolne przyspieszają dotarcie do przeszkód, lotu, bossów i mety. To nie jest benchmark fizycznego komputera gracza ani test pozostałych silników przeglądarek.

## Scenariusze

1. First actionable menu, local font, two episode cards and three horses
2. Episode selection and all three coat/horn palettes
3. Rider head reduced by 20%, deep forest and gameplay free of captions
4. Hold Up to ride, release to stop, steer both ways and respect path bounds
5. Space jumps, head shows face and eye, pause freezes the jump and effects
6. Actual Web Audio signal, global mute, resume and independent volume sliders
7. Solid fence and two consecutive jumps
8. Ctrl rainbow shot destroys an enemy without a shot popup
9. Crossing herd blocks forward travel and clears after waiting
10. Witch crossing and pause prevent movement and lingering hoof audio
11. Rainbow sky road rises above forest, awards five bonus pickups and lands safely
12. Forest boss needs three hits, then Episode 1 automatically continues into Episode 2
13. Deep jungle, flowing lava river, jump and leathery pterodactyl crossing
14. Baby stegosaurus herd stops traffic and clears safely
15. Giganotosaurus walks, shakes the camera, stops, roars, opens its jaw and clears the road
16. Tyrannosaur, thunder music, three-hit boss, cave finish, confetti and replay
17. Fullscreen resizes the 3D canvas, then restores the layout
18. WebGL context loss pauses safely and recovery permits continuing
19. Keyboard navigation and return to menu preserve the selected horse
20. Mobile menu has no horizontal overflow and Start stays reachable
21. Reduced motion disables decorative UI transitions
22. Reduced motion suppresses giant camera shake
23. Normal URL exposes no QA controls

Zrzuty i surowy raport: `artifacts/playtest/`. Katalog artefaktów jest wyłączony z Git.
