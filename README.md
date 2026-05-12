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

Set these variables for Lemon Squeezy checkout and webhook handling:

- `LEMON_SQUEEZY_API_KEY`
- `LEMON_SQUEEZY_STORE_ID`
- `LEMON_SQUEEZY_VARIANT_ID_ACTIVE`
- `LEMON_SQUEEZY_VARIANT_ID_PLUS`
- `LEMON_SQUEEZY_VARIANT_ID_PRO`
- `LEMON_SQUEEZY_SUCCESS_URL` (optional, defaults to `/dashboard/settings`)
- `NEXT_PUBLIC_APP_URL` (optional fallback for URL generation)

Configure your Lemon Squeezy webhook callback URL to:

- `/api/payments/lemonsqueezy/webhook`

## 📝 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📄 License

This project is private and proprietary.

