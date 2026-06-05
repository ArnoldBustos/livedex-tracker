# MVP And Current Capabilities

Livedex Tracker currently supports a local full-stack workflow for tracking Pokemon save progress.

## Available

- Upload a supported save file and create a save profile.
- Manually create a tracker shell when no save file is available.
- Detect and display trainer, game, and dex progress details when parser data is available.
- Track standard and shiny collection state across seen, caught, and living-entry fields.
- Switch between saved profiles through the dashboard profile picker.
- Use local email/password development auth and guest-style local flows.

## Intentional Limits

- The project is optimized for local development and portfolio review, not hosted production operations.
- Parser coverage is strongest around the Gen 3 flow.
- Real save files are not committed to the repository.
