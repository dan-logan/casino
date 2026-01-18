# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React implementation of the Casino card game (1 human player vs 3 AI opponents). Built with Vite + React + Tailwind CSS and auto-deploys to GitHub Pages.

## Commands

```bash
npm install     # Install dependencies
npm run dev     # Start dev server
npm run build   # Build for production (outputs to dist/)
npm run preview # Preview production build locally
```

## Deployment

Pushes to `main` trigger GitHub Actions (`.github/workflows/deploy.yml`) which builds and deploys to GitHub Pages automatically.

## Architecture

The game logic is in `src/CasinoGame.jsx` (~1600 lines) containing:

- **Card utilities**: `createDeck()`, `shuffleDeck()`, `getCardValue()`, `isFaceCard()`
- **UI Components**: `Card`, `Deck`, `Build`, `PlayerHand`, `FlyingCard`, `AnimatedCard`
- **Main game component**: `CasinoGame` with all game state and logic

### Game Flow States
- `setup`: Initial start screen
- `playing`: Active gameplay with dealing and turn-taking
- `roundEnd`: Score display between rounds
- `gameOver`: Final scores when a player reaches target (21 points)

### Key Game Mechanics
- Players capture table cards by matching values or summing combinations
- Face cards (J, Q, K) can only capture matching face cards
- "Builds" allow combining cards to capture on a future turn
- "Trailing" places a card on the table without capturing
- Scoring: most cards (3 pts), most spades (1 pt), 2 of spades (1 pt), 10 of diamonds (2 pts), each ace (1 pt), sweeps (1 pt each)

### AI Behavior
AI logic is in `aiTurn()` callback. AI prioritizes: capturing own builds > face card captures > numeric captures > building > trailing.

### Animation System
Card animations use refs (`deckRef`, `playerRefs`, `tableCardRefs`, `buildRefs`) to track element positions and animate cards flying between locations during deals and captures.
