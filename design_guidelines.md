# SentinelOS Dashboard - Design Guidelines

## Design Approach

**Reference-Based Approach: Cyberpunk Terminal Fusion**
- Primary Inspiration: Fusion of terminal emulators (iTerm2, Hyper) + cyberpunk interfaces (Cyberpunk 2077 UI, Blade Runner 2049 holographics)
- Secondary References: Hacker aesthetics from Mr. Robot, Matrix digital rain effects, retro CRT monitors
- Innovation Layer: Electric glitch interactions, holographic data displays, animated ASCII art elements

**Core Principles:**
1. Terminal authenticity with futuristic enhancement
2. Every interaction creates electric visual feedback
3. Data presented as "code streams" rather than traditional cards
4. Retro-futuristic collision: 1980s CRT meets 2077 holographics

---

## Core Design Elements

### Typography System

**Font Families:**
- Primary: 'JetBrains Mono', 'Fira Code', 'IBM Plex Mono' (monospace for terminal authenticity)
- Accent: 'Orbitron' or 'Rajdhani' for headers (futuristic sans-serif)
- Data Display: 'Courier New' for raw blockchain data, transaction hashes

**Hierarchy:**
- H1 (Terminal Headers): 32px, font-weight 700, letter-spacing 0.05em, text-transform uppercase
- H2 (Section Labels): 24px, font-weight 600, glitch text-shadow effect
- Body (Command Text): 16px, font-weight 400, line-height 1.6
- Data (Metrics/Values): 14px, font-weight 500, tabular-nums for alignment
- Micro (Labels): 12px, font-weight 400, opacity 0.7

### Layout System

**Spacing Primitives:**
- Core units: Tailwind's 2, 4, 8, 16 (extreme consistency)
- Component padding: p-4 (small), p-8 (medium), p-16 (large sections)
- Grid gaps: gap-4 for tight layouts, gap-8 for breathing room
- Terminal borders: border-2 with double-line ASCII characters (`═`, `║`, `╔`, `╗`)

**Grid Structure:**
- Container: max-w-screen-2xl with px-8
- Dashboard Layout: Sidebar (w-64, fixed) + Main Content (flex-1)
- Agent Cards: grid-cols-1 md:grid-cols-2 xl:grid-cols-3 with gap-6
- Data Tables: Full-width with horizontal scroll on mobile

### Component Library

**Navigation:**
- Terminal-style sidebar with ASCII art logo at top
- Menu items as command prompts ("> deploy_agent", "> monitor", "> transactions")
- Active state: neon purple glow + electric spark animation
- Wallet connection: Floating "CONNECT WALLET" button with pulsing border

**Core UI Elements:**

1. **Agent Cards (Terminal Windows)**
   - Design as miniature terminal windows with title bars
   - Header: Agent name + status indicator (online: pulsing green dot, offline: red)
   - Body: Command-line output showing agent activities
   - Footer: Action buttons styled as terminal commands
   - Border: 2px neon purple glow with scanline animation overlay

2. **Data Displays**
   - SOL Balance: Large monospace numerals with "lamports" suffix
   - Transaction History: Table styled as terminal output (green text on dark)
   - Activity Logs: Scrolling console with timestamps, fade-in animation per line
   - Charts: Line graphs with holographic glow, green/purple gradient fills

3. **Forms & Inputs**
   - All inputs styled as command-line prompts with "> " prefix
   - Input backgrounds: Semi-transparent with border-purple-500/30
   - Focus state: Electric pulse animation around border
   - Labels: Floating above in terminal-green (complementing purple)

4. **Buttons**
   - Primary: Solid purple background with electric border animation on hover
   - Secondary: Outlined with glitch effect on click
   - Danger: Red terminal-style with warning symbols
   - All buttons: Add electric spark particles on click using absolute positioned elements

5. **Modals & Overlays**
   - Full-screen terminal takeover with CRT flicker on open
   - Header: ASCII art border with command prompt
   - Close: "ESC" key indicator or ":q" vim-style exit
   - Backdrop: Dark with scanline pattern overlay

