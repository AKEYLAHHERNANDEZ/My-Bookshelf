# My Bookshelf

A personal reading library built with React and Vite.

## Local development

Needs Node 22.13 or newer. The local app uses Node's built-in SQLite driver and needs no extra database service.

```bash
npm install
npm run dev
```

Open the Vite URL printed in the terminal (usually `http://localhost:5173`). The local API stores the library in `bookshelf.sqlite`, which is ignored by Git.

## Host the UI on GitHub Pages and the API on Cloudflare

GitHub Pages serves the React site. A Cloudflare Worker exposes the API, and Cloudflare D1 stores the library using SQLite-compatible SQL. The API uses a private password and short lived signed sessions; the password and signing secret stay in Cloudflare and are never bundled into the public site.

### 1. Create the D1 database

From this folder, log in to Cloudflare and create the database:

```bash
npx wrangler login
npm run d1:create
```

Cloudflare prints a database ID. Put that ID in `database_id` in `wrangler.jsonc`, replacing `REPLACE_WITH_D1_DATABASE_ID`. In the same file, replace `YOUR-GITHUB-USERNAME` in `ALLOWED_ORIGINS` with the account name in your Pages URL. Keep `http://localhost:5173` in the list for local testing.

Apply the schema and set two secrets. Use a unique password and a random signing secret of at least 32 characters:

```bash
npm run d1:migrate:remote
npx wrangler secret put APP_PASSWORD
npx wrangler secret put SESSION_SECRET
```

Each secret command prompts you to enter its value. Do not commit either value. Deploy the API:

```bash
npm run worker:deploy
```

Wrangler prints the Worker URL, for example `https://my-bookshelf-api.<your-subdomain>.workers.dev`.

### 2. Point the site at the API

In your GitHub repository, open **Settings → Secrets and variables → Actions → Variables** and add a repository variable:

- Name: `VITE_API_BASE_URL`
- Value: your full Worker URL, with no trailing slash

The existing GitHub Actions workflow reads that variable when it builds the site. In **Settings → Pages**, choose **GitHub Actions** as the build and deployment source. Push to `main` (or run the workflow manually) to publish the UI. The API URL is public configuration; the password and session secret are not.

### 3. Move an existing local library to D1

Before opening the deployed site for the first time, export the local SQLite library and import it into the remote D1 database:

```bash
npm run d1:export-local
npx wrangler d1 execute my-bookshelf --remote --file=./d1-import.sql
```

The export file contains your library data. It is gitignored; delete it after the import. A new library starts empty, ready for your books.

### Local testing with the hosted API

Copy `.env.example` to `.env.local`, set `VITE_API_BASE_URL` to the Worker URL, then run `npm run dev`. The Worker permits the local Vite origin for development. Alternatively, `npm run worker:dev` runs a local Worker and local D1 database; apply the schema with `npm run d1:migrate:local` and set `APP_PASSWORD` and `SESSION_SECRET` in a gitignored `.dev.vars` file.

The Cloudflare Worker and D1 documentation: [D1 setup](https://developers.cloudflare.com/d1/get-started/), [D1 bindings](https://developers.cloudflare.com/d1/worker-api/d1-database/), and [Worker deployment](https://developers.cloudflare.com/workers/get-started/guide/).

## App features

- Dashboard, reading goals, and reading insights
- Book shelf, wishlist, search, and online book lookup
- Reading progress and timed sessions
- Journal entries for reviews, notes, quotes, and thoughts
