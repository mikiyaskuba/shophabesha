# ShopHabesha Pro - Enterprise Edition

## Overview
ShopHabesha Pro is an advanced shop management application designed for Ethiopian small businesses. It's built as a Telegram Mini App with Firebase backend, providing real-time sales tracking, credit management, inventory control, and business analytics.

## Current State
- **Version**: 2.0 Enterprise Edition
- **Framework**: React 19 + TypeScript + Vite
- **Backend**: Firebase Firestore + Anonymous Auth
- **Styling**: Tailwind CSS + Framer Motion animations
- **Port**: 5000 (development)

## Recent Changes (December 2025)
- Fixed SMS/Telegram messaging with proper Ethiopian phone number normalization (+251)
- Added comprehensive UI component library (Toast, Modal, Skeleton, EmptyState, StatsCard)
- Upgraded Dashboard with advanced analytics (AR aging, collection rate, trends)
- Added Inventory Management system with stock tracking and low-stock alerts
- Added Reports page with CSV export and analytics charts
- Enhanced Customers page with MessageModal for multi-channel messaging
- Added QuickActions floating menu for fast navigation
- Premium UI polish with Framer Motion animations throughout

## Project Architecture

### File Structure
```
src/
├── components/
│   ├── BottomNav.tsx      - Main navigation
│   ├── EmptyState.tsx     - Empty state displays
│   ├── LoadingSkeleton.tsx - Loading states
│   ├── MessageModal.tsx   - SMS/Telegram/WhatsApp messaging
│   ├── Modal.tsx          - Reusable modal dialogs
│   ├── QuickActions.tsx   - Floating action menu
│   ├── StatsCard.tsx      - Analytics cards
│   └── Toast.tsx          - Toast notifications
├── lib/
│   ├── firebase.ts        - Firebase configuration
│   └── messaging.ts       - Phone normalization & messaging utils
├── pages/
│   ├── AddSale.tsx        - Add new sale (cash/credit)
│   ├── Credits.tsx        - Credit tracking
│   ├── Customers.tsx      - Debtor management with messaging
│   ├── Dashboard.tsx      - Main analytics dashboard
│   ├── Inventory.tsx      - Product/stock management
│   ├── Reports.tsx        - Business reports & export
│   ├── Settings.tsx       - Shop configuration
│   └── Welcome.tsx        - Onboarding screen
├── types/
│   └── index.ts           - TypeScript interfaces
├── App.tsx                - Route configuration
├── index.css              - Global styles
└── main.tsx               - Entry point
```

### Key Features
1. **Sales Tracking**: Cash and credit sales with customer info
2. **Credit Management**: Track debtors, payment progress, overdue alerts
3. **Inventory**: Product catalog, stock levels, low-stock alerts, margins
4. **Reports**: Daily/weekly/monthly analytics, CSV export
5. **Messaging**: Send reminders via SMS, Telegram, WhatsApp with templates
6. **Real-time Sync**: Firebase Firestore for cloud sync

### Firebase Collections
- `sales`: All sales transactions (cash and credit)
- `products`: Inventory items with stock levels

## User Preferences
- Dark theme (Ethiopian market preference)
- Amharic/English bilingual messages
- Ethiopian phone format support (09xxxxxxxx, +251)
- Telebirr/CBE payment integration info

## Development
```bash
npm install        # Install dependencies
npm run dev        # Start dev server on port 5000
npm run build      # Build for production
```

## Deployment
- Target: Static hosting
- Build command: `npm run build`
- Output directory: `dist`
