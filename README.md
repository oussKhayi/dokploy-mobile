# Dokploy Mobile

An open-source Android app to manage your [Dokploy](https://dokploy.com) server from your phone. Works with any self-hosted Dokploy instance: you only need its URL and an API key.

Built with Expo (React Native) and the official Dokploy REST API. No backend, no tracking: your key stays encrypted on your device and is only sent to your own instance.

## Features

- **Multiple accounts**: save several servers (or users), switch in one tap from the header
- **Dashboard**: projects, services, running and failing at a glance
- **Projects**: browse, create, rename and delete, with environments and live service status
- **Services**: applications, Docker Compose, PostgreSQL, MySQL, MariaDB, MongoDB, Redis, libSQL
- **Actions**: deploy, rebuild, start, stop, reload
- **Environment variables**: edit env and build args
- **Domains**: add, edit, delete, with Let's Encrypt toggle
- **Deployments**: history, full build logs (live while building), cancel, kill build, one-tap rollback
- **Backups**: see database backup schedules and run one now
- **Runtime logs**: tail, time range, live mode, per container for Compose
- **Users**: list, create, remove, set permissions and project access
- **Containers**: every Docker container on the server, with restart, start and stop
- **Server**: version, IP, Traefik reload, Docker cleanup

## Install

Download the latest `.apk` from [Releases](https://github.com/oussKhayi/dokploy-mobile/releases/latest) and open it on your phone (allow "Install unknown apps" when prompted).

## Connect

1. In Dokploy, go to **Profile > API/CLI** and generate an API key.
2. Open the app, enter your instance URL (for example `https://dokploy.example.com` or `http://1.2.3.4:3000`) and paste the key.

What you can see and do follows the permissions of the user who owns the key. Server maintenance and user management need an owner or admin key.

## Develop

```bash
npm install
npx expo start          # needs a development build or an emulator
npm run typecheck
```

Build an APK locally (needs Android SDK and JDK 17):

```bash
npm run build:apk
# output: android/app/build/outputs/apk/release/app-release.apk
```

## Releases (CI)

Pushing a tag like `v0.1.0` runs `.github/workflows/build-apk.yml`, which builds the APK and attaches it to a GitHub Release. You can also run the workflow by hand from the Actions tab.

Builds are signed with the standard debug key by default. To sign with your own key, add these repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_BASE64` | `base64 -w0 release.jks` |
| `ANDROID_KEYSTORE_PASSWORD` | keystore password |
| `ANDROID_KEY_ALIAS` | key alias |
| `ANDROID_KEY_PASSWORD` | key password |

Create a keystore with:

```bash
keytool -genkeypair -v -keystore release.jks -alias dokploy-mobile -keyalg RSA -keysize 2048 -validity 10000
```

Keep the same key for every release, or users will need to uninstall before updating.

## How it talks to Dokploy

Every Dokploy procedure is exposed as `/api/<router>.<procedure>` with an `x-api-key` header. Reads are `GET` with query params, writes are `POST` with a JSON body. See `src/lib/api.ts`.

## Roadmap

- Create services from the app
- Server metrics
- Push notifications for failed deployments

## Contributing

Issues and pull requests are welcome.

## License

MIT. Not affiliated with Dokploy. The Dokploy logo belongs to the Dokploy project.
