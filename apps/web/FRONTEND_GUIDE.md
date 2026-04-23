/**
 * Development notes and implementation guide
 */

# VGC Puzzle Trainer - Frontend Implementation

## Architecture Overview

### Technology Stack
- **Framework**: Next.js 15 (React 19)
- **Styling**: CSS Modules (scoped, zero-runtime)
- **Data Fetching**: SWR for client-side, Next.js API routes for server
- **Types**: TypeScript for type safety
- **APIs**: PokéAPI for Pokémon assets, internal API for puzzle data

### Project Structure

```
apps/web/
├── app/                          # Next.js app directory
│   ├── layout.tsx               # Root layout with metadata
│   ├── page.tsx                 # Home page
│   ├── globals.css              # Global styles
│   ├── puzzles/[id]/page.tsx    # Puzzle page (dynamic route)
│   └── api/
│       ├── puzzles/[id]/route.ts    # Fetch puzzle by ID
│       ├── puzzles/submit/route.ts  # Submit puzzle answer
│       └── puzzles/random/route.ts  # Redirect to random puzzle
├── components/                  # Reusable React components
│   ├── BattleField.tsx         # Battle visualization
│   ├── PokemonCard.tsx         # Pokemon display card
│   ├── PuzzleQuestion.tsx      # Question and explanation
│   ├── PuzzlePage.tsx          # Main puzzle page controller
│   └── *.module.css            # Component styles
├── lib/                        # Utility functions
│   ├── pokeapi.ts             # PokéAPI client with caching
│   ├── hooks.ts               # Custom React hooks
│   ├── security.ts            # Security utilities
│   ├── constants.ts           # App constants
│   ├── metadata.ts            # SEO metadata
│   ├── image-utils.ts         # Image optimization helpers
│   └── rate-limiter.ts        # Rate limiting utilities
├── types/                     # TypeScript type definitions
│   └── index.ts              # Main types
├── middleware.ts             # Next.js middleware (security headers)
├── next.config.mjs           # Next.js configuration
├── tsconfig.json             # TypeScript configuration
└── package.json              # Dependencies
```

## Security Features

### Built-in Security

1. **Content Security Policy (CSP)**
   - Strict CSP headers configured in middleware
   - Only allows same-origin scripts and styles
   - External resources limited to PokéAPI

2. **HTTP Security Headers**
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY (prevents clickjacking)
   - X-XSS-Protection: enabled
   - Referrer-Policy: strict-origin-when-cross-origin
   - Permissions-Policy: camera/mic/geolocation disabled

3. **Input Sanitization**
   - XSS prevention with sanitizeInput() utility
   - Email validation
   - Request body validation in API routes

4. **Rate Limiting**
   - Client-side rate limiting on form submissions
   - Server-side rate limiting on API endpoints
   - Exponential backoff support for retry logic

5. **Image Security**
   - Image optimization and compression
   - Restricted remote sources (GitHub/PokéAPI only)
   - Proper CSP directives for images

### Security Best Practices Implemented

- No source maps in production (`productionBrowserSourceMaps: false`)
- Removed X-Powered-By header (`poweredByHeader: false`)
- HTTPS-only redirects for external APIs
- Type safety with TypeScript (prevents runtime errors)
- No sensitive data in client code
- API routes validate all input
- CORS handling for cross-origin requests

## Performance Optimizations

### Image Optimization

1. **Next.js Image Component**
   - Automatic format negotiation (WebP/AVIF support)
   - Responsive image sizing
   - Lazy loading for below-fold images
   - Priority loading for above-fold images

2. **PokéAPI Sprite Caching**
   - In-memory cache with 1-hour TTL
   - Request deduplication to prevent duplicate API calls
   - Preloading strategy for known Pokémon

### Code Optimization

1. **Code Splitting**
   - Automatic route-based code splitting
   - Vendor chunk separation for better caching
   - Lazy loading of heavy components

2. **Build Optimization**
   - Production builds are minified and compressed
   - CSS modules eliminate dead code
   - Tree-shaking of unused code

3. **Runtime Optimization**
   - Incremental Static Regeneration (ISR) for puzzle pages
   - Browser caching headers configured
   - Efficient state management with React hooks
   - Memoization of expensive computations

