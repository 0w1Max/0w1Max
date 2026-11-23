# Therapist Website — Full-Stack Web Application

**Commercial project · Live website · Private source code**

A full-stack web application for a clinical psychologist, combining a responsive public website, blog, administrative dashboard, consultation requests, and Telegram integrations.

**[Visit live website](https://olgakuzhbatherapy.ru/)**

## Technology Stack

**Frontend:** `Next.js 16` · `React 19` · `TypeScript` · `Tailwind CSS 4` · `shadcn/ui`  
**Backend:** `Node.js 24` · `Next.js Route Handlers` · `REST API` · `Zod`  
**Data:** `PostgreSQL` · `Prisma ORM 7` · `Prisma Migrate`  
**Integrations:** `Telegram Bot API` · `Cloudflare Worker` · `Webhooks` · `Sharp`  
**Infrastructure:** `Docker` · `Docker Compose` · `Ubuntu Server` · `Nginx` · `HTTPS`  
**Quality:** `TypeScript` · `ESLint` · `Node.js Test Runner` · `HTTP smoke tests`

## Engineering Highlights

- Built responsive public pages, blog content, and an administrative interface with the Next.js App Router.
- Implemented server-side API routes, input validation, and PostgreSQL persistence using Prisma ORM.
- Integrated Telegram webhooks and a Cloudflare Worker gateway for content synchronization and administrative workflows.
- Built administrative authentication using signed sessions, secure cookies, and protected API endpoints.
- Added image processing and thumbnail generation with Sharp.
- Containerized and deployed the application to an Ubuntu VPS using Docker Compose, Nginx, and HTTPS.
- Set up separate TEST and Production environments and performed local automated checks and HTTP smoke tests.

## Current Status

The website is live, while selected deployment-hardening and security improvements remain in development and are **not** represented as production-complete.

The source code is private. This page is a portfolio overview and intentionally excludes deployment secrets, internal server details, and private configuration.
