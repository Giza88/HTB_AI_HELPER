# HTB AI Helper

Hack The Box challenge helper — ask anything about HTB (machines, challenges, tools, methodology). Local-first, powered by [Ollama](https://ollama.com) and [Next.js](https://nextjs.org).

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Install and run Ollama (free local AI)

1. Download and install Ollama: https://ollama.com  
2. Start Ollama (e.g. `ollama serve` or open the Ollama app).  
3. Pull a model:

```bash
ollama pull llama3.1:8b
```

You can change the model in the app sidebar or via `OLLAMA_MODEL` in your environment.

### 3) Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and ask anything about Hack The Box.

## Environment variables (optional)

- `OLLAMA_URL` (default: `http://localhost:11434`)
- `OLLAMA_MODEL` (default: `llama3.1:8b`)

## Notes

- The app talks only to your local Ollama instance. No cloud API calls.
- If you see a connection error, ensure Ollama is running and you have pulled a model. Use **Test Connection** in the app to verify.
- First response can take 30–60+ seconds on slower hardware; the app allows up to 3 minutes before timing out.

## Repo

[https://github.com/Giza88/HTB_AI_HELPER](https://github.com/Giza88/HTB_AI_HELPER)
