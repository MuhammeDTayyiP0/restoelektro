# ETİBOL POS — Design System & UI Policy

## 1. Anti-AI Design Rules
* NEVER use generic purple/indigo gradients, default Tailwind card patterns, or soft rounded generic UI components.
* Use an industrial, high-contrast POS aesthetic: deep charcoal base (`#090A0F`), subtle borders (`#1E2230`), and distinct functional accent colors.
* Functional Colors: Green for Free Tables, Red/Orange for Occupied/Pending, Amber for Payment.
* Typography: High legibility, crisp status badges, bold numbers for prices and table counts.

## 2. Token & Refactoring Rules
* Make targeted edits only. Do NOT rewrite entire codebases unnecessarily.
* Keep state logic (Zustand) and IPC handlers untouched; focus strictly on UI layout, CSS, accessibility, and micro-interactions using Framer Motion.