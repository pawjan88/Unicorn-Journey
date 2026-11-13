# Unicorn Journey — low-poly 3D: raport testów

Status: gotowa wersja do testów właściciela, bez publikacji zmian na GitHubie.

## Aktualne poprawki widoczności i zjazdu

- Głowa widoczna z siodła (razem z uszami i rogiem) ma dokładnie 80% wcześniejszego rozmiaru w każdej osi. Test porównuje rzeczywiste wymiary bryły. Proporcje koników na kartach i w stadach pozostają zachowane.
- Usunięto widoczne komunikaty i podpowiedzi podczas jazdy, plakietkę z imieniem konika, opis sceny oraz tekstowe tabliczki przy bonusie i mecie. Pozostały liczby, ikony, postęp i punkty wytrzymałości bossa. Menu i pomoc poza trasą pozostają dostępne.
- Poprawiono pozycję i obrót kamery na całej tęczy: kamera jest odsunięta wzdłuż normalnej i stycznej do drogi oraz patrzy zgodnie z jej nachyleniem. Stary wzór przy zjeździe umieszczał oko około 0,41 m pod powierzchnią.
- Test regresji sprawdza 321 pozycji na łuku i wszystkie wierzchołki widocznego modelu konika; kamera oraz model pozostają nad drogą, a wjazd i lądowanie nie mają skoku pozycji. Przeglądarka rejestruje dodatkowo pozycje w czasie całego lotu i zrzuty samego zjazdu oraz lądowania.

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
- Poprzednie ilustracje i moduł pixel art usunięto z dystrybucji.

## Weryfikacja

- `npm test`: 9 zestawów, 0 niepowodzeń. Obejmuje reguły i pełne przejazdy obu epizodów, wejście, audio, animację, wybory, przejścia oraz budowę modeli 3D i ich palety.
- `npm run test:browser`: 20 scenariuszy, 0 niepowodzeń; 23 zrzuty ekranu.
- Końcowy przebieg: 0 błędów JavaScript i 0 nieudanych żądań zasobów.
- Chromium headless z programowym renderowaniem WebGL. Okna 1440 × 960 i 390 × 844 oraz tryb pełnego ekranu.
- Scenariusze używają rzeczywistych klawiszy i sygnału Web Audio. Lokalne punkty kontrolne przyspieszają dotarcie do przeszkód, lotu, bossów i mety. To nie jest benchmark fizycznego komputera gracza ani test pozostałych silników przeglądarek.

## Scenariusze

1. First actionable menu, local font, two episode cards and three horses
2. Episode selection and all three coat/horn palettes
3. Rider head reduced by 20% and gameplay free of captions
4. Hold Up to ride, release to stop, steer both ways and respect path bounds
5. Space jumps, head shows face and eye, pause freezes the jump and effects
6. Actual Web Audio signal, global mute, resume and independent volume sliders
7. Solid fence and two consecutive jumps
8. Ctrl rainbow shot destroys an enemy without a shot popup
9. Crossing herd blocks forward travel and clears after waiting
10. Witch crossing and pause prevent movement and lingering hoof audio
11. Rainbow sky road rises above forest, awards five bonus pickups and lands safely
12. Forest boss needs three hits, then Episode 1 automatically continues into Episode 2
13. Dinosaur lava jump and flying pterodactyl crossing
14. Tyrannosaur, thunder music, three-hit boss, cave finish, confetti and replay
15. Fullscreen resizes the 3D canvas, then restores the layout
16. WebGL context loss pauses safely and recovery permits continuing
17. Keyboard navigation and return to menu preserve the selected horse
18. Mobile menu has no horizontal overflow and Start stays reachable
19. Reduced motion disables decorative UI transitions
20. Normal URL exposes no QA controls

Zrzuty i surowy raport: `artifacts/playtest/`. Katalog artefaktów jest wyłączony z Git.
