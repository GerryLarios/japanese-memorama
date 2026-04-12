# 🇯🇵 Japanese Memorama

An interactive web app to learn Japanese vocabulary from the textbook **Minna no Nihongo**. Practice kanji, hiragana, romaji, and translations through a variety of games — playable on desktop and mobile.

## ✨ Features

- **6 game modes**: Quiz, Memorama (memory cards), Flashcards, Fill in the blank, Listening quiz, and Numbers
- **25 lessons** of vocabulary from Minna no Nihongo
- **Hiragana & Katakana** practice with seion, dakuon, and youon support
- **Counters** (counters for time, dates, quantities, etc.)
- Each word includes **kanji, hiragana, romaji, Spanish, and English**
- **Text-to-speech** to hear Japanese pronunciation
- **Vocabulary preview** before starting a game
- Fully **responsive** — works on mobile and desktop
- Supports **JP→ES**, **ES→JP**, and other translation directions

## 🎮 Games

| Game | Description |
| :--- | :---------- |
| **Quiz** | Multiple-choice questions on vocabulary or kana |
| **Memorama** | Match Japanese cards with their translations |
| **Flashcards** | Flip cards to study at your own pace |
| **Fill in the blank** | Type the missing word |
| **Listening Quiz** | Hear a word and choose the correct answer |
| **Numbers** | Practice counters and Japanese number systems |

## 🚀 Getting Started

```sh
npm install
npm run dev
```

Open [http://localhost:4321](http://localhost:4321) in your browser.

## 🧞 Commands

| Command           | Action                                       |
| :---------------- | :------------------------------------------- |
| `npm install`     | Install dependencies                         |
| `npm run dev`     | Start dev server at `localhost:4321`         |
| `npm run build`   | Build for production to `./dist/`            |
| `npm run preview` | Preview the production build locally         |

## 🗂 Project Structure

```text
src/
├── components/
│   ├── games/        # Game components (Quiz, Memorama, Flashcards, etc.)
│   └── shared/       # Shared UI (GameLobby, ResultScreen, etc.)
├── data/
│   ├── vocabulary/   # Per-lesson vocabulary JSON files (lessons 1–25)
│   ├── counters/     # Japanese counter data
│   ├── kana.ts       # Hiragana & Katakana data
│   └── numbers.ts    # Number/counter data
└── pages/
    ├── index.astro   # Home page
    └── games/        # Game pages
```

## 📚 Data Source

Vocabulary is based on **Minna no Nihongo (みんなの日本語)**, a widely-used Japanese language textbook series.
