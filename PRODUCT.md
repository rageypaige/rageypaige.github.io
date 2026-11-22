# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Recruiters and design leads hiring senior product designers, especially at fintech and consumer mobile companies, in Vancouver or remote. They skim fast, often between other candidates, and decide in a few minutes whether to interview. Most arrive from a resume link or an application, on a laptop; some on a phone.

## Product Purpose

The portfolio of Paige Latimer, a senior product designer (Product Designer at Suncor from June 2023, Senior since November 2026, on the Petro-Canada app). It exists to get Paige interviews for senior product design roles. Success is a visitor who, after a few minutes:

- wants to interview her, because the work and its results are clear;
- understands how she thinks: finding problems in data, testing, iterating;
- remembers her as a person, not just another portfolio;
- trusts her craft: motion, type, accessibility and the details.

## Positioning

"I design for the way people actually think." A designer grounded in human psychology who finds the problem in the data before designing (passkeys came from spotting password resets in analytics, not from the roadmap), tests and iterates (the offer hub badge came from usability sessions), builds what she designs (prototypes in code with Claude Code; Duet Booth built solo in a day in Figma Make), and adds small moments of delight nobody asked for (the confetti when a member adds an offer was her idea).

## Operating Context

- Visitors usually come from a job application, a resume PDF or LinkedIn, and decide quickly; the first screen and the case study headers carry most of the weight.
- The resume (resume.html, printed to resume.pdf) is a one-page companion that must stay readable by applicant tracking systems.
- Interviewers use the site during portfolio reviews and may be given the password to the private case studies.

## Capabilities and Constraints

- Static HTML, CSS and a little JavaScript on GitHub Pages (custom domain paigelatimer.ca). No framework or build step.
- Petro-Canada and WestJet case studies are password protected: the full pages are encrypted (tools/lock_page.py, unlocked in the browser by js/lock.js), and each Petro-Canada page shows a public preview of its header and results (tools/previews/). Never put the passwords or private details in public files, commits or public previews.
- Private sources live in private/, which is gitignored and must never be committed.
- The WestJet partnership has not launched (early 2027); keep its specifics behind the password.
- Changes are reviewed in a private preview before they go live; nothing ships without Paige's approval.

## Brand Commitments

- Simplicity is the identity: a calm, restrained layout with generous space. Paige has said the simplicity is what makes the site special.
- Personal touches stay: cats visitors can feed, peppermint tea (oat milk & honey), 35mm film photography, the waving "actually think." and a warm, plain, specific voice. Copy should sound like a person, not like AI.
- The site is written in Canadian English.

## Evidence on Hand

All real, from Paige's own work. Use these; never invent others.

- Petro-Canada app: 2.4M users a year; $100M+ in sales through the app each year.
- Offer hub: 29M offers added Jan–Oct 2026, +179% on the same months of 2025, 1.1M members adding offers; validated in 10 moderated usability sessions.
- Passkeys: 20% of monthly active users set one up in the first week (launched October 2026).
- SuperPass: +176% in-app fuel-ups by fleet drivers, year over year.
- Car wash in the app: $19K in the first two weeks, about a third of the website's yearly car wash sales.
- Simply Benefits: member app downloads +163% after the redesign; sign-ups +20%.
- Duet Booth: winner, Figma Make-a-thon (Reimagining Iconic Interactions), March 2026, featured on Figma's blog.
- Absent: no testimonials or colleague quotes yet, no client logos. Do not fabricate any.

## Product Principles

1. Clarity in seconds: a busy hiring manager should see who Paige is, what she's done and the results without digging.
2. Show the thinking, not just the screens: problem, evidence, decision, result.
3. Real over impressive: only true numbers and claims, with private work kept private.
4. Personality in small doses: delight lives in details, never at the cost of simplicity or clarity.
5. Craft is the proof: the site itself should demonstrate the care Paige brings to products.

## Accessibility & Inclusion

Every animation respects prefers-reduced-motion; motion never hides content. Keep text contrast readable, including small grey labels, and keyboard focus visible. Screen readers get plain text where letters are split for animation.
