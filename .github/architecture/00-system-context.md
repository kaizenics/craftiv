# System Context

## Purpose

Craftiv is a resume builder platform where users create, optimize, and export job-ready resumes.

## Primary Actors

- End User: Creates, edits, and downloads resumes.
- Admin/Team (internal): Maintains templates, deployment, and platform reliability.

## External Systems

- Turso (libSQL): Persistent storage for users and resumes.
- Better Auth providers: Credential and social authentication flows.
- AI provider via OpenRouter/OpenAI-compatible client: Resume parsing and AI assistance.

## High-Level Boundaries

- Web Client (Next.js client components)
  - Interactive forms, template selection, upload flows, dashboard UI.
- Application Server (Next.js server components, route handlers, tRPC server)
  - Auth checks, business logic, resume parsing orchestration, API entry points.
- Data Layer (Drizzle + Turso)
  - Relational persistence for user accounts, sessions, and resume documents.

## Core User Journeys

1. User signs in.
2. User creates a resume from template or uploads an existing resume.
3. System parses and structures resume data.
4. User edits sections and finalizes output.
5. User exports final resume.

## Non-Goals (Current Scope)

- Multi-tenant enterprise controls.
- Advanced role-based access model beyond end-user auth.
- Full asynchronous job queue orchestration.
