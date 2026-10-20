// =============================================================================
// Fiktive Spielernamen
// Vornamen sind gängige Namen des Landes, Nachnamen werden aus Silben gebaut.
// So entstehen glaubwürdige, aber erfundene Spieler – keine Lizenzen nötig.
// =============================================================================

export const NATIONS = {
  GER: {
    name: 'Deutschland', weight: 34,
    first: ['Lukas', 'Jonas', 'Felix', 'Tim', 'Jan', 'Nico', 'Marco', 'Florian', 'Tobias', 'Dennis', 'Sven', 'Malte',
      'Hannes', 'Lennart', 'Philipp', 'Robin', 'Fabian', 'Niklas', 'Moritz', 'Julian', 'Benedikt', 'Konstantin', 'Till', 'Ole', 'Jannik', 'Mats', 'Leon', 'Paul'],
    pre: ['Brand', 'Hol', 'Kess', 'Wend', 'Rau', 'Stein', 'Mark', 'Lind', 'Feld', 'Hart', 'Kramm', 'Vog', 'Zell', 'Ober', 'Brun', 'Esch', 'Hag', 'Kling', 'Lau', 'Nord', 'Roth', 'Schill', 'Thal', 'Wies', 'Falk', 'Gräf', 'Dreh', 'Morg'],
    suf: ['mann', 'er', 'berg', 'ler', 'hoff', 'inger', 'ke', 'rich', 'stedt', 'meier', 'hausen', 'wald', 'bach', 'schmidt', 'ow', 'tz', 'beck', 'hardt']
  },
  NED: {
    name: 'Niederlande', weight: 6,
    first: ['Daan', 'Sem', 'Thijs', 'Bram', 'Jesse', 'Luuk', 'Stijn', 'Ruben', 'Joris', 'Milan', 'Teun', 'Wout'],
    pre: ['van der ', 'de ', 'van ', '', '', ''],
    suf: ['Berg', 'Veen', 'Wal', 'Bosch', 'Heuvel', 'Broek', 'Kamp', 'Molen', 'Laar', 'Steeg', 'Graaf', 'Zande']
  },
  FRA: {
    name: 'Frankreich', weight: 7,
    first: ['Hugo', 'Louis', 'Théo', 'Mathis', 'Nathan', 'Enzo', 'Maxime', 'Baptiste', 'Clément', 'Quentin', 'Adrien', 'Rayan'],
    pre: ['Bel', 'Dur', 'Mor', 'Lav', 'Gar', 'Ren', 'Fou', 'Char', 'Bon', 'Dela', 'Mar', 'Vill'],
    suf: ['ard', 'ier', 'eau', 'on', 'and', 'ot', 'el', 'ou', 'enne', 'ais', 'ert', 'iot']
  },
  ESP: {
    name: 'Spanien', weight: 6,
    first: ['Pablo', 'Álvaro', 'Diego', 'Javier', 'Sergio', 'Adrián', 'Iker', 'Raúl', 'Hugo', 'Marcos', 'Unai', 'Rubén'],
    pre: ['Mor', 'Gal', 'Ver', 'Cas', 'Rod', 'Bel', 'Nav', 'Sal', 'Ib', 'Ort', 'Can', 'Leg'],
    suf: ['ales', 'ena', 'ero', 'illo', 'ado', 'ido', 'arro', 'iz', 'ega', 'ano', 'era', 'ón']
  },
  ITA: {
    name: 'Italien', weight: 5,
    first: ['Matteo', 'Lorenzo', 'Davide', 'Riccardo', 'Tommaso', 'Gabriele', 'Simone', 'Andrea', 'Luca', 'Pietro', 'Filippo', 'Edoardo'],
    pre: ['Bar', 'Cal', 'Fer', 'Mar', 'Ros', 'Sal', 'Ven', 'Lom', 'Pel', 'Gal', 'Tor', 'Bel'],
    suf: ['etti', 'ini', 'oni', 'ucci', 'ardi', 'elli', 'one', 'ato', 'esi', 'otti', 'aro', 'ani']
  },
  POR: {
    name: 'Portugal', weight: 4,
    first: ['Tiago', 'Rui', 'Gonçalo', 'Duarte', 'Rafael', 'Afonso', 'Martim', 'Vasco', 'Nuno', 'Hélder'],
    pre: ['Cor', 'Fon', 'Mag', 'Pin', 'Ram', 'Tav', 'Brit', 'Lour', 'Mach', 'Cun'],
    suf: ['eira', 'seca', 'alhães', 'heiro', 'os', 'ares', 'o', 'enço', 'ado', 'ha']
  },
  BRA: {
    name: 'Brasilien', weight: 5,
    first: ['Caio', 'Thiago', 'Matheus', 'Gabriel', 'Igor', 'Vinícius', 'Lucas', 'Renan', 'Danilo', 'Wesley', 'Douglas', 'Everton'],
    pre: ['Bar', 'Cam', 'Fag', 'Mor', 'Nas', 'Rib', 'Sou', 'Tei', 'Val', 'Lim'],
    suf: ['bosa', 'pos', 'undes', 'aes', 'cimento', 'eiro', 'za', 'xeira', 'ente', 'a']
  },
  ENG: {
    name: 'England', weight: 5,
    first: ['Harvey', 'Callum', 'Ollie', 'Josh', 'Reece', 'Jack', 'Lewis', 'Ryan', 'Connor', 'Tyler', 'Mason', 'Freddie'],
    pre: ['Ash', 'Brad', 'Craw', 'Fair', 'Hal', 'Kings', 'Mor', 'Pen', 'Rad', 'Whit', 'Thorn', 'Hart'],
    suf: ['ford', 'ley', 'ton', 'well', 'by', 'wood', 'field', 'ridge', 'ham', 'son', 'croft', 'man']
  },
  SWE: {
    name: 'Schweden', weight: 3,
    first: ['Oskar', 'Viktor', 'Emil', 'Axel', 'Linus', 'Hampus', 'Albin', 'Isak', 'Melker', 'Elias'],
    pre: ['Berg', 'Lund', 'Sand', 'Holm', 'Ek', 'Ny', 'Sjö', 'Ström', 'Dahl', 'Fors'],
    suf: ['ström', 'qvist', 'gren', 'berg', 'lund', 'man', 'dahl', 'by']
  },
  POL: {
    name: 'Polen', weight: 4,
    first: ['Kacper', 'Jakub', 'Mateusz', 'Szymon', 'Bartosz', 'Kamil', 'Dawid', 'Patryk', 'Michał', 'Wiktor'],
    pre: ['Kow', 'Nowa', 'Wiśn', 'Zieli', 'Kamin', 'Lewa', 'Mazur', 'Sobo', 'Dąbro', 'Krup'],
    suf: ['alski', 'kowski', 'iewski', 'ński', 'czyk', 'ak', 'ek', 'owicz']
  },
  CRO: {
    name: 'Kroatien', weight: 3,
    first: ['Luka', 'Ivan', 'Marin', 'Domagoj', 'Josip', 'Ante', 'Mateo', 'Dino', 'Toni', 'Bruno'],
    pre: ['Kov', 'Bab', 'Jur', 'Pav', 'Vuk', 'Mar', 'Rad', 'Šim', 'Tom', 'Lov'],
    suf: ['ačić', 'ić', 'ović', 'elić', 'unić', 'ković', 'ar', 'ec']
  },
  AUT: {
    name: 'Österreich', weight: 4,
    first: ['Maximilian', 'David', 'Stefan', 'Lukas', 'Florian', 'Raphael', 'Dominik', 'Andreas', 'Michael', 'Valentin'],
    pre: ['Gruber', 'Huber', 'Pichl', 'Moser', 'Steiner', 'Hofer', 'Leitn', 'Eder', 'Wimm', 'Aign'],
    suf: ['', '', 'er', 'mayr', 'bauer', 'egger']
  },
  DEN: {
    name: 'Dänemark', weight: 3,
    first: ['Mads', 'Rasmus', 'Mikkel', 'Frederik', 'Anders', 'Magnus', 'Kasper', 'Jonas', 'Simon', 'Tobias'],
    pre: ['Ander', 'Jør', 'Ped', 'Niel', 'Lar', 'Søren', 'Holm', 'Skov', 'Dam', 'Krog'],
    suf: ['sen', 'gaard', 'strup', 'by', 'holm', 'sen']
  },
  SEN: {
    name: 'Senegal', weight: 3,
    first: ['Moussa', 'Cheikh', 'Pape', 'Abdou', 'Lamine', 'Ibrahima', 'Mamadou', 'Ousmane', 'Saliou', 'Babacar'],
    pre: ['Nd', 'Diak', 'Gu', 'Fa', 'Sa', 'Cis', 'Ka', 'Diat', 'Mb', 'Seck'],
    suf: ['iaye', 'hité', 'eye', 'ye', 'ko', 'sé', 'ne', 'ta', 'aye', 'ou']
  },
  NGA: {
    name: 'Nigeria', weight: 3,
    first: ['Chidi', 'Emeka', 'Tobi', 'Femi', 'Kelechi', 'Uche', 'Segun', 'Tunde', 'Ifeanyi', 'Kunle'],
    pre: ['Ade', 'Oka', 'Nwa', 'Obi', 'Olu', 'Eze', 'Chu', 'Ogun', 'Ako', 'Ibe'],
    suf: ['yemi', 'for', 'nkwo', 'ora', 'wole', 'kiel', 'kwu', 'bode', 'nde', 'ji']
  },
  ARG: {
    name: 'Argentinien', weight: 4,
    first: ['Facundo', 'Santiago', 'Joaquín', 'Thiago', 'Nicolás', 'Agustín', 'Tomás', 'Franco', 'Matías', 'Lautaro'],
    pre: ['Ac', 'Ben', 'Cor', 'Fer', 'Gim', 'Med', 'Pal', 'Riv', 'Sos', 'Vill'],
    suf: ['uña', 'edetto', 'rea', 'reyra', 'énez', 'ina', 'acios', 'ero', 'a', 'alba']
  }
};

export const NATION_CODES = Object.keys(NATIONS);

export function pickNation(rng, homeBias = 0.55) {
  if (rng.chance(homeBias)) return 'GER';
  return rng.weighted(NATION_CODES.map(code => ({ value: code, weight: NATIONS[code].weight })));
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateName(rng, nation) {
  const n = NATIONS[nation] || NATIONS.GER;
  const first = rng.pick(n.first);
  let last;
  if (nation === 'NED') {
    last = rng.pick(n.pre) + rng.pick(n.suf);
  } else {
    last = capitalize(rng.pick(n.pre) + rng.pick(n.suf));
  }
  return { first, last };
}
