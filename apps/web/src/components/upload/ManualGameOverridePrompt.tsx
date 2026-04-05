import type { ManualGen3GameOverride } from "../../types/save";

type ManualGameOverridePromptProps = {
    isOpen: boolean;
    isSubmitting: boolean;
    message: string;
    onSelectGame: (selectedGame: ManualGen3GameOverride) => Promise<void>;
    onCancel: () => void;
};

// MANUAL_GAME_OVERRIDE_OPTIONS stores the two FRLG title choices shown when layout detection needs user confirmation.
const MANUAL_GAME_OVERRIDE_OPTIONS: {
    value: ManualGen3GameOverride;
    label: string;
    description: string;
}[] = [
    {
        value: "FIRERED",
        label: "FireRed",
        description: "Finalize this FRLG-layout save as a FireRed save profile."
    },
    {
        value: "LEAFGREEN",
        label: "LeafGreen",
        description: "Finalize this FRLG-layout save as a LeafGreen save profile."
    }
];

// ManualGameOverridePrompt renders the FRLG title-selection dialog before the upload flow is finalized.
// App.tsx owns the pending upload state and calls this so the chooser can be reused for new uploads and replacements.
export const ManualGameOverridePrompt = ({
    isOpen,
    isSubmitting,
    message,
    onSelectGame,
    onCancel
}: ManualGameOverridePromptProps) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202018]/60 px-4">
            <div className="w-full max-w-[520px] rounded-3xl bg-[#fbf8df] p-6 text-[#38392a] shadow-[0_24px_80px_rgba(32,32,24,0.28)]">
                <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#7a7b5c]">
                    Manual Title Selection
                </p>

                <h2 className="mt-3 text-3xl font-extrabold tracking-tight">
                    Choose FireRed or LeafGreen
                </h2>

                <p className="mt-3 text-[15px] leading-6 text-[#56573f]">
                    {message}
                </p>

                <div className="mt-6 grid gap-3">
                    {MANUAL_GAME_OVERRIDE_OPTIONS.map((gameOption) => {
                        return (
                            <button
                                key={gameOption.value}
                                type="button"
                                className="rounded-2xl border border-[#d7d3ae] bg-white px-4 py-4 text-left transition hover:border-[#91945c] hover:bg-[#fffff4] disabled:cursor-not-allowed disabled:opacity-60"
                                onClick={() => {
                                    void onSelectGame(gameOption.value);
                                }}
                                disabled={isSubmitting}
                            >
                                <div className="text-[18px] font-extrabold text-[#30311f]">
                                    {gameOption.label}
                                </div>
                                <div className="mt-1 text-[14px] leading-6 text-[#64664b]">
                                    {gameOption.description}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="mt-5 flex justify-end">
                    <button
                        type="button"
                        className="rounded-full border border-[#c8c49a] px-4 py-2 text-[13px] font-bold uppercase tracking-[0.08em] text-[#5b5c43] transition hover:border-[#8d8e62] hover:text-[#38392a] disabled:cursor-not-allowed disabled:opacity-60"
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};
