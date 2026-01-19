GhostWireAI is a local-first cybersecurity tutor built with [Next.js](https://nextjs.org).

## Getting Started

### 1) Install dependencies

```bash
npm install
```

### 2) Install and run Ollama (free local AI)

1. Download and install Ollama: https://ollama.com
2. Start Ollama (it runs locally on `http://localhost:11434`).
3. Pull a model (example):

```bash
ollama pull llama3.1:8b
```

You can change the model by setting `OLLAMA_MODEL` in your environment.

### 3) Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables (optional)

- `OLLAMA_URL` (default: `http://localhost:11434`)
- `OLLAMA_MODEL` (default: `llama3.1:8b`)

## Notes

- This app only calls your local Ollama instance. No cloud calls.
- If you see a connection error, make sure Ollama is running.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
