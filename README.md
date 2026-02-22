# Research → LinkedIn

An **agentic AI** app that lets you research a topic, get a structured summary and a LinkedIn post draft, edit it with your own input (and AI refinement), then save or publish to LinkedIn.

## Features

- **Search & research** – Enter any topic; the agent searches the web (when Tavily is configured) and synthesizes a research summary.
- **Draft** – Generates a LinkedIn-ready post from the research.
- **Your input** – Edit the draft manually and/or give feedback (e.g. “make it shorter”, “add a CTA”) and click “Refine with AI”.
- **Edit** – Full control in the text area; change anything before saving or publishing.
- **Save** – Save to browser (localStorage) or download as JSON.
- **Publish** – Copy to clipboard and open LinkedIn so you can paste and post (LinkedIn does not support pre-filled post text via URL).

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Environment variables**

   Copy the example env and add your keys:

   ```bash
   cp .env.local.example .env.local
   ```

   - **OPENAI_API_KEY** (required) – Used for research synthesis and draft/refine. Get one at [platform.openai.com](https://platform.openai.com).
   - **TAVILY_API_KEY** (optional) – For web search. Free tier at [tavily.com](https://tavily.com). Without it, the app uses the model’s built-in knowledge only.

3. **Run the app**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## How it works

1. **Research** – You enter a topic and click “Research”. The backend:
   - Optionally calls Tavily to search the web.
   - Uses OpenAI to turn the topic (and any search results) into a clear research summary.
   - Uses OpenAI again to turn that summary into a LinkedIn post draft.

2. **Refine** – You type feedback and click “Refine with AI”. The backend uses OpenAI to update the draft according to your instructions.

3. **Save** – “Save to browser” stores the current topic, research, and post in localStorage. “Download JSON” exports the same as a file.

4. **Publish** – “Copy for LinkedIn” copies the post text. “Open LinkedIn” opens the LinkedIn feed; paste the text into a new post there (LinkedIn does not allow pre-filling post content via URL).

## Stack

- Next.js 14 (App Router)
- OpenAI API (gpt-5-mini)
- Optional: Tavily Search API
- Tailwind CSS
