---
name: CineVote
colors:
  surface: '#121414'
  surface-dim: '#121414'
  surface-bright: '#38393a'
  surface-container-lowest: '#0c0f0f'
  surface-container-low: '#1a1c1c'
  surface-container: '#1e2020'
  surface-container-high: '#282a2b'
  surface-container-highest: '#333535'
  on-surface: '#e2e2e2'
  on-surface-variant: '#e9bcb6'
  inverse-surface: '#e2e2e2'
  inverse-on-surface: '#2f3131'
  outline: '#af8782'
  outline-variant: '#5e3f3b'
  surface-tint: '#ffb4aa'
  primary: '#ffb4aa'
  on-primary: '#690003'
  primary-container: '#e50914'
  on-primary-container: '#fff7f6'
  inverse-primary: '#c0000c'
  secondary: '#c8c6c8'
  on-secondary: '#313032'
  secondary-container: '#474649'
  on-secondary-container: '#b7b4b7'
  tertiary: '#c8c6c8'
  on-tertiary: '#303032'
  tertiary-container: '#737274'
  on-tertiary-container: '#fcf8fb'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffdad5'
  primary-fixed-dim: '#ffb4aa'
  on-primary-fixed: '#410001'
  on-primary-fixed-variant: '#930007'
  secondary-fixed: '#e5e1e4'
  secondary-fixed-dim: '#c8c6c8'
  on-secondary-fixed: '#1c1b1d'
  on-secondary-fixed-variant: '#474649'
  tertiary-fixed: '#e5e1e4'
  tertiary-fixed-dim: '#c8c6c8'
  on-tertiary-fixed: '#1b1b1d'
  on-tertiary-fixed-variant: '#474649'
  background: '#121414'
  on-background: '#e2e2e2'
  surface-variant: '#333535'
typography:
  display-lg:
    fontFamily: Anton
    fontSize: 64px
    fontWeight: '400'
    lineHeight: '1.1'
    letterSpacing: 0.02em
  headline-lg:
    fontFamily: Anton
    fontSize: 40px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Anton
    fontSize: 32px
    fontWeight: '400'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Anton
    fontSize: 24px
    fontWeight: '400'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  container-margin: 20px
  gutter: 16px
---

## Brand & Style
The brand personality is intense, cinematic, and authoritative, designed to evoke the high-stakes excitement of a film premiere. The design system targets a passionate audience of cinephiles and digital natives who value speed, visual impact, and premium quality. 

The aesthetic is a fusion of **Glassmorphism** and **High-Contrast Bold** styles. It utilizes deep blacks to create infinite depth, allowing vibrant red accents to function as "neon" light sources within a dark environment. Visuals should feel "heavy" and tactile, employing subtle film-grain textures to break digital sterility and provide a grit that feels authentic to the medium of cinema.

## Colors
This design system is strictly dark-mode by default to maintain the "lights out" experience of a theater.

- **Primary Red (#E50914):** Used sparingly but aggressively for high-priority CTAs, focus states, and branding. It represents energy and action.
- **Deep Black (#000000):** The foundational void. Used for the main background to maximize OLED contrast.
- **Card Black (#09090B):** The base for glassmorphic elements. When combined with a 40-60% opacity and a backdrop blur, it creates a sense of floating layers.
- **Elevated Black (#111113):** Used for nested elements or tertiary surfaces like input fields and sidebars.
- **Typography:** Primary text uses **#FAFAFA** for maximum legibility against dark backgrounds. Secondary text (**#A1A1AA**) and Muted text (**#71717A**) provide hierarchy without competing for attention.

## Typography
The typography strategy relies on the tension between the aggressive, condensed impact of **Anton** and the technical precision of **Geist**.

**Headlines** should always use Anton. They are treated like movie posters: all-caps, tight leading, and slight letter-spacing to emphasize power. For mobile, headline sizes scale down to ensure they don't break across too many lines.

**Body & Technical Text** uses Geist. Its developer-centric, minimal aesthetic provides a futuristic "HUD" feel that balances the loud headlines. High line-heights are maintained for readability in low-light environments.

## Layout & Spacing
The layout follows a **fluid grid** model optimized for high-impact visual consumption. On mobile, the system uses a 4-column grid with generous 20px margins to ensure elements don't feel cramped. Desktop transitions to a 12-column grid with a maximum content width of 1440px.

Spacing is aggressive; large vertical gaps (LG/XL) are used between major content sections to allow the dark background and grain textures to "breathe." Gutters are kept tight (16px) to maintain the dense, information-rich feel of streaming interfaces.

## Elevation & Depth
Depth is created through **Glassmorphism** rather than traditional shadows. 

1.  **Base Layer:** Solid #000000 with a subtle 5% grain texture overlay.
2.  **Surface Layer:** #09090B with 70% opacity and a 20px backdrop blur.
3.  **Accent Depth:** Surfaces should feature a 1px inner-border (stroke) using the Primary Red at 20% opacity. This "trace-line" effect mimics futuristic interfaces.
4.  **Active States:** Elements in focus or active states emit a soft, Primary Red glow (`box-shadow: 0 0 15px rgba(229, 9, 20, 0.4)`).

## Shapes
The shape language is sharp and industrial. While most elements use a "Soft" (0.25rem) radius to avoid looking dated, the overall feel remains geometric. 

- **Primary Buttons:** Pill-shaped (rounded-xl) to provide a comfortable, touch-friendly target that stands out against the rectangular grid.
- **Cards & Inputs:** Soft (rounded-md) to maintain a structured, modern alignment.
- **Badges/Chips:** Sharp (0px) or slightly soft to mimic ticket stubs and technical metadata.

## Components

- **Buttons:** Large, high-contrast blocks. The primary button is solid Primary Red with white all-caps text. The secondary button is a "ghost" style with a 2px white border and a subtle red hover-glow.
- **Glass Cards:** Used for film thumbnails and voting cards. They feature a 1px border (#FAFAFA at 10% opacity) and a transition to a Primary Red border on hover/focus.
- **Progress Bars:** Thin, high-intensity red lines. For voting tallies, the "empty" track should be #111113.
- **Input Fields:** Dark background (#111113) with no bottom border, but a visible 1px left-accent line in Primary Red when active.
- **Navigation:** A bottom-fixed mobile bar with high-blur glassmorphism. Icons should be minimal line-art that glows slightly when selected.
- **Film Grain Overlay:** A global `fixed` div with a noise texture at 3% opacity to give the entire UI a cinematic, tactile finish.