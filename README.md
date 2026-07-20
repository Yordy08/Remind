# Remind

App Nuxt para almacenamiento privado de fotos con registro por suscripcion, panel de administrador, notificaciones, reclamos, PWA y monitoreo de Cloudinary.

## Setup

Make sure to install dependencies:

```bash
# npm
npm install

# pnpm
pnpm install

# yarn
yarn install

# bun
bun install
```

## Environment

Create a `.env` file using `.env.example` as reference:

```bash
DATABASE_URL="mongodb+srv://USER:PASSWORD@cluster.mongodb.net/remind"
JWT_SECRET="change-this-secret"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_STORAGE_LIMIT_BYTES="26843545600"
```

## Development Server

Start the development server on `http://localhost:3001`:

```bash
# npm
npm run dev

# pnpm
pnpm dev

# yarn
yarn dev

# bun
bun run dev
```

## Production

Build the application for production:

```bash
# npm
npm run build

# pnpm
pnpm build

# yarn
yarn build

# bun
bun run build
```

Locally preview production build:

```bash
# npm
npm run preview

# pnpm
pnpm preview

# yarn
yarn preview

# bun
bun run preview
```

Check out the [deployment documentation](https://nuxt.com/docs/getting-started/deployment) for more information.
