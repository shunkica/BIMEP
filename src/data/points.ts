import { roadKm } from './routes';

export type Precision = 'landmark' | 'centre';

export interface BimepPoint {
  id: number;
  name: string;
  description: string;
  lat: number;
  lng: number;
  precision: Precision;
}

export interface BimepEdge {
  a: number;
  b: number;
  km: number;
  dashed?: boolean;
}

export const POINTS: BimepPoint[] = [
  { id: 1,  name: 'Sveti Martin na Muri', description: 'autobusno stajalište u centru naselja (kod stare Osnovne škole)',                 lat: 46.524157, lng: 16.362272, precision: 'landmark' },
  { id: 2,  name: 'Mursko Središće',       description: 'prostor nasuprot autobusnog kolodvora (na glavnoj cesti - Martinska ulica)',      lat: 46.512391, lng: 16.438546, precision: 'centre'   },
  { id: 3,  name: 'Štrigova',              description: 'autobusno stajalište u centru naselja (nasuprot ulaza u Ljekarnu)',               lat: 46.500835, lng: 16.285993, precision: 'landmark' },
  { id: 4,  name: 'Lopatinec (Pleškovec)', description: 'prostor ispred Doma kulture (ispod crkve na glavnoj cesti)',                       lat: 46.450805, lng: 16.373211, precision: 'centre'   },
  { id: 5,  name: 'Podturen',              description: 'uz autobusno stajalište u centru naselja (u blizini crkve)',                      lat: 46.465769, lng: 16.545832, precision: 'centre'   },
  { id: 6,  name: 'Gornji Mihaljevec',     description: 'sportski centar',                                                                  lat: 46.430012, lng: 16.323245, precision: 'centre'   },
  { id: 7,  name: 'Macinec',               description: 'sportski centar NK CENTROMETAL',                                                   lat: 46.392522, lng: 16.326141, precision: 'landmark' },
  { id: 8,  name: 'Domašinec',             description: 'prostor ispred Doma kulture u centru naselja (na glavnoj cesti)',                  lat: 46.432149, lng: 16.597330, precision: 'centre'   },
  { id: 9,  name: 'Mala Subotica',         description: 'kod Društvenog doma',                                                              lat: 46.375918, lng: 16.527898, precision: 'landmark' },
  { id: 10, name: 'Čakovec',               description: 'ispred Centra za kulturu (na trgu Republike)',                                     lat: 46.390524, lng: 16.434540, precision: 'landmark' },
  { id: 11, name: 'Goričan',               description: 'Šuderica',                                                                         lat: 46.388118, lng: 16.683286, precision: 'landmark' },
  { id: 12, name: 'Donji Kraljevec',       description: 'kod ulaza u METSS na cesti poslije rampe',                                         lat: 46.367991, lng: 16.648717, precision: 'landmark' },
  { id: 13, name: 'Kotoriba',              description: 'prostor ispred Knjižnice i čitaonice (poslije pružnog prijelaza-rampe)',           lat: 46.353843, lng: 16.812771, precision: 'centre'   },
  { id: 14, name: 'Pušćine',               description: 'nogometno igralište',                                                              lat: 46.346780, lng: 16.360786, precision: 'centre'   },
  { id: 15, name: 'Orehovica',             description: 'autobusno stajalište u centru naselja (u blizini rotora)',                         lat: 46.332197, lng: 16.506325, precision: 'centre'   },
  { id: 16, name: 'Prelog',                description: 'na glavnoj cesti u centru naselja',                                                lat: 46.337136, lng: 16.614786, precision: 'centre'   },
  { id: 17, name: 'Sveta Marija',          description: 'na glavnoj cesti pokraj kafića u blizini autobusne stanice',                        lat: 46.332160, lng: 16.745101, precision: 'centre'   },
  { id: 18, name: 'Donji Vidovec',         description: 'prostor ispred zgrade Općine',                                                     lat: 46.331399, lng: 16.783607, precision: 'landmark' },
  { id: 19, name: 'Donja Dubrava',         description: 'u dvorištu Doma kulture Zalan',                                                    lat: 46.315315, lng: 16.810573, precision: 'landmark' },
];

// Edges read from the flyer map. Distances are the poster's stated km (road
// distances along the BIMEP route), not great-circle. "dashed" marks the
// alternate/optional route shown with a dashed line on the flyer.
export const EDGES: BimepEdge[] = [
  { a: 1,  b: 3,  km: 9    },
  { a: 1,  b: 2,  km: 7    },
  { a: 2,  b: 5,  km: 15   },
  { a: 2,  b: 4,  km: 15   },
  { a: 3,  b: 4,  km: 18   },
  { a: 3,  b: 6,  km: 9.5  },
  { a: 6,  b: 4,  km: 13   },
  { a: 6,  b: 7,  km: 4.5  },
  { a: 7,  b: 10, km: 8    },
  { a: 7,  b: 14, km: 11   },
  { a: 4,  b: 9,  km: 13   },
  { a: 14, b: 10, km: 9.5  },
  { a: 14, b: 15, km: 15.7 },
  { a: 10, b: 9,  km: 9.5  },
  { a: 10, b: 16, km: 17   },
  { a: 15, b: 16, km: 9    },
  { a: 9,  b: 12, km: 11   },
  { a: 9,  b: 8,  km: 15   },
  { a: 5,  b: 8,  km: 5.5  },
  { a: 12, b: 11, km: 3.7  },
  { a: 12, b: 16, km: 5    },
  { a: 11, b: 13, km: 14.4 },
  { a: 16, b: 17, km: 11   },
  { a: 17, b: 18, km: 9    },
  { a: 18, b: 19, km: 6    },
  { a: 13, b: 19, km: 6 },
  // Supplementary connections (not labeled on the flyer but used in practice).
  { a: 19, b: 17, km: 0 },
  { a: 18, b: 13, km: 0 },
  { a: 12, b: 17, km: 0 },
  { a: 15, b: 9,  km: 0 },
  { a: 15, b: 10, km: 0 },
  { a: 1,  b: 10, km: 0 },
  { a: 5,  b: 10, km: 0 }, // Čakovec ↔ Podturen
  { a: 8,  b: 12, km: 0 }, // Donji Kraljevec ↔ Domašinec
];

export const POINT_BY_ID: Record<number, BimepPoint> = Object.fromEntries(
  POINTS.map(p => [p.id, p]),
);

/**
 * Neighbours of a point, preferring road distance (from routes.json) and
 * falling back to the flyer's labelled km when the route data doesn't yet
 * include a distance. `km` is always populated with the best-available value.
 */
export function neighbours(id: number): { point: BimepPoint; km: number }[] {
  return EDGES
    .filter(e => e.a === id || e.b === id)
    .map(e => {
      const other = POINT_BY_ID[e.a === id ? e.b : e.a];
      const road = roadKm(e.a, e.b);
      const km = road ?? (e.km > 0 ? e.km : 0);
      return { point: other, km };
    })
    .sort((x, y) => x.km - y.km);
}

export function haversineMeters(
  aLat: number, aLng: number, bLat: number, bLng: number,
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLng = toRad(bLng - aLng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
