import { useEffect, useState } from "react";
import type {
    EditableSaveIdentity,
    SupportedGame
} from "../../types/save";
import { SUPPORTED_GAMES } from "../../types/save";

type SaveDetailsFormProps = {
    isOpen: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    isSubmitting: boolean;
    identity: EditableSaveIdentity;
    showTrainerNameField: boolean;
    showGameField: boolean;
    requireGameSelection: boolean;
    onSubmit: (identity: EditableSaveIdentity) => Promise<void> | void;
    onCancel: () => void;
};

// supportedGameLabelByValue maps stored game ids to the mixed-case labels shown in the setup dropdown.
// SaveDetailsForm uses this so the select can keep enum-style values while showing human-readable names.
const supportedGameLabelByValue: Record<SupportedGame, string> = {
    RUBY: "Ruby",
    SAPPHIRE: "Sapphire",
    EMERALD: "Emerald",
    FIRERED: "FireRed",
    LEAFGREEN: "LeafGreen"
};

// gameSelectionOptions stores the supported game choices shown in reusable save setup flows.
// SaveDetailsForm maps this so manual creation and future upload confirmation can share the same list.
const gameSelectionOptions: Array<{
    value: SupportedGame;
    label: string;
}> = SUPPORTED_GAMES.map((supportedGame) => {
    return {
        value: supportedGame,
        label: supportedGameLabelByValue[supportedGame]
    };
});

// SaveDetailsForm renders the shared save identity dialog used by setup flows.
// App.tsx opens this for manual entry, upload naming, and profile edits so setup logic stays centralized in one dashboard-aligned modal.
export const SaveDetailsForm = ({
    isOpen,
    title,
    description,
    confirmLabel,
    isSubmitting,
    identity,
    showTrainerNameField,
    showGameField,
    requireGameSelection,
    onSubmit,
    onCancel
}: SaveDetailsFormProps) => {
    const [draftIdentity, setDraftIdentity] = useState<EditableSaveIdentity>(identity);
    const [validationMessage, setValidationMessage] = useState("");

    // Reset the editable form state whenever a new setup flow opens or the source identity changes.
    // App.tsx relies on this so upload and manual dialogs always start from the latest prefilled values.
    useEffect(() => {
        setDraftIdentity(identity);
        setValidationMessage("");
    }, [identity, isOpen]);

    // handleSubmit validates required identity fields before returning the shared payload upstream.
    // App.tsx calls this through the form so setup orchestration stays outside the presentational component.
    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        const trimmedDisplayName = draftIdentity.displayName.trim();
        const trimmedTrainerName = draftIdentity.trainerName.trim();
        const nextIdentity: EditableSaveIdentity = Object.assign({}, draftIdentity, {
            displayName: trimmedDisplayName,
            trainerName: trimmedTrainerName
        });

        if (!trimmedDisplayName) {
            setValidationMessage("Save name is required.");
            return;
        }

        if (requireGameSelection && nextIdentity.game === null) {
            setValidationMessage("Choose a game before continuing.");
            return;
        }

        setValidationMessage("");
        await onSubmit(nextIdentity);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(17,24,39,0.42)] px-4 backdrop-blur-[2px]">
            <div className="w-full max-w-[560px] rounded-3xl border border-gray-200 bg-white p-6 text-[#38392a] shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-gray-500">
                    Save Setup
                </p>

                <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900">
                    {title}
                </h2>

                <p className="mt-3 text-[15px] leading-6 text-gray-600">
                    {description}
                </p>

                <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
                    <div className="grid gap-2">
                        <label
                            htmlFor="save-details-display-name"
                            className="text-[13px] font-semibold text-gray-700"
                        >
                            Save name
                        </label>

                        <input
                            id="save-details-display-name"
                            className="min-h-[48px] rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none transition focus:border-[#6b7a34] focus:ring-2 focus:ring-[rgba(107,122,52,0.14)]"
                            type="text"
                            value={draftIdentity.displayName}
                            onChange={(event) => {
                                setDraftIdentity(
                                    Object.assign({}, draftIdentity, {
                                        displayName: event.target.value
                                    })
                                );
                            }}
                            disabled={isSubmitting}
                        />
                    </div>

                    {showTrainerNameField ? (
                        <div className="grid gap-2">
                            <label
                                htmlFor="save-details-trainer-name"
                                className="text-[13px] font-semibold text-gray-700"
                            >
                                Trainer Name
                            </label>

                            <input
                                id="save-details-trainer-name"
                                className="min-h-[48px] rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none transition focus:border-[#6b7a34] focus:ring-2 focus:ring-[rgba(107,122,52,0.14)]"
                                type="text"
                                value={draftIdentity.trainerName}
                                onChange={(event) => {
                                    setDraftIdentity(
                                        Object.assign({}, draftIdentity, {
                                            trainerName: event.target.value
                                        })
                                    );
                                }}
                                disabled={isSubmitting}
                            />
                        </div>
                    ) : null}

                    {showGameField ? (
                        <div className="grid gap-2">
                            <label
                                htmlFor="save-details-game"
                                className="text-[13px] font-semibold text-gray-700"
                            >
                                Game
                            </label>

                            <select
                                id="save-details-game"
                                className="min-h-[48px] rounded-xl border border-gray-200 bg-white px-4 text-[14px] text-gray-900 outline-none transition focus:border-[#6b7a34] focus:ring-2 focus:ring-[rgba(107,122,52,0.14)]"
                                value={draftIdentity.game ? draftIdentity.game : ""}
                                onChange={(event) => {
                                    setDraftIdentity(
                                        Object.assign({}, draftIdentity, {
                                            game: event.target.value
                                                ? event.target.value as SupportedGame
                                                : null
                                        })
                                    );
                                }}
                                disabled={isSubmitting}
                            >
                                <option value="">Choose a game</option>
                                {gameSelectionOptions.map((gameOption) => {
                                    return (
                                        <option key={gameOption.value} value={gameOption.value}>
                                            {gameOption.label}
                                        </option>
                                    );
                                })}
                            </select>
                        </div>
                    ) : null}

                    {validationMessage ? (
                        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {validationMessage}
                        </div>
                    ) : null}

                    <div className="mt-2 flex justify-end gap-3">
                        <button
                            type="button"
                            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-[14px] font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="rounded-xl bg-[#6b7a34] px-5 py-2.5 text-[14px] font-semibold text-white transition hover:bg-[#5a672b] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Working..." : confirmLabel}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
