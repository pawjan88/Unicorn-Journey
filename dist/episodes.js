export const EPISODES = Object.freeze({
  forest: Object.freeze({
    id:'forest', name:'Tęczowy Las', edition:'MAGICZNY LAS • PRZYGODA 01',
    title:'Jednorożec w <em>Tęczowym Lesie</em>', subtitle:'Wskocz na grzbiet jednorożca i zobacz magię z bliska.',
    intro:'Zbieraj tęcze i używaj magii swojego roga.', icon:'🌈', pickupLabel:'ZEBRANE TĘCZE', pickupResult:'Zebrane tęcze', bonusUnit:'małych tęcz', total:50,
    scene:'✧ WIDOK Z SIODŁA · ZAKĄTEK TĘCZOWYCH MARZEŃ', bossName:'Strażnik mety',
    bossHint:'Omijaj kamienie i traf trolla trzy razy — Ctrl.', obstacleHint:'Dwa płotki? Dwa skoki.', enemyHint:'Omijaj trolle i smoki', shotHint:'Troll na mecie: 3 trafienia',
    endText:'Cały las świętuje razem z Tobą.', bonusName:'Galop po Tęczy',
    trees:['tree-gold.svg','tree-blue.svg'], panorama:'sky-panorama.svg', fog:0xf4e5d3,
  }),
  dino: Object.freeze({
    id:'dino', name:'Świat dinozaurów', edition:'ŚWIAT DINOZAURÓW • PRZYGODA 02',
    title:'Jednorożec w <em>Świecie Dinozaurów</em>', subtitle:'Przemierzaj dżunglę i dotrzyj do jaskini w wulkanie.',
    intro:'Zbieraj bursztyny i znajdź jaskinię w wulkanie.', icon:'🟠', pickupLabel:'ZEBRANE BURSZTYNY', pickupResult:'Zebrane bursztyny', bonusUnit:'bursztynów', total:50,
    scene:'✧ WIDOK Z SIODŁA · DOLINA DINOZAURÓW', bossName:'Tyranozaur',
    bossHint:'Omijaj kamienie i traf tyranozaura trzy razy — Ctrl.', obstacleHint:'Przeskakuj lawę i pnie', enemyHint:'Omijaj dinozaury', shotHint:'Tyranozaur: 3 trafienia',
    endText:'Jaskinia odnaleziona! Dinozaury świętują razem z Tobą.', bonusName:'Galop po Tęczy',
    trees:['dino-palm.svg','dino-fern.svg'], panorama:'dino-panorama.svg', fog:0xd7e5cb,
  }),
});
