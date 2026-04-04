// PokemonTypeBadgeStyle is the set of Tailwind classes used for one type badge
// LoadedDashboardView uses these classes when rendering primary and secondary type pills
export type PokemonTypeBadgeStyle = {
    containerClassName: string;
};

// getPokemonTypeBadgeStyle returns the Tailwind classes for a pokemon type badge
// LoadedDashboardView calls this for each rendered pokemon type
export const getPokemonTypeBadgeStyle = (pokemonType: string): PokemonTypeBadgeStyle => {
    if (pokemonType === "NORMAL") {
        return {
            containerClassName: "bg-stone-100 text-stone-700"
        };
    }

    if (pokemonType === "FIRE") {
        return {
            containerClassName: "bg-orange-100 text-orange-700"
        };
    }

    if (pokemonType === "WATER") {
        return {
            containerClassName: "bg-blue-100 text-blue-700"
        };
    }

    if (pokemonType === "ELECTRIC") {
        return {
            containerClassName: "bg-yellow-100 text-yellow-700"
        };
    }

    if (pokemonType === "GRASS") {
        return {
            containerClassName: "bg-green-100 text-green-700"
        };
    }

    if (pokemonType === "ICE") {
        return {
            containerClassName: "bg-cyan-100 text-cyan-700"
        };
    }

    if (pokemonType === "FIGHTING") {
        return {
            containerClassName: "bg-red-100 text-red-700"
        };
    }

    if (pokemonType === "POISON") {
        return {
            containerClassName: "bg-purple-100 text-purple-700"
        };
    }

    if (pokemonType === "GROUND") {
        return {
            containerClassName: "bg-amber-100 text-amber-700"
        };
    }

    if (pokemonType === "FLYING") {
        return {
            containerClassName: "bg-sky-100 text-sky-700"
        };
    }

    if (pokemonType === "PSYCHIC") {
        return {
            containerClassName: "bg-pink-100 text-pink-700"
        };
    }

    if (pokemonType === "BUG") {
        return {
            containerClassName: "bg-lime-100 text-lime-700"
        };
    }

    if (pokemonType === "ROCK") {
        return {
            containerClassName: "bg-yellow-200 text-yellow-800"
        };
    }

    if (pokemonType === "GHOST") {
        return {
            containerClassName: "bg-violet-100 text-violet-700"
        };
    }

    if (pokemonType === "DRAGON") {
        return {
            containerClassName: "bg-indigo-100 text-indigo-700"
        };
    }

    if (pokemonType === "DARK") {
        return {
            containerClassName: "bg-slate-200 text-slate-800"
        };
    }

    if (pokemonType === "STEEL") {
        return {
            containerClassName: "bg-gray-200 text-gray-700"
        };
    }

    return {
        containerClassName: "bg-gray-100 text-gray-700"
    };
};