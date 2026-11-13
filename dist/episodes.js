export const EPISODES = Object.freeze({
  forest: Object.freeze({
    id:'forest', name:'Tęczowy Las', edition:'MAGICZNY LAS • PRZYGODA 01',
    title:'Jednorożec w <em>Tęczowym Lesie</em>', subtitle:'Wskocz na grzbiet jednorożca i zobacz magię z bliska.',
    intro:'Zbieraj tęcze i używaj magii swojego roga.', icon:'🌈', pickupLabel:'ZEBRANE TĘCZE', pickupResult:'Zebrane tęcze', bonusUnit:'małych tęcz', total:50,
    scene:'✧ WIDOK Z SIODŁA · ZAKĄTEK TĘCZOWYCH MARZEŃ', bossName:'Strażnik mety',
    bossHint:'Omijaj kamienie i traf trolla trzy razy — Ctrl.', obstacleHint:'Dwa płotki? Dwa skoki.', enemyHint:'Omijaj trolle i smoki', shotHint:'Troll na mecie: 3 trafienia',
    endText:'Cały las świętuje razem z Tobą.', bonusName:'Galop po Tęczy',
    environment:'forest', landmark:'castle', fog:0xe0eadb, next:'dino',
  }),
  dino: Object.freeze({
    id:'dino', name:'Świat dinozaurów', edition:'ŚWIAT DINOZAURÓW • PRZYGODA 02',
    title:'Jednorożec w <em>Świecie Dinozaurów</em>', subtitle:'Przemierzaj dżunglę i dotrzyj do jaskini w wulkanie.',
    intro:'Zbieraj bursztyny i znajdź jaskinię w wulkanie.', icon:'🟠', pickupLabel:'ZEBRANE BURSZTYNY', pickupResult:'Zebrane bursztyny', bonusUnit:'bursztynów', total:50,
    scene:'✧ WIDOK Z SIODŁA · DOLINA DINOZAURÓW', bossName:'Tyranozaur',
    bossHint:'Omijaj kamienie i traf tyranozaura trzy razy — Ctrl.', obstacleHint:'Przeskakuj lawę i pnie', enemyHint:'Omijaj dinozaury', shotHint:'Tyranozaur: 3 trafienia',
    endText:'Jaskinia odnaleziona! Dinozaury świętują razem z Tobą.', bonusName:'Galop po Tęczy',
    environment:'jungle', landmark:'volcano', fog:0xd4e2cc, next:'cave',
  }),
  cave: Object.freeze({
    id:'cave', name:'Kryształowe Jaskinie', edition:'SERCE WULKANU • PRZYGODA 03',
    title:'Jednorożec w <em>Kryształowych Jaskiniach</em>', subtitle:'Przemierzaj jaskinie i przywróć blask Kryształowemu Sercu.',
    intro:'Zbieraj świecące kryształy i odkryj serce wulkanu.', icon:'💎', pickupLabel:'ZEBRANE KRYSZTAŁY', pickupResult:'Zebrane kryształy', bonusUnit:'kryształków', total:50,
    scene:'✧ WIDOK Z SIODŁA · KRYSZTAŁOWE SERCE WULKANU', bossName:'Obsydianowy Strażnik',
    bossHint:'Omijaj kamienie i traf strażnika trzy razy — Ctrl.', obstacleHint:'Przeskakuj szczeliny i kamienne kolumny', enemyHint:'Omijaj golemy i kryształowe kraby', shotHint:'Obsydianowy Strażnik: 3 trafienia',
    endText:'Kryształowe Serce znów świeci! Czeka na Ciebie słoneczna polana.', bonusName:'Tęczowy Most nad Jeziorem',
    environment:'cave', landmark:'crystal-heart', fog:0x263e4e,
  }),
});
