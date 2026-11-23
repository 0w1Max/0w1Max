# Voqelis — Self-hosted AI Assistant & Telegram Mini App

**Independent project · Active development · Private source code**

Voqelis is a self-hosted AI-powered productivity platform with a Telegram assistant and **Voqelis Studio**, a React/TypeScript Telegram Mini App. Together, they demonstrate speech processing, web development, backend architecture, and test automation.

## Voqelis — Voice AI Assistant

A Telegram assistant for Russian-language voice input, notes, intelligent planning, and generated documents.

**Backend:** `Python` · `aiogram 3` · `asyncio` · `SQLite` · `HTTPX`  
**AI / Speech:** `GigaAM RNNT INT8` · `ONNX Runtime` · `Silero VAD` · `RUPunct`  
**LLM integrations:** `Groq API` · `Google Gemini API` · `Cloudflare Workers AI`  
**DevOps / Testing:** `Ubuntu Linux` · `systemd` · `GitHub Actions` · `pytest` · `Ruff`

**Engineering highlights**

- Local CPU-optimized speech recognition using INT8 inference.
- Modular asynchronous backend separating Telegram adapters, business logic, and persistence.
- Multi-provider LLM routing with fallback handling.
- Deterministic planning with conflict checks and action confirmation.
- Transactional storage, access controls, and resource-aware processing.

## Voqelis Studio — Telegram Mini App

A responsive React and TypeScript application inside Telegram for customizable workflows, structured records, and document handling.

**Frontend:** `React 19` · `TypeScript` · `Vite` · `Telegram WebApp SDK`  
**Backend:** `Python` · `FastAPI` · `REST API` · `SQLite`  
**Document preview:** `PDF.js` · `docx-preview` · `DOCX/PDF export`  
**Testing:** `Playwright` · `pytest` · `Ruff`

**Engineering highlights**

- Responsive interfaces for Telegram on mobile and desktop.
- Versioned custom workflow definitions, **resumable drafts**, editing, and record history.
- Telegram signed-data authentication, per-user isolation, and safeguards against repeated submissions.
- DOCX/PDF preview, export, authorized downloads, and Telegram delivery.
- Automated backend and browser tests.

## Status

Both parts are under active development. Voqelis operates as a self-hosted service; Studio is developed and validated as a separate pilot web application. This page summarizes selected engineering work without presenting all planned features as completed. The source repositories remain private.
