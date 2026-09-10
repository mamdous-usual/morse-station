# Morse Station

A two-way Morse code translator built with React and Vite. Type text and get Morse code, type Morse code and get text back — both panels stay in sync as you type. Includes an audible playback of the signal and a built-in cheat sheet.

## Features

- **Text ⇄ Morse, live** — edit either panel and the other updates instantly.
- **Play signal** — hear the Morse code as actual tones, timed to standard dot/dash/gap ratios, with a lamp indicator that flashes in sync.
- **Cheat sheet** — a slide-in reference panel covering letters, numbers, and punctuation.
- **Copy buttons** for both text and Morse output.
- Supports the full standard punctuation set (`. , ? ' ! / ( ) & : ; = + - _ " $ @`), not just letters and numbers.

## Tech stack

- [React 18](https://react.dev/)
- [Vite](https://vitejs.dev/) — dev server and build tool
- [lucide-react](https://lucide.dev/) — icons
- Plain CSS (no framework) for styling

## Running locally

```bash
npm install
npm run dev
```

This starts a local dev server (Vite will print the URL, typically `http://localhost:5173`).

To build a production bundle:

```bash
npm run build
npm run preview   # preview the production build locally
```

## Project structure

```
morse-station/
├── index.html          # HTML entry point
├── package.json
├── vite.config.js
├── src/
│   ├── main.jsx         # React entry point
│   ├── App.jsx          # Morse Station component (all app logic + UI)
│   └── index.css        # Minimal global reset
└── README.md
```

## How the Morse conversion works

- Encoding uppercases the input, maps each character to its Morse code, joins letters within a word with a single space, and joins words with `" / "`.
- Decoding does the reverse: splits on `" / "` for words, splits on whitespace for letters within a word, and looks up each code.
- Unrecognized characters are simply skipped rather than causing an error.

## License

MIT — do whatever you'd like with it.
