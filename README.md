# BIMEP

Unofficial Progressive Web App companion for **BIMEP** (*Biciklima međimurskim putovima* — "By bicycle along Međimurje's routes"), an annual recreational cycling event held in Međimurje County, Croatia. Riders follow a network of marked points scattered across the county and collect visits at each one. The event is organised to mark Međimurje County Day, World Health Day, and Earth Day, and is open to everyone.

> **Disclaimer.** This project is an independent, community-made tool. I am **not affiliated with, endorsed by, or sponsored by** the BIMEP organising committee or any of the event's official organisers, sponsors, or partners. All rights to the BIMEP name and any related marks remain with their respective owners.

## Features

- Map of all BIMEP points with bike-routed connections between them
- Automatic GPS check-in on proximity, plus manual marking with per-point timestamps
- **Route planner** — select any subset of points (or all), get the shortest order to visit them (nearest-neighbour + 2-opt over a bike distance matrix)
- Multi-year history, progress, total and per-leg times
- Croatian, English, German
- Installable PWA with offline tile cache
- Optional Google / Apple sign-in with cross-device sync (guest mode works fully without signing in)

## License

Released into the public domain under [The Unlicense](./LICENSE). Do whatever you want with it.
