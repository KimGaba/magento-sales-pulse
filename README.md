# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/2a884200-905e-4ae0-b256-eb9aae846465

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/2a884200-905e-4ae0-b256-eb9aae846465) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## Configuration

Create a `.env` file in the project root based on `.env.example` and set your Railway
credentials:

```sh
cp .env.example .env
```

The `DATABASE_URL` variable must be provided for the
application to connect to Railway.

### Docker

The provided `docker-compose.yml` uses these environment variables. Ensure they
are set in your shell or in a `.env` file before running:

```sh
docker-compose up
```

### Build and Serve

You can generate a production build and serve it locally with:

```bash
npm run build
npx serve -s dist -l tcp://0.0.0.0:3000
```

The `Dockerfile` instead starts the development server with:

```bash
npm run dev -- --host 0.0.0.0 --port 3000
```

### Deploying to Railway

When deploying to Railway, set the build command to `npm run build` and either
use the new `npm start` script or set the start command to
`npx serve -s dist -l tcp://0.0.0.0:$PORT`.

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/2a884200-905e-4ae0-b256-eb9aae846465) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## Running with Docker

The project includes a `docker-compose.yml` file that starts the React dev server alongside a self-hosted Railway stack.

```bash
docker compose up
```

The application will be available at `http://localhost:3000` and the PostgreSQL database listens on port `5432`.
