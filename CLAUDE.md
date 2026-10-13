# Rotary Connect Israel — Design System & Development Guidelines

## Project Overview

**Rotary Connect Israel** is a private professional networking platform for Rotary Israel (District 2490). The core purpose is simple: **Find the right person, through Rotary.**

### Design Philosophy
- **Premium** — High-quality, sophisticated visual design
- **Human** — Warm, approachable, and trustworthy
- **Calm** — Clean, uncluttered, purposeful
- **Modern** — Contemporary but timeless
- **Fast** — Responsive, performant, instant feedback
- **Professional** — Business-appropriate, credible

### What This App Is NOT
- Not a social feed (no likes, follows, or posts)
- Not a LinkedIn clone
- Not a generic SaaS dashboard
- Not a government database

## Technology Stack

- **Framework**: TanStack Start + React 19
- **Styling**: Tailwind CSS 4 with custom design tokens
- **UI Components**: shadcn/ui + Radix UI primitives
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **Routing**: TanStack Router
- **Database**: MongoDB
- **Build**: Vite 8

## Design Tokens

### Colors (Rotary Brand)
```css
--primary: oklch(0.398 0.126 260.5);  /* Rotary Royal Blue */
--gold: oklch(0.771 0.148 76);         /* Rotary Gold — use sparingly */
--background: oklch(0.988 0.004 95);   /* Warm off-white */
--foreground: oklch(0.21 0.02 258);    /* Deep charcoal */
```

### Typography
- **Headings**: Heebo (Hebrew) / Open Sans (English)
- **Body**: Open Sans (English) / Heebo (Hebrew)
- **Letter-spacing**: -0.015em for headings

### Spacing Scale
Use consistent Tailwind spacing: 0.5, 1, 1.5, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20

### Border Radius
- `--radius: 0.5rem` — Base radius
- Use `rounded-md` for cards, `rounded-lg` for containers

## Internationalization (i18n)

### Language Support
- **Hebrew (RTL)** — Primary language, default
- **English (LTR)** — Secondary language

### Implementation
- Use `useI18n()` hook for translations
- All user-facing text must be in the dictionary
- Test both directions thoroughly
- Don't just mirror LTR layouts — design for RTL natively

### Key Considerations
- Navigation arrows flip direction based on locale
- Text alignment follows document direction
- Forms and inputs respect RTL
- Icons that imply direction (back, forward) should flip

## Component Guidelines

### Cards & Surfaces
- Use subtle borders (`border-border`) rather than heavy shadows
- Keep shadows minimal: `shadow-card` for subtle depth
- Maintain consistent padding: `p-4` or `p-5`

### Buttons
- Primary: `bg-primary text-primary-foreground`
- Secondary: `border border-border hover:bg-secondary`
- Gold accent: `bg-gold text-gold-foreground` — use very sparingly

### Forms
- Input height: `h-11` (44px touch target)
- Label style: `text-muted-foreground text-xs font-semibold`
- Focus: `focus:border-primary outline-none`

### Navigation
- Desktop: Top navigation with text links
- Mobile: Bottom navigation with icons (max 4 items)
- Active state: `bg-secondary text-foreground`

## Visual Guidelines

### DO
- Use typography to create hierarchy
- Use deliberate whitespace
- Keep interfaces uncluttered
- Use real member photography when available
- Use subtle dividers and borders
- Create purposeful micro-interactions

### DO NOT
- Excessive gradients (especially purple/blue AI-style)
- Glassmorphism everywhere
- Giant floating cards
- Unnecessary animations
- Decorative elements with no purpose
- Generic AI-generated aesthetics
- Overuse of pills and badges
- Fake statistics or placeholder content

## Accessibility Requirements

- WCAG 2.2 AA compliance target
- Minimum contrast ratio: 4.5:1 for text
- Touch targets: minimum 44px
- Keyboard navigation for all interactive elements
- Focus indicators visible
- Semantic HTML structure
- Screen reader compatible labels

## Mobile-First Design

- Design for mobile viewport first (375px-430px)
- Progressive enhancement for larger screens
- Bottom navigation on mobile, top navigation on desktop
- Touch-friendly controls
- Consider safe areas on notched devices
- Forms optimized for mobile input

## File Structure

```
src/
├── components/
│   ├── ui/          # shadcn/ui primitives
│   ├── brand/       # Rotary brand assets
│   └── layout/      # Header, Footer, Nav
├── routes/          # TanStack Router pages
├── lib/             # Utilities, hooks, i18n
├── data/            # Static data (clubs, members)
└── styles.css       # Design tokens & base styles
```

## Key User Flows

1. **Search**: Home → Search query → Results → Profile → Contact
2. **Register**: Login → Registration questionnaire (4 steps) → Home
3. **Browse**: Home → Network → Filter by category → Profile
4. **Save**: Profile → Save contact → Saved page

## Performance Guidelines

- Lazy load below-fold content
- Optimize images (use responsive srcset)
- Minimize JavaScript bundle
- Use CSS transitions over JS animations when possible
- Respect `prefers-reduced-motion`

## Testing Checklist

Before shipping any UI change:
- [ ] Desktop viewport (1280px+)
- [ ] Tablet viewport (768px)
- [ ] Mobile viewport (375px)
- [ ] Hebrew RTL layout
- [ ] English LTR layout
- [ ] Dark mode (if implemented)
- [ ] Keyboard navigation
- [ ] Focus states visible
- [ ] Loading states
- [ ] Empty states
- [ ] Error states

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run preview  # Preview production build
npm run lint     # ESLint
npm run format   # Prettier
```

## MCP Servers Available

- **Playwright**: Browser automation for visual testing
- **Context7**: Technical documentation access

## Quality Standards

Every page should be evaluated on:
1. Visual sophistication (professional, not generic)
2. Brand consistency (Rotary identity)
3. Typography hierarchy
4. Layout balance
5. Responsive behavior
6. Interaction quality
7. Accessibility
8. Performance
9. Component reusability
10. Production readiness

---

**Remember**: This app should feel like having the entire Rotary Israel community in your contacts — elegant, professional, and genuinely useful.
