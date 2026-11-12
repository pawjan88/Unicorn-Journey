# Odświeżenie Unicorn Journey — raport przeglądu

Status: gotowe lokalnie do oceny właściciela. Nie opublikowano nowej wersji na GitHubie ani w innym hostingu.

## Zmiany

- Spójny styl pixel art w obu epizodach: wspólna paleta 42 kolorów, ostre tekstury postaci, pikselowe ikony i konfetti, lokalna czcionka Pixelify Sans.
- Nowe menu z obrazkowymi kartami epizodów i trzech koników; czytelny wybór, obsługa klawiatury, zwięzły HUD i zwijana pomoc.
- Zachowane: perspektywa z siodła, kolory koników i rogów, oba epizody, 50 skarbów, skok, magia, stada, bossowie oraz automatyczne przejście do świata dinozaurów.
- Galop powiązany z przebytą drogą, oddech przeciwników, ruch pterodaktyli i obrót głowy z widocznym pyskiem oraz okiem.
- Poprawione cienie, nowy przestrzenny zamek i szerokie warstwy wzgórz podczas Galopu po Tęczy.
- Osobna regulacja muzyki i efektów w pauzie, ogranicznik głośności, przyciszanie podkładu podczas efektów oraz ograniczona liczba jednoczesnych efektów. Przesłane pliki audio zachowano.

## Znalezione i naprawione problemy

1. Przy słabym renderowaniu gra zwalniała: klatka trwająca 200 ms przesuwała zegar tylko o 60 ms. Zwiększono limit nadganiania czasu, zachowując stały krok symulacji 120 Hz. Dodano test regresji.
2. Rysowanie wielu osobnych fragmentów każdej tęczy i cieni w każdej klatce niepotrzebnie obciążało renderer. Tęcza korzysta teraz z jednej współdzielonej geometrii, a cienie aktualizują się wraz z przesuwaniem trasy.
3. Pauza zatrzymywała reguły, ale część oprawy korzystała z czasu rzeczywistego. Teraz pauza zatrzymuje także zegar animacji i efektów.
4. Zmiana epizodu zwalniała również tekstury przechowywane we wspólnym cache. Współdzielone tekstury są zachowywane; zasoby poprzedniej sceny są nadal zwalniane.
5. Panorama podczas przelotu miała widoczny prostokątny brzeg. Zastąpiono ją szerokimi wzgórzami oraz zamkiem z geometrii 3D.
6. Utrata kontekstu WebGL wymagała odświeżenia. Teraz wstrzymuje grę, a po odzyskaniu grafiki można wznowić zabawę.
7. Powiadomienia mogły zasłaniać menu pauzy, a znak pauzy bywał wyświetlany jako pusty kwadrat. Poprawiono widoczność warstw i narysowano ikonę w CSS.

## Wynik weryfikacji

- `npm test`: 8 zestawów testów, 0 niepowodzeń.
- `npm run test:browser`: 19 scenariuszy zakończonych powodzeniem; 21 zrzutów ekranu.
- Końcowy przebieg: 0 błędów JavaScript i 0 nieudanych żądań zasobów.
- Chromium w trybie headless z programowym renderowaniem WebGL; okna 1440 × 960 i 390 × 844 oraz pełny ekran.
- Testy korzystają z prawdziwych zdarzeń klawiatury i sygnału Web Audio. Lokalne punkty kontrolne pozwalają szybko sprawdzić przeszkody, przelot, bossów i metę. Pełne przejazdy reguł są dodatkowo sprawdzane w testach symulacji.
- To sprawdzenie Chromium; nie wykonano benchmarku na fizycznym komputerze gracza ani testów innych silników przeglądarek.

## Scenariusze przeglądarkowe

1. First actionable menu, local font, two episode cards and three horses
2. Episode selection and all three coat/horn palettes
3. Hold Up to ride, release to stop, steer both ways and respect path bounds
4. Space jumps, head shows face and eye, pause freezes the jump and effects
5. Actual Web Audio signal, global mute, resume and independent volume sliders
6. Solid fence and two consecutive jumps
7. Ctrl rainbow shot destroys an enemy without a shot popup
8. Crossing herd blocks forward travel and clears after waiting
9. Witch crossing and pause prevent movement and lingering hoof audio
10. Rainbow sky road rises above forest, awards five bonus pickups and lands safely
11. Forest boss needs three hits, then Episode 1 automatically continues into Episode 2
12. Dinosaur lava jump and flying pterodactyl crossing
13. Tyrannosaur, thunder music, three-hit boss, cave finish, confetti and replay
14. Fullscreen resizes the pixel canvas, then restores the layout
15. WebGL context loss pauses safely and recovery permits continuing
16. Keyboard navigation and return to menu preserve the selected horse
17. Mobile menu has no horizontal overflow and Start stays reachable
18. Reduced motion disables decorative UI transitions
19. Normal URL exposes no QA controls

Surowy raport i zrzuty: `artifacts/playtest/`. Wyniki są dołączone do lokalnej paczki ZIP, a katalog artefaktów jest wyłączony z Git.
