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

## Deploying UI changes to Jira

The Jira issue context panel is served from `static/voteon/build` (see `manifest.yml`). `anchor build` only rebuilds the on-chain Solana program and does **not** update the Jira UI.

To publish frontend or Forge resolver changes:

```bash
cd static/voteon && npm run build
cd ../.. && forge deploy
```

Check that the site picked up the deployment:

```bash
forge install list
```

If the installation shows **Outdated app** or a lower major version than your latest deploy, upgrade it:

```bash
forge install --upgrade --site <your-site>.atlassian.net --product jira --environment development
```

Site admins can also upgrade from **Settings → Apps → Manage apps**.

After upgrading, hard-refresh the Jira issue page (or close and reopen the issue context panel). Custom UI iframes can cache aggressively.

### Minor vs major Forge versions

- **Minor version** (UI/resolver changes only): applied automatically to all sites on that major version after `forge deploy`.
- **Major version** (manifest permission changes, e.g. adding/removing scopes): requires `forge install --upgrade` or admin approval before the site runs the new version.

See [Forge app versions](https://developer.atlassian.com/platform/forge/versions/) for details.

## Anchor

- Modify your app by editing the files in `programs`.

- Build your app (inside of the `.` directory):
```
anchor build
```

- Deploy your app by running:
```
anchor deploy --provider.cluster https://api.devnet.solana.com
```

- Copy generated idl
```
cp ./target/idl/programs_voteon.json ./static/voteon/src/programs_voteon_idl.json
```

### Notes
- Use `forge deploy` to publish Forge and Custom UI changes.
- Use `forge install` to install the app on a new site.
- After `forge deploy`, minor version updates roll out automatically; major version updates require `forge install --upgrade`.
- To get 10 sol on devnet: `solana airdrop 10 <your solana wallet address>`
- Unlimited supply airdrop with github account: https://faucet.solana.com/
- config solana cluster: `solana config set --url devnet`
- config solana wallet: `solana config set --keypair ~/.config/solana/id.json`
- config solana keypair: `solana-keygen new -f ~/.config/solana/id.json`
- Create SPL token: `spl-token create-token`
- Create SPL token account: `spl-token create-account <token_mint_address>`
- Mint SPL token: `spl-token mint <token_mint_address> <amount> <token_account_address>`
- Transfer SPL token: `spl-token transfer <token_mint_address> <amount> <token_account_address>` --fund-recipient

## Support
See [Get help](https://developer.atlassian.com/platform/forge/get-help/) for how to get help and provide feedback.
