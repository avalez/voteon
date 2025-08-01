# Forge Web3 app

This project contains a Forge app written in Javascript that displays web3 Solana ap in a Jira issue context panel.

See [developer.atlassian.com/platform/forge/](https://developer.atlassian.com/platform/forge) for documentation and tutorials explaining Forge.

## Requirements

See [Set up Forge](https://developer.atlassian.com/platform/forge/set-up-forge/) for instructions to get set up.
Setup Solana/Anchor develpoment environment

## Quick start
- Install top-level dependencies:
```
npm install
```

- Install dependencies inside of the `static/voteon` directory:
```
npm install
```

- Modify your app by editing the files in `static/voteon/src/`.

- Build your app (inside of the `static/voteon` directory):
```
npm run build
```

- Deploy your app by running:
```
forge deploy
```

- Install your app in an Atlassian site by running:
```
forge install
```

## Anchor

- Modify your app by editing the files in `programs`.

- Build your app (inside of the `.` directory):
```
anchor build
```

- Deploy your app by running:
```
anchor deploy
```
### Notes
- Use the `forge deploy` command when you want to persist code changes.
- Use the `forge install` command when you want to install the app on a new site.
- Once the app is installed on a site, the site picks up the new app changes you deploy without needing to rerun the install command.

## Support

See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.
