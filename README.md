# Craftiv

A modern, minimalist resume builder application that helps users create professional, ATS-optimized resumes in minutes.

## 🚀 Features

- **Fast Resume Creation** - Build a professional resume in under 10 minutes
- **ATS-Optimized Templates** - All templates are designed to pass through Applicant Tracking Systems
- **Professional Templates** - Choose from a collection of beautifully designed resume templates
- **Modern UI** - Clean, minimalist design with smooth animations
- **Responsive Design** - Fully optimized for mobile, tablet, and desktop

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **UI Components:** shadcn/ui
- **ORM:** Drizzle ORM
- **Database:** TursoDB
- **Authentication:** Better Auth
- **API:** tRPC

## 📦 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd craftiv
```

2. Install dependencies
```bash
npm install
```

3. Run the development server
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Environment Variables

Set these variables for Polar checkout and webhook handling:

- `POLAR_ACCESS_TOKEN` — organization access token (`polar_oat_…`)
- `POLAR_SERVER` — `sandbox` or `production` (defaults to `sandbox`)
- `POLAR_PRODUCT_ID_ACTIVE`
- `POLAR_PRODUCT_ID_PLUS`
- `POLAR_PRODUCT_ID_PRO`
- `POLAR_WEBHOOK_SECRET` — shown once when you create the webhook endpoint
- `POLAR_SUCCESS_URL` (optional, defaults to `/dashboard/settings`)
- `NEXT_PUBLIC_APP_URL` (optional fallback for URL generation)

Sandbox and production are separate Polar environments with their own tokens and
product IDs, so every value above changes when you flip `POLAR_SERVER`.

Configure your Polar webhook endpoint to point at:

- `/api/payments/polar/webhook`

with format **Raw** and these events enabled: `order.paid`, `order.refunded`.

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📄 License

This project is private and proprietary.

