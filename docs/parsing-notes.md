# Parser Notes

The parser code lives in `apps/api/src/modules/parser`.

## Current Coverage

- Generation 3 parsing handles save buffer normalization, section reading, game/layout detection, trainer info, Pokedex flags, party Pokemon, box Pokemon, and imported dex snapshot construction.
- Generation 4 parsing is represented by a dedicated module and supported game metadata, with the API route shape kept consistent with the Gen 3 flow.
- Shared snapshot aggregation lives under `parser/shared` so generation-specific parsers can return the same dashboard-facing model.

## Local Debugging

Set `ENABLE_PARSE_DEBUG_LOGS="true"` in `apps/api/.env` to enable verbose parser and upload diagnostics during local API runs.

Parser behavior should remain deterministic and avoid requiring real user save files for future automated tests.
