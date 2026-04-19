import type { BimepPoint, BimepEdge } from '../points';

// IDs are assigned in ascending longitude order (west → east) so the numbers
// on the map read predictably from left to right. IDs are year-scoped: a
// point with id 1 in 2026 has no relation to id 1 in any other year.
export const POINTS_2026: BimepPoint[] = [
  { id: 1,  name: 'Štrigova',              description: 'autobusno stajalište u centru naselja (nasuprot ulaza u Ljekarnu)',               lat: 46.500835, lng: 16.285993, precision: 'landmark' },
  { id: 2,  name: 'Gornji Mihaljevec',     description: 'sportski centar',                                                                  lat: 46.430012, lng: 16.323245, precision: 'centre'   },
  { id: 3,  name: 'Macinec',               description: 'sportski centar NK CENTROMETAL',                                                   lat: 46.392522, lng: 16.326141, precision: 'landmark' },
  { id: 4,  name: 'Pušćine',               description: 'nogometno igralište',                                                              lat: 46.346780, lng: 16.360786, precision: 'centre'   },
  { id: 5,  name: 'Sveti Martin na Muri', description: 'autobusno stajalište u centru naselja (kod stare Osnovne škole)',                  lat: 46.524157, lng: 16.362272, precision: 'landmark' },
  { id: 6,  name: 'Lopatinec (Pleškovec)', description: 'prostor ispred Doma kulture (ispod crkve na glavnoj cesti)',                       lat: 46.438794, lng: 16.380287, precision: 'centre'   },
  { id: 7,  name: 'Čakovec',               description: 'ispred Centra za kulturu (na trgu Republike)',                                     lat: 46.390524, lng: 16.434540, precision: 'landmark' },
  { id: 8,  name: 'Mursko Središće',       description: 'prostor nasuprot autobusnog kolodvora (na glavnoj cesti - Martinska ulica)',       lat: 46.512391, lng: 16.438546, precision: 'centre'   },
  { id: 9,  name: 'Orehovica',             description: 'autobusno stajalište u centru naselja (u blizini rotora)',                         lat: 46.332197, lng: 16.506325, precision: 'centre'   },
  { id: 10, name: 'Mala Subotica',         description: 'kod Društvenog doma',                                                              lat: 46.375918, lng: 16.527898, precision: 'landmark' },
  { id: 11, name: 'Podturen',              description: 'uz autobusno stajalište u centru naselja (u blizini crkve)',                       lat: 46.465769, lng: 16.545832, precision: 'centre'   },
  { id: 12, name: 'Domašinec',             description: 'prostor ispred Doma kulture u centru naselja (na glavnoj cesti)',                  lat: 46.432149, lng: 16.597330, precision: 'centre'   },
  { id: 13, name: 'Prelog',                description: 'na glavnoj cesti u centru naselja',                                                lat: 46.337136, lng: 16.614786, precision: 'centre'   },
  { id: 14, name: 'Donji Kraljevec',       description: 'kod ulaza u METSS na cesti poslije rampe',                                         lat: 46.367991, lng: 16.648717, precision: 'landmark' },
  { id: 15, name: 'Goričan',               description: 'Šuderica',                                                                         lat: 46.388118, lng: 16.683286, precision: 'landmark' },
  { id: 16, name: 'Sveta Marija',          description: 'na glavnoj cesti pokraj kafića u blizini autobusne stanice',                       lat: 46.332160, lng: 16.745101, precision: 'centre'   },
  { id: 17, name: 'Donji Vidovec',         description: 'prostor ispred zgrade Općine',                                                     lat: 46.331399, lng: 16.783607, precision: 'landmark' },
  { id: 18, name: 'Donja Dubrava',         description: 'u dvorištu Doma kulture Zalan',                                                    lat: 46.315315, lng: 16.810573, precision: 'landmark' },
  { id: 19, name: 'Kotoriba',              description: 'prostor ispred Knjižnice i čitaonice (poslije pružnog prijelaza-rampe)',           lat: 46.353843, lng: 16.812771, precision: 'centre'   },
];

// Edges from the flyer map + supplementary routes.
// Distances are the poster's stated km; `dashed` marks alternate routes.
export const EDGES_2026: BimepEdge[] = [
  { a: 1,  b: 5,  km: 9    }, // Štrigova ↔ Sveti Martin na Muri
  { a: 5,  b: 8,  km: 7    }, // Sveti Martin na Muri ↔ Mursko Središće
  { a: 8,  b: 11, km: 15   }, // Mursko Središće ↔ Podturen
  { a: 6,  b: 8,  km: 15   }, // Mursko Središće ↔ Lopatinec
  { a: 1,  b: 6,  km: 18   }, // Štrigova ↔ Lopatinec
  { a: 1,  b: 2,  km: 9.5  }, // Štrigova ↔ Gornji Mihaljevec
  { a: 2,  b: 6,  km: 13   }, // Gornji Mihaljevec ↔ Lopatinec
  { a: 2,  b: 3,  km: 4.5  }, // Gornji Mihaljevec ↔ Macinec
  { a: 3,  b: 7,  km: 8    }, // Macinec ↔ Čakovec
  { a: 3,  b: 4,  km: 11   }, // Macinec ↔ Pušćine
  { a: 6,  b: 10, km: 13   }, // Lopatinec ↔ Mala Subotica
  { a: 4,  b: 7,  km: 9.5  }, // Pušćine ↔ Čakovec
  { a: 4,  b: 9,  km: 15.7 }, // Pušćine ↔ Orehovica
  { a: 7,  b: 10, km: 9.5  }, // Čakovec ↔ Mala Subotica
  { a: 7,  b: 13, km: 17   }, // Čakovec ↔ Prelog
  { a: 9,  b: 13, km: 9    }, // Orehovica ↔ Prelog
  { a: 10, b: 14, km: 11   }, // Mala Subotica ↔ Donji Kraljevec
  { a: 10, b: 12, km: 15   }, // Mala Subotica ↔ Domašinec
  { a: 11, b: 12, km: 5.5  }, // Podturen ↔ Domašinec
  { a: 14, b: 15, km: 3.7  }, // Donji Kraljevec ↔ Goričan
  { a: 13, b: 14, km: 5    }, // Donji Kraljevec ↔ Prelog
  { a: 15, b: 19, km: 14.4 }, // Goričan ↔ Kotoriba
  { a: 13, b: 16, km: 11   }, // Prelog ↔ Sveta Marija
  { a: 16, b: 17, km: 9    }, // Sveta Marija ↔ Donji Vidovec
  { a: 17, b: 18, km: 6    }, // Donji Vidovec ↔ Donja Dubrava
  { a: 18, b: 19, km: 6    }, // Donja Dubrava ↔ Kotoriba
  // Supplementary connections (not labeled on the flyer but used in practice).
  { a: 16, b: 18, km: 0 }, // Sveta Marija ↔ Donja Dubrava
  { a: 17, b: 19, km: 0 }, // Donji Vidovec ↔ Kotoriba
  { a: 14, b: 16, km: 0 }, // Donji Kraljevec ↔ Sveta Marija
  { a: 9,  b: 10, km: 0 }, // Orehovica ↔ Mala Subotica
  { a: 7,  b: 9,  km: 0 }, // Orehovica ↔ Čakovec
  { a: 5,  b: 7,  km: 0 }, // Sveti Martin na Muri ↔ Čakovec
  { a: 7,  b: 11, km: 0 }, // Čakovec ↔ Podturen
  { a: 12, b: 14, km: 0 }, // Donji Kraljevec ↔ Domašinec
];
