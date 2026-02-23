# Research → LinkedIn

An **agentic AI** app that lets you research a topic, get a structured summary and a LinkedIn post draft, edit it with your own input (and AI refinement), then save or publish to LinkedIn.

## Features

- **Search & research** – Enter any topic; the agent searches the web (when Tavily is configured) and synthesizes a research summary.
- **Draft** – Generates a LinkedIn-ready post from the research.
- **Your input** – Edit the draft manually and/or give feedback (e.g. “make it shorter”, “add a CTA”) and click “Refine with AI”.
- **Edit** – Full control in the text area; change anything before saving or publishing.
- **Save** – Save to browser (localStorage) or download as JSON.
- **Publish** – **One-click publish**: connect your LinkedIn account once, then click “Publish to LinkedIn” to post. Or copy to clipboard and paste in LinkedIn.

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
   - **LINKEDIN_CLIENT_ID** and **LINKEDIN_CLIENT_SECRET** and ***LINKEDIN_REDIRECT_URI*** – For one-click publish. Create an app at [LinkedIn Developers](https://www.linkedin.com/developers/apps), add the “Share on LinkedIn” product, and set the redirect URL to `https://your-domain/api/linkedin/callback` (e.g. `http://https://publish-to-linkedin.vercel.app/api/linkedin/callback`).

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

4. **Publish** – If LinkedIn is configured, click “Connect LinkedIn” once to authorize, then “Publish to LinkedIn” to post with one click. Otherwise use “Copy” and paste in LinkedIn.

## Stack

- Next.js 14 (App Router)
- OpenAI API (gpt-4o-mini)
- Optional: Tavily Search API
- Tailwind CSS

# Snapshots of working locally

<img width="1115" height="425" alt="image" src="https://github.com/user-attachments/assets/5ec477ff-5293-40aa-8557-5afbc91ff140" />


### Research Summary 

<img width="864" height="868" alt="image" src="https://github.com/user-attachments/assets/5c5ad09c-929a-4e77-a97e-4e4ff7f967d9" />


#### Edit your LinkedInPost 

<img width="779" height="504" alt="image" src="https://github.com/user-attachments/assets/da69cc05-d7a0-4686-8014-d237546aa9e9" />


#### Save you LinkedIn Post 

<img width="798" height="222" alt="image" src="https://github.com/user-attachments/assets/4098fcb7-1af7-4a2d-b725-1fe6578a3e75" />





