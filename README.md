# Grabbys — Food, Grocery, Shop & Spirits Delivery

> A modern, full-featured delivery platform for food, groceries, retail shopping, and spirits — built for speed, accessibility, and a seamless user experience.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-grabbys--kitchen.lovable.app-orange?style=for-the-badge&logo=vercel)](https://grabbys-kitchen.lovable.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-96.7%25-3178C6?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

---

##  Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Database](#-database)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

##  Overview

**Grabbys** is an all-in-one delivery web application that connects customers with local restaurants, grocery stores, retail shops, and spirits vendors. Users can browse menus and products, add items to their cart, and place orders — all in one place.

Designed with a mobile-first approach and built as a Progressive Web App (PWA), Grabbys delivers a native-like experience on any device, with offline support and installability.

---

##  Features

- 🍔 **Multi-category delivery** — food, groceries, retail shopping, and spirits in one platform
- 🔐 **Authentication** — secure user sign-up, login, and session management via Supabase Auth
- 🛒 **Cart & Checkout** — smooth add-to-cart flow with real-time cart state management
- 📱 **Progressive Web App (PWA)** — installable on mobile and desktop, with offline-ready capabilities
- 📊 **Analytics Dashboard** — interactive charts and data visualizations via Recharts
- 🎨 **Polished UI** — built with shadcn/ui, Radix UI primitives, and Framer Motion animations
- 🌗 **Dark / Light Mode** — theme switching powered by `next-themes`
- ✅ **Form Validation** — robust client-side validation using React Hook Form and Zod schemas
- ⚡ **Real-time Updates** — live data powered by Supabase real-time subscriptions
- 🔍 **Product Search & Filtering** — quickly find what you need across all categories

---

##  Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18 + TypeScript |
| **Build Tool** | Vite |
| **Styling** | Tailwind CSS + tailwindcss-animate |
| **UI Components** | shadcn/ui + Radix UI |
| **Animations** | Framer Motion |
| **Routing** | React Router DOM v6 |
| **State & Data Fetching** | TanStack React Query |
| **Forms & Validation** | React Hook Form + Zod |
| **Backend & Database** | Supabase (PostgreSQL + Auth + Realtime) |
| **Charts** | Recharts |
| **PWA Support** | vite-plugin-pwa |
| **Package Manager** | Bun / npm |

---

##  Project Structure

```
grabbys-kitchen/
├── public/              # Static assets (icons, manifest)
├── src/
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route-level page components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utility functions and helpers
│   ├── integrations/    # Supabase client and API integrations
│   └── main.tsx         # App entry point
├── supabase/
│   └── migrations/      # Database schema migrations (PLpgSQL)
├── .env                 # Environment variables (see below)
├── vite.config.ts       # Vite configuration
├── tailwind.config.ts   # Tailwind configuration
└── package.json
```

---

##  Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+ or [Bun](https://bun.sh/)
- A [Supabase](https://supabase.com/) project (free tier works)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/JustiNoel/Grabbys-Kitchen.git

# 2. Navigate into the project
cd Grabbys-Kitchen

# 3. Install dependencies
npm install
# or with Bun:
bun install

# 4. Set up environment variables
cp .env.example .env
# Fill in your Supabase credentials (see below)

# 5. Start the development server
npm run dev
# or:
bun run dev
```

The app will be available at `http://localhost:5173`.

### Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server with HMR |
| `npm run build` | Build for production |
| `npm run build:dev` | Build in development mode |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

##  Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

You can find these values in your Supabase project under **Project Settings → API**.

---

##  Database

This project uses **Supabase** (PostgreSQL) as its backend. Database schema migrations are located in the `supabase/migrations/` folder and are written in PLpgSQL.

To apply migrations locally, you can use the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
supabase db push
```

---

##  Deployment

### Deploy with Lovable (Recommended)

The easiest way to deploy this project is via [Lovable](https://lovable.dev):

1. Open the [Lovable Project](https://lovable.dev/projects/f83ee5d8-e6d7-402e-ba82-77ed26361385)
2. Click **Share → Publish**

Changes pushed to the `main` branch are automatically synced with Lovable.

### Deploy with Other Platforms

Since this is a standard Vite + React app, you can deploy it to any static hosting platform:

- **Vercel** — import the GitHub repo directly
- **Netlify** — connect the repo and set build command to `npm run build`, publish directory to `dist`
- **GitHub Pages** — use the `gh-pages` package or a GitHub Actions workflow

Make sure to configure your environment variables on the chosen platform.

---

##  Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Make your changes and commit: `git commit -m 'feat: add your feature'`
4. Push to your fork: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.

---

##  License

This project is licensed under the **MIT License**. See the [LICENSE](./LICENSE) file for details.

---

<p align="center">
  Built with  by <a href="https://github.com/JustiNoel">JustiNoel</a>
</p>