### Monitoring

1. **Web Vitals**
   - usePerformanceMetrics() hook tracks LCP, FID, CLS
   - Performance observer setup for Core Web Vitals

2. **Error Tracking**
   - Console logging for development
   - Graceful error handling in API routes

## Feature Walkthrough

### Home Page
- Landing page with feature overview
- Call-to-action button to start training
- Mobile-responsive design

### Puzzle Page
- Battle field visualization with both sides' Pokémon
- Active Pokémon cards with HP, status, boosts
- Bench display with condensed view
- Weather/terrain/pseudo-weather indicators
- Multiple choice answer buttons
- Real-time selection feedback
- Answer validation and explanation reveal
- Navigation to next puzzle

### Components

#### BattleField
- Displays the full game state
- Shows weather, terrain, pseudo-weather
- Side conditions display
- Active Pokémon prominent
- Bench Pokémon in compact view

#### PokemonCard
- Sprite from PokéAPI with fallback
- HP bar with color coding
- Status condition badges
- Stat boosts/drops display
- Ability and item information
- Level display

#### PuzzleQuestion
- Multiple choice answers (correct + 2-3 wrong)
- Visual selection feedback
- Submit button with loading state
- Accessible keyboard navigation

#### PuzzleExplanation
- Result indicator (correct/incorrect)
- Correct answer reveal
- Detailed explanation (AI or template-based)
- Difficulty rating
- Tags for categorization

## API Integration Points

### Internal API Routes

```
GET /api/puzzles/:id
  - Fetch single puzzle
  - Caching: 5-minute revalidation
  - Error handling for missing puzzles

POST /api/puzzles/submit
  - Submit puzzle answer
  - Body: { puzzleId, selectedAction, timeTaken }
  - Returns: { isCorrect, message }
  - Rate limited: 5 requests per minute

GET /api/puzzles/random
  - Redirect to random puzzle
  - Used for "Next Puzzle" navigation
```

### External APIs

```
PokéAPI (https://pokeapi.co/api/v2)
  - /pokemon/:name - Pokémon data
  - /move/:name - Move data
  - /ability/:name - Ability data

Image CDN (GitHub raw content)
  - Official artwork: /pokemon/other/official-artwork/:id.png
  - Sprites: /pokemon/:id.png
```

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start dev server (runs on port 3000)
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

### Environment Variables

See `.env.example` for required environment variables:
- `NEXT_PUBLIC_API_URL`: Backend API endpoint
- `NEXT_PUBLIC_ENABLE_ANALYTICS`: Feature flag for analytics
- `NEXT_PUBLIC_CSP_HEADER`: Enable CSP headers

### Building for Production

```bash
# Build
npm run build

# Start production server
npm start
```

## Performance Targets

- **Largest Contentful Paint (LCP)**: < 2.5s
- **First Input Delay (FID)**: < 100ms
- **Cumulative Layout Shift (CLS)**: < 0.1
- **Time to Interactive (TTI)**: < 3.8s
- **JavaScript bundle size**: < 150KB (gzipped)

## Future Enhancements

1. **Analytics Integration**
   - Track puzzle completion rates
   - Monitor user performance metrics
   - A/B testing framework

2. **User Accounts**
   - Progress tracking
   - Leaderboards
   - Custom puzzle sets

3. **Advanced Features**
   - Puzzle filtering by difficulty/type/tags
   - Streak tracking
   - Video explanations
   - Community submissions

4. **Performance**
   - Service Worker for offline support
   - Push notifications for new puzzles
   - Advanced caching strategies

## Troubleshooting

### Images not loading
- Check CORS configuration in next.config.mjs
- Verify PokéAPI is accessible
- Check browser console for CSP errors

### API calls timing out
- Check backend API URL in environment variables
- Verify network connectivity
- Check rate limiter settings

### Performance issues
- Run `npm run build` to see bundle size
- Use Chrome DevTools Performance tab
- Check for N+1 API calls in React DevTools Profiler

## References

- [Next.js Docs](https://nextjs.org/docs)
- [PokéAPI Documentation](https://pokeapi.co/)
- [Pokémon Showdown](https://github.com/smogon/pokemon-showdown)
- [Web Vitals](https://web.dev/vitals/)
