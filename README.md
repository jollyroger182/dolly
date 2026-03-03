# dolly

A simple Slack poll bot.

## Usage

Use the `/dolly` command to see instructions or create a poll. The `Create a poll` global shortcut is also available.

## Selfhosting setup

1. Create a Slack app with the manifest in [`manifest.json`](./manifest.json), making sure to add your own prefix to commands.
2. Create an `.env` file with the sample values in [`.env.example`](./.env.example).
3. Run the bot with `bun dev`.
