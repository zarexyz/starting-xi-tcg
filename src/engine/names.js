import { t } from '../i18n/index.js';
// =============================================================================
// Fiktive Spielernamen
// Vornamen sind gängige Namen des Landes, Nachnamen werden aus Silben gebaut.
// So entstehen glaubwürdige, aber erfundene Spieler – keine Lizenzen nötig.
// =============================================================================

export const NATIONS = {
  GER: {
    weight: 7,
    first: ['Lukas', 'Jonas', 'Felix', 'Tim', 'Jan', 'Nico', 'Marco', 'Florian', 'Tobias', 'Dennis', 'Sven', 'Malte',
      'Hannes', 'Lennart', 'Philipp', 'Robin', 'Fabian', 'Niklas', 'Moritz', 'Julian', 'Benedikt', 'Konstantin', 'Till', 'Ole', 'Jannik', 'Mats', 'Leon', 'Paul'],
    pre: ['Brand', 'Hol', 'Kess', 'Wend', 'Rau', 'Stein', 'Mark', 'Lind', 'Feld', 'Hart', 'Kramm', 'Vog', 'Zell', 'Ober', 'Brun', 'Esch', 'Hag', 'Kling', 'Lau', 'Nord', 'Roth', 'Schill', 'Thal', 'Wies', 'Falk', 'Gräf', 'Dreh', 'Morg'],
    suf: ['mann', 'er', 'berg', 'ler', 'hoff', 'inger', 'ke', 'rich', 'stedt', 'meier', 'hausen', 'wald', 'bach', 'schmidt', 'ow', 'tz', 'beck', 'hardt']
  },
  NED: {
    weight: 6,
    first: ['Daan', 'Sem', 'Thijs', 'Bram', 'Jesse', 'Luuk', 'Stijn', 'Ruben', 'Joris', 'Milan', 'Teun', 'Wout'],
    pre: ['van der ', 'de ', 'van ', '', '', ''],
    suf: ['Berg', 'Veen', 'Wal', 'Bosch', 'Heuvel', 'Broek', 'Kamp', 'Molen', 'Laar', 'Steeg', 'Graaf', 'Zande']
  },
  FRA: {
    weight: 7,
    first: ['Hugo', 'Louis', 'Théo', 'Mathis', 'Nathan', 'Enzo', 'Maxime', 'Baptiste', 'Clément', 'Quentin', 'Adrien', 'Rayan'],
    pre: ['Bel', 'Dur', 'Mor', 'Lav', 'Gar', 'Ren', 'Fou', 'Char', 'Bon', 'Dela', 'Mar', 'Vill'],
    suf: ['ard', 'ier', 'eau', 'on', 'and', 'ot', 'el', 'ou', 'enne', 'ais', 'ert', 'iot']
  },
  ESP: {
    weight: 6,
    first: ['Pablo', 'Álvaro', 'Diego', 'Javier', 'Sergio', 'Adrián', 'Iker', 'Raúl', 'Hugo', 'Marcos', 'Unai', 'Rubén'],
    pre: ['Mor', 'Gal', 'Ver', 'Cas', 'Rod', 'Bel', 'Nav', 'Sal', 'Ib', 'Ort', 'Can', 'Leg'],
    suf: ['ales', 'ena', 'ero', 'illo', 'ado', 'ido', 'arro', 'iz', 'ega', 'ano', 'era', 'ón']
  },
  ITA: {
    weight: 5,
    first: ['Matteo', 'Lorenzo', 'Davide', 'Riccardo', 'Tommaso', 'Gabriele', 'Simone', 'Andrea', 'Luca', 'Pietro', 'Filippo', 'Edoardo'],
    pre: ['Bar', 'Cal', 'Fer', 'Mar', 'Ros', 'Sal', 'Ven', 'Lom', 'Pel', 'Gal', 'Tor', 'Bel'],
    suf: ['etti', 'ini', 'oni', 'ucci', 'ardi', 'elli', 'one', 'ato', 'esi', 'otti', 'aro', 'ani']
  },
  POR: {
    weight: 4,
    first: ['Tiago', 'Rui', 'Gonçalo', 'Duarte', 'Rafael', 'Afonso', 'Martim', 'Vasco', 'Nuno', 'Hélder'],
    pre: ['Cor', 'Fon', 'Mag', 'Pin', 'Ram', 'Tav', 'Brit', 'Lour', 'Mach', 'Cun'],
    suf: ['eira', 'seca', 'alhães', 'heiro', 'os', 'ares', 'o', 'enço', 'ado', 'ha']
  },
  BRA: {
    weight: 5,
    first: ['Caio', 'Thiago', 'Matheus', 'Gabriel', 'Igor', 'Vinícius', 'Lucas', 'Renan', 'Danilo', 'Wesley', 'Douglas', 'Everton'],
    pre: ['Bar', 'Cam', 'Fag', 'Mor', 'Nas', 'Rib', 'Sou', 'Tei', 'Val', 'Lim'],
    suf: ['bosa', 'pos', 'undes', 'aes', 'cimento', 'eiro', 'za', 'xeira', 'ente', 'a']
  },
  ENG: {
    weight: 7,
    first: ['Harvey', 'Callum', 'Ollie', 'Josh', 'Reece', 'Jack', 'Lewis', 'Ryan', 'Connor', 'Tyler', 'Mason', 'Freddie', 'Alfie', 'Kieran', 'Jamal', 'Charlie'],
    pre: ['Ash', 'Brad', 'Craw', 'Fair', 'Hal', 'Kings', 'Mor', 'Pen', 'Rad', 'Whit', 'Thorn', 'Hart', 'Black', 'Sand', 'Stan'],
    suf: ['ford', 'ley', 'ton', 'well', 'by', 'wood', 'field', 'ridge', 'ham', 'son', 'croft', 'man', 'worth', 'ington'],
    full: ['Turner', 'Walker', 'Bennett', 'Hughes', 'Foster', 'Cole', 'Barker', 'Lloyd', 'Grant', 'Fletcher', 'Mills', 'Ward']
  },
  SWE: {
    weight: 3,
    first: ['Oskar', 'Viktor', 'Emil', 'Axel', 'Linus', 'Hampus', 'Albin', 'Isak', 'Melker', 'Elias'],
    pre: ['Berg', 'Lund', 'Sand', 'Holm', 'Ek', 'Ny', 'Sjö', 'Ström', 'Dahl', 'Fors'],
    suf: ['ström', 'qvist', 'gren', 'berg', 'lund', 'man', 'dahl', 'by']
  },
  POL: {
    weight: 4,
    first: ['Kacper', 'Jakub', 'Mateusz', 'Szymon', 'Bartosz', 'Kamil', 'Dawid', 'Patryk', 'Michał', 'Wiktor'],
    pre: ['Kow', 'Nowa', 'Wiśn', 'Zieli', 'Kamin', 'Lewa', 'Mazur', 'Sobo', 'Dąbro', 'Krup'],
    suf: ['alski', 'kowski', 'iewski', 'ński', 'czyk', 'ak', 'ek', 'owicz']
  },
  CRO: {
    weight: 3,
    first: ['Luka', 'Ivan', 'Marin', 'Domagoj', 'Josip', 'Ante', 'Mateo', 'Dino', 'Toni', 'Bruno'],
    pre: ['Kov', 'Bab', 'Jur', 'Pav', 'Vuk', 'Mar', 'Rad', 'Šim', 'Tom', 'Lov'],
    suf: ['ačić', 'ić', 'ović', 'elić', 'unić', 'ković', 'ar', 'ec']
  },
  AUT: {
    weight: 4,
    first: ['Maximilian', 'David', 'Stefan', 'Lukas', 'Florian', 'Raphael', 'Dominik', 'Andreas', 'Michael', 'Valentin'],
    pre: ['Gruber', 'Huber', 'Pichl', 'Moser', 'Steiner', 'Hofer', 'Leitn', 'Eder', 'Wimm', 'Aign'],
    suf: ['', '', 'er', 'mayr', 'bauer', 'egger']
  },
  DEN: {
    weight: 3,
    first: ['Mads', 'Rasmus', 'Mikkel', 'Frederik', 'Anders', 'Magnus', 'Kasper', 'Jonas', 'Simon', 'Tobias'],
    pre: ['Ander', 'Jør', 'Ped', 'Niel', 'Lar', 'Søren', 'Holm', 'Skov', 'Dam', 'Krog'],
    suf: ['sen', 'gaard', 'strup', 'by', 'holm', 'sen']
  },
  SEN: {
    weight: 3,
    first: ['Moussa', 'Cheikh', 'Pape', 'Abdou', 'Lamine', 'Ibrahima', 'Mamadou', 'Ousmane', 'Saliou', 'Babacar'],
    pre: ['Nd', 'Diak', 'Gu', 'Fa', 'Sa', 'Cis', 'Ka', 'Diat', 'Mb', 'Seck'],
    suf: ['iaye', 'hité', 'eye', 'ye', 'ko', 'sé', 'ne', 'ta', 'aye', 'ou']
  },
  NGA: {
    weight: 3,
    first: ['Chidi', 'Emeka', 'Tobi', 'Femi', 'Kelechi', 'Uche', 'Segun', 'Tunde', 'Ifeanyi', 'Kunle'],
    pre: ['Ade', 'Oka', 'Nwa', 'Obi', 'Olu', 'Eze', 'Chu', 'Ogun', 'Ako', 'Ibe'],
    suf: ['yemi', 'for', 'nkwo', 'ora', 'wole', 'kiel', 'kwu', 'bode', 'nde', 'ji']
  },
  ARG: {
    weight: 4,
    first: ['Facundo', 'Santiago', 'Joaquín', 'Thiago', 'Nicolás', 'Agustín', 'Tomás', 'Franco', 'Matías', 'Lautaro'],
    pre: ['Ac', 'Ben', 'Cor', 'Fer', 'Gim', 'Med', 'Pal', 'Riv', 'Sos', 'Vill'],
    suf: ['uña', 'edetto', 'rea', 'reyra', 'énez', 'ina', 'acios', 'ero', 'a', 'alba']
  }
};

