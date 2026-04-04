CREATE TYPE "PokemonType" AS ENUM (
    'NORMAL',
    'FIRE',
    'WATER',
    'ELECTRIC',
    'GRASS',
    'ICE',
    'FIGHTING',
    'POISON',
    'GROUND',
    'FLYING',
    'PSYCHIC',
    'BUG',
    'ROCK',
    'GHOST',
    'DRAGON',
    'DARK',
    'STEEL'
);

ALTER TABLE "PokemonSpecies"
ADD COLUMN "primaryType" "PokemonType" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "secondaryType" "PokemonType";