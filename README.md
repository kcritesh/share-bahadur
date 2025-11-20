# Share Bahadur

AI-powered stock market app for tracking real-time prices, setting alerts, and exploring company insights.

## Tech Stack

- Next.js
- TypeScript
- Better Auth
- MongoDB
- Shadcn UI
- TailwindCSS
- Inngest
- Finnhub API

## Features

- Real-time stock price tracking with interactive charts
- Personalized watchlists and price alerts
- Company insights and financial data
- AI-powered market summaries
- Email notifications

## Quick Start

**Prerequisites**
- Node.js
- npm

**Installation**

```bash
git clone <repository-url>
cd sharebahadur_stock-tracker-app
npm install
```

**Environment Variables**

Create a `.env` file in the root directory:

```env
NODE_ENV='development'
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# FINNHUB
NEXT_PUBLIC_NEXT_PUBLIC_FINNHUB_API_KEY=
FINNHUB_BASE_URL=https://finnhub.io/api/v1

# MONGODB
MONGODB_URI=

# BETTER AUTH
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# GEMINI
GEMINI_API_KEY=

# NODEMAILER
NODEMAILER_EMAIL=
NODEMAILER_PASSWORD=
```

**Run the Project**

```bash
npm run dev
npx inngest-cli@latest dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
