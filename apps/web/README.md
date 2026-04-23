# @vgc/web

A performant, secure, and minimalist Next.js frontend for VGC Puzzle Trainer.

## Features Implemented ✅

### Core Functionality
- ✅ Home page with feature overview
- ✅ Puzzle display with battle field visualization
- ✅ Multiple choice answer selection
- ✅ Answer submission and validation
- ✅ Explanation reveal (template and AI-enriched)
- ✅ Navigation between puzzles

### Security
- ✅ Content Security Policy (CSP) headers
- ✅ HTTPS-only external requests
- ✅ Input validation and sanitization
- ✅ Rate limiting on submissions
- ✅ Secure API route handlers
- ✅ XSS prevention

### Performance
- ✅ Image optimization with Next.js Image component
- ✅ PokéAPI response caching (1-hour TTL)
- ✅ Request deduplication
- ✅ Code splitting by route
- ✅ Incremental Static Regeneration (ISR)
- ✅ Browser caching headers
- ✅ Production minification and compression

### UI/UX
- ✅ Mobile-responsive design
- ✅ Accessible components (WCAG 2.1)
- ✅ Smooth animations and transitions
- ✅ Loading states and error handling
- ✅ Clean, minimalist design system
- ✅ CSS modules for scoped styles

## Quick Start

```bash
# Install dependencies
npm install

# Start development server (port 3000)
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Project Structure

```
apps/web/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page
│   ├── globals.css                   # Global styles
│   ├── puzzles/[id]/page.tsx         # Puzzle page
│   ├── api/
│   │   ├── puzzles/[id]/route.ts     # Get puzzle API
│   │   ├── puzzles/submit/route.ts   # Submit answer API
│   │   └── puzzles/random/route.ts   # Random puzzle redirect
│   ├── robots.ts                     # SEO robots.txt
│   └── sitemap.ts                    # SEO sitemap
├── components/
│   ├── BattleField.tsx              # Battle visualization
│   ├── PokemonCard.tsx              # Pokemon display
│   ├── PuzzleQuestion.tsx           # Question and explanation
│   ├── PuzzlePage.tsx               # Main puzzle controller
│   └── *.module.css                 # Component styles
├── lib/
│   ├── pokeapi.ts                   # PokéAPI client
│   ├── hooks.ts                     # Custom hooks
│   ├── security.ts                  # Security utilities
│   ├── constants.ts                 # App constants
│   ├── metadata.ts                  # SEO metadata
│   ├── image-utils.ts               # Image helpers
│   └── rate-limiter.ts              # Rate limiting
├── types/
│   └── index.ts                     # Type definitions
├── public/
│   └── manifest.json                # PWA manifest
├── middleware.ts                    # Security headers middleware
├── next.config.mjs                  # Build configuration
├── FRONTEND_GUIDE.md                # Detailed implementation guide
└── package.json
```

## Implemented Routes

| Route | Purpose |
|-------|---------|
| `/` | Home page with feature overview |
| `/login` | Login route |
| `/register` | Registration route |
| `/account` | Signed-in account page |
| `/puzzles/[id]` | Puzzle detail page |
| `/puzzles/random` | Redirect to random puzzle |
| `/api/puzzles/:id` | Fetch puzzle (with caching) |
| `/api/puzzles/submit` | Submit puzzle answer |
| `/api/puzzles/random` | Get random puzzle redirect |

## Planned Routes

- `/submit` - Community puzzle submission
- `/dashboard` - User progress tracking
- `/moderate` - Moderation queue

## Environment Variables

```bash
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_AUTH_API_BASE=http://localhost:3001
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_CSP_HEADER=true
```

> The app uses backend auth when either `NEXT_PUBLIC_AUTH_API_BASE` or `NEXT_PUBLIC_API_URL` is configured. If neither is set, auth routes will report the backend as unconfigured.
>
> Before using `/register` or `/login`, start the API server on the configured backend port (for local development this is typically `http://localhost:3001`).

## Key Technologies

- **Next.js 15**: React framework with SSR/SSG
- **React 19**: Latest React with improved performance
- **TypeScript**: Type-safe development
- **CSS Modules**: Scoped styling, zero-runtime
- **SWR**: Data fetching library
- **PokéAPI**: Official Pokémon data source

## Security Features

### Headers & Policies
- Content Security Policy (CSP)
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: enabled
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy: camera/mic/geolocation disabled