Object.assign(NATIONS, {
  SCO: {
    weight: 3,
    first: ['Callum', 'Fraser', 'Ewan', 'Lewis', 'Kieran', 'Scott', 'Ross', 'Euan', 'Jamie', 'Craig', 'Lachlan', 'Rory'],
    pre: ['Mc', 'Mac', 'Mc'],
    suf: ['Leod', 'Kenna', 'Donald', 'Gregor', 'Allister', 'Intyre', 'Lean', 'Cann', 'Kay', 'Bride', 'Arthur', 'Lennan'],
    full: ['Robertson', 'Fraser', 'Campbell', 'Stewart', 'Murray', 'Reid', 'Henderson', 'Paterson', 'Gillespie', 'Kerr', 'Douglas', 'Morrison'],
    keepCase: true
  },
  TUR: {
    weight: 4,
    first: ['Emre', 'Burak', 'Arda', 'Kerem', 'Mert', 'Can', 'Oğuz', 'Yusuf', 'Hakan', 'Barış', 'Efe', 'Kaan'],
    pre: ['Yıl', 'Kara', 'Ak', 'Öz', 'Demir', 'Çelik', 'Kor', 'Şa', 'Er', 'Ay', 'Tun', 'Gül'],
    suf: ['maz', 'han', 'kaya', 'türk', 'soy', 'doğan', 'can', 'oğlu', 'dağ', 'taş']
  },
  BEL: {
    weight: 3,
    first: ['Arthur', 'Lucas', 'Wout', 'Jules', 'Senne', 'Thibaut', 'Maxime', 'Arne', 'Victor', 'Lander', 'Mathéo', 'Robbe'],
    pre: ['Ver', 'Jans', 'Peet', 'Mert', 'Claes', 'Goos', 'Lamb', 'Hend', 'Wout', 'Dries'],
    suf: ['ens', 'sens', 'ermans', 'aert', 'haeghe', 'mans', 'eels', 'rickx']
  },
  SRB: {
    weight: 3,
    first: ['Nikola', 'Stefan', 'Lazar', 'Dušan', 'Marko', 'Filip', 'Aleksandar', 'Uroš', 'Nemanja', 'Vuk', 'Miloš', 'Strahinja'],
    pre: ['Jov', 'Petr', 'Nik', 'Mil', 'Stan', 'Đor', 'Pav', 'Mark', 'Ran', 'Živ'],
    suf: ['anović', 'ović', 'olić', 'ić', 'ković', 'ević', 'ašević', 'inić']
  },
  GRE: {
    weight: 3,
    first: ['Giorgos', 'Kostas', 'Dimitris', 'Nikos', 'Giannis', 'Vasilis', 'Christos', 'Petros', 'Thanasis', 'Panagiotis', 'Stelios', 'Manolis'],
    pre: ['Papa', 'Kara', 'Georgi', 'Nikol', 'Konst', 'Vlach', 'Dimitr', 'Christ', 'Andre', 'Spyr'],
    suf: ['dopoulos', 'giannis', 'ou', 'aidis', 'antinou', 'os', 'akis', 'idis', 'opoulos', 'atos']
  },
  MAR: {
    weight: 3,
    first: ['Youssef', 'Hamza', 'Amine', 'Ayoub', 'Bilal', 'Zakaria', 'Ilias', 'Soufiane', 'Mehdi', 'Anass', 'Reda', 'Othmane'],
    pre: ['Benn', 'Bou', 'Azz', 'Hari', 'Amr', 'Lahl', 'Ziy', 'Ouah', 'Tal', 'Elk'],
    suf: ['idi', 'ali', 'fal', 'ouz', 'abi', 'ani', 'iri', 'ech', 'bi', 'ssi']
  },
  USA: {
    weight: 4,
    first: ['Tyler', 'Brandon', 'Chase', 'Logan', 'Cody', 'Austin', 'Hunter', 'Bryce', 'Jordan', 'Gavin', 'Caleb', 'Miles'],
    pre: ['Wash', 'Mill', 'Hol', 'Car', 'Brook', 'Stan', 'Craw', 'Bell', 'Win', 'Spen'],
    suf: ['ington', 'er', 'oway', 'ter', 'ston', 'ford', 'amy', 'cer'],
    full: ['Turner', 'Brooks', 'Carter', 'Hayes', 'Coleman', 'Bennett', 'Reed', 'Foster', 'Griffin', 'Hughes', 'Wallace', 'Porter']
  },
  MEX: {
    weight: 4,
    first: ['Santiago', 'Diego', 'Emiliano', 'Rodrigo', 'Alejandro', 'Uriel', 'Jesús', 'Héctor', 'Edson', 'Raúl', 'Érick', 'César'],
    pre: ['Hern', 'Gonz', 'Ram', 'Guzm', 'Cort', 'Salc', 'Mor', 'Esqu', 'Alv', 'Medr'],
    suf: ['ández', 'ález', 'írez', 'án', 'és', 'edo', 'ales', 'ivel', 'arado', 'ano']
  },
  COL: {
    weight: 3,
    first: ['Juan', 'Andrés', 'Camilo', 'Sebastián', 'Jhon', 'Duván', 'Wílmar', 'Brayan', 'Kevin', 'Mateo', 'Cristian', 'Daniel'],
    pre: ['Ospi', 'Cuad', 'Arbo', 'Muri', 'Cast', 'Var', 'Quint', 'Rest', 'Ceba', 'Zap'],
    suf: ['na', 'rado', 'leda', 'rillo', 'año', 'gas', 'ero', 'repo', 'illos', 'ata']
  },
  JPN: {
    weight: 3,
    first: ['Haruto', 'Sota', 'Yuto', 'Riku', 'Kaito', 'Daiki', 'Takumi', 'Ren', 'Kenta', 'Shota', 'Ryo', 'Hiroki'],
    pre: ['Taka', 'Naka', 'Yama', 'Ishi', 'Mori', 'Kawa', 'Fuji', 'Matsu', 'Hashi', 'Kita'],
    suf: ['hashi', 'mura', 'moto', 'da', 'gawa', 'no', 'zaki', 'ta', 'shita', 'oka']
  }
});

export const NATION_CODES = Object.keys(NATIONS);
// Ländernamen kommen aus der Sprachdatei
for (const code of NATION_CODES) Object.defineProperty(NATIONS[code], 'name', { get: () => t(`nation.${code}`), enumerable: true });

/**
 * Nationalität würfeln. Mit Heimatland kommt ein Teil der Spieler von dort,
 * der Rest stammt aus der ganzen Welt.
 */
export function pickNation(rng, home = null, homeBias = 0.55) {
  if (home && NATIONS[home] && rng.chance(homeBias)) return home;
  return rng.weighted(NATION_CODES.map(code => ({ value: code, weight: NATIONS[code].weight })));
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function generateName(rng, nation) {
  const n = NATIONS[nation] || NATIONS.GER;
  const first = rng.pick(n.first);
  let last;
  if (n.full && rng.chance(0.4)) {
    last = rng.pick(n.full);
  } else if (nation === 'NED' || n.keepCase) {
    last = rng.pick(n.pre) + rng.pick(n.suf);
  } else {
    last = capitalize(rng.pick(n.pre) + rng.pick(n.suf));
  }
  return { first, last };
}