**Status Indicators:**
- Success: Terminal-green text with checkmark ASCII (✓)
- Error: Red text with X ASCII (✗)
- Loading: Animated dots "..." with electric shimmer
- Processing: Spinning ASCII loader (⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏)

### Animation & Effects Strategy

**Electric Glitch Effects (On Every Click):**
- Button clicks trigger: 200ms RGB color split, 100ms shake transform, electric arc SVG overlay
- Card interactions: Horizontal glitch scan lines sweep on hover
- Input focus: Electric pulse radiating from edges (box-shadow animation)
- Page transitions: Brief static noise overlay (100ms)

**Terminal Authenticity:**
- Typing animation: Character-by-character reveal for agent responses (50ms per char)
- Cursor blink: Standard 530ms interval on active inputs
- Scanlines: Persistent horizontal lines scrolling top-to-bottom (slow, 3s loop)
- CRT Flicker: Subtle brightness pulse every 8-10 seconds

**Cyberpunk Enhancements:**
- Neon glow: Purple outline-glow on interactive elements (blur-md)
- Holographic shimmer: Gradient animation on data visualizations
- Digital particles: Small squares floating on background (absolute positioned, slow drift)
- Matrix rain: Optional easter egg on idle state

**Performance Notes:**
- Use CSS animations for scanlines/glitches (GPU accelerated)
- Limit particle count to 20-30 max
- Debounce electric effects to prevent overload on rapid clicks

---

## Page-Specific Layouts

### Dashboard (Main View)
- Top Bar: Wallet status + SOL balance + network indicator
- Left Sidebar: Navigation with terminal commands
- Main Grid: 3-column agent cards (active agents)
- Bottom Panel: Live activity feed (scrolling terminal output)
- Full-width stats bar: Total agents, total transactions, gas spent (as terminal readout)

### Agent Creation Modal
- Full-screen terminal overlay
- Form fields as command-line inputs with autocomplete suggestions
- Parameter sliders with ASCII bar graphs (████░░░░)
- Preview window showing agent configuration as JSON
- "DEPLOY" button with confirmation prompt in terminal style

### Transaction History
- Table designed as terminal `ls -la` output
- Columns: Timestamp, Agent, Action, Amount, Status, TX Hash
- Infinite scroll with loading indicator (terminal spinner)
- Expandable rows for transaction details (JSON viewer)

### Agent Detail View
- Split screen: Left = Terminal console showing live logs, Right = Controls + metrics
- Real-time typing animation for agent decision-making process
- Performance charts with holographic effects
- Quick actions as terminal command buttons

---

## Logo & Branding Integration

**Logo Usage:**
- Favicon: Direct use of provided logo
- Header: Animated logo with electric pulse (1.5s interval)
- Loading states: Spinning logo with glitch effect
- 404/Error pages: Glitched logo with error message in terminal

**Brand Color Extraction:**
- Primary Purple: #8B7FFF (from logo) - use for accents, glows, primary buttons
- Terminal Green: #00FF41 (classic hacker green) - use for success states, active text
- Electric Blue: #00D9FF - use for secondary accents, links
- Dark Base: #0A0E1A - primary background
- Darker Overlay: #050810 - sidebar, modals

---

## Accessibility & UX

- High contrast monospace text ensures readability despite dark theme
- Electric animations have `prefers-reduced-motion` fallbacks (static glow only)
- All terminal commands have hover tooltips explaining function
- Screen reader labels for all ASCII art elements
- Keyboard shortcuts: ESC to close modals, Ctrl+K for command palette

---

## Images

No traditional images required for this terminal interface. All visual interest comes from:
1. Animated logo (provided)
2. CSS-generated effects (scanlines, glitches, particles)
3. SVG electric arcs and holographic overlays
4. ASCII art decorative elements

**Hero Section:** Not applicable for dashboard - immediately shows functional interface (agent grid + terminal sidebar).