### Input Validation
- Client-side form validation
- Server-side request body validation
- XSS prevention with input sanitization
- Rate limiting (5 requests per minute)

### API Security
- No sensitive data in responses
- Secure CORS configuration
- HTTPS-only external requests
- API route validation

## Performance Optimizations

### Image Handling
- Next.js Image component with automatic optimization
- WebP/AVIF format support
- Lazy loading for below-fold images
- Priority loading for above-fold images
- Responsive sizing for different viewports

### Caching Strategy
- PokéAPI responses: 1-hour TTL
- Puzzle pages: 5-minute ISR revalidation
- Browser cache: 1-week for static assets
- Request deduplication: prevents duplicate API calls

### Code Optimization
- Route-based code splitting
- Vendor chunk separation for better caching
- Production minification and gzip compression
- Tree-shaking of unused code
- No source maps in production

## Performance Metrics

**Build Sizes:**
- JavaScript bundle: < 150KB (gzipped)
- CSS: < 30KB (gzipped)
- Initial HTML: < 50KB

**Runtime Metrics:**
- Largest Contentful Paint: < 2.5s
- First Input Delay: < 100ms
- Cumulative Layout Shift: < 0.1

## Development Scripts

```bash
npm run dev         # Start dev server with hot reload
npm run build       # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript type checker
```

## Components Overview

### BattleField
Displays the complete game state:
- Weather and terrain indicators
- Pseudo-weather badges
- Opponent's active and bench Pokémon
- Your active and bench Pokémon
- Side conditions display
- Turn counter

### PokemonCard
Shows individual Pokémon details:
- Official artwork sprite
- HP bar with color coding
- Status condition badges
- Stat boosts/drops
- Ability and held item
- Level display

### PuzzleQuestion
Multiple choice puzzle interface:
- Correct answer (hidden)
- 2-3 wrong answer options
- Visual selection feedback
- Accessible button design
- Loading state during submission

### PuzzleExplanation
Reveals answer details:
- Result indicator (correct/incorrect)
- Correct move highlight
- Detailed explanation (AI or template)
- Difficulty rating with stars
- Related puzzle tags

## API Integration

### Mock API Routes
The frontend includes mock API routes for development:

```typescript
// Get puzzle
GET /api/puzzles/:id
// Returns: Puzzle object with full game state

// Submit answer
POST /api/puzzles/submit
// Body: { puzzleId, selectedAction, timeTaken }
// Returns: { isCorrect, message }

// Random puzzle
GET /api/puzzles/random
// Redirects to /puzzles/:random-id
```

### External APIs
- **PokéAPI** (https://pokeapi.co/api/v2/)
  - Request caching with 1-hour TTL
  - Error handling with fallbacks
  - Request deduplication

## Browser Support

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile: iOS Safari 12+, Chrome Android

## Deployment

### Vercel (Recommended)
```bash
git push origin main  # Automatically deploys
```

### Self-Hosted
```bash
npm run build
npm start
```

## Testing

Run type checking and linting:
```bash
npm run typecheck
npm run lint
```

## Security Checklist

- [x] CSP headers configured
- [x] Input validation on all forms
- [x] Rate limiting implemented
- [x] Image optimization with restricted sources
- [x] No sensitive data in client code
- [x] API routes validate all input
- [x] HTTPS-only external requests
- [x] TypeScript strict mode enabled
- [x] Security headers middleware
- [x] No source maps in production

## Performance Checklist

- [x] Image lazy loading
- [x] Code splitting by route
- [x] CSS modules for scoped styles
- [x] API response caching
- [x] Request deduplication
- [x] Incremental Static Regeneration
- [x] Production minification
- [x] Gzip compression
- [x] Web Vitals tracking
- [x] Browser caching headers

## For More Information

See [FRONTEND_GUIDE.md](./FRONTEND_GUIDE.md) for detailed implementation documentation.
See [AUTH_API_CONTRACT.md](./AUTH_API_CONTRACT.md) for backend auth request/response contract.
Postman collection: `apps/web/postman/auth-api.postman_collection.json`.

## Contributing

When adding features:
1. Use TypeScript for type safety
2. Validate all inputs (client & server)
3. Use Image component for images
4. Add ARIA labels for accessibility
5. Test on mobile and desktop
6. Update documentation
