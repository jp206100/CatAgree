---
title: "First look at CatAgree"
subtitle: "A facilitated workshop tool for content architecture, where participants contribute the content — not just sort it."
date: 2026-04-29
status: draft
---

I've been quietly working on a side project called **CatAgree**, and the designs are far enough along that I wanted to share a first look.

![CatAgree landing page](https://raw.githubusercontent.com/jp206100/CatAgree/4acaa7503c39333ba5693ec5b140239a4ce8ac62/public/blog-screenshots/hero-landing.png)

## The problem I kept running into

Anyone who has tried to run a card sort with a real team knows the shape of the pain. You schedule the session, half the room can't make it, and the other half is staring at a list of cards that *you* wrote — which means you've already decided what the conversation is about before it starts. The output is a tree that reflects your assumptions as much as theirs.

The tools that exist today are great at the mechanical part (drag a card, drop it in a bucket, generate a dendrogram) but they treat the participant as a sorter. In my experience, the most valuable signal isn't *how* a team sorts a fixed list — it's *what they think belongs on the list at all*, and which items they argue over.

CatAgree is my attempt to build the tool I wish I'd had.

## The concept

CatAgree is a facilitated, asynchronous card sorting workshop. An admin sets up a session, invites a group, and drives them through **four gated phases** on the team's own schedule. Each phase opens, collects input, and closes — either on a deadline the admin sets, or whenever the admin decides the group is ready to move on.

The shift is that **participants create the cards themselves** before anyone sorts anything. The categories come from the team too. By the time you're sorting, you're sorting a vocabulary the group already agreed is worth talking about.

The session ends with a validated content map — something you can hand to stakeholders without footnotes.

## What the admin sees

![CatAgree dashboard](https://raw.githubusercontent.com/jp206100/CatAgree/4acaa7503c39333ba5693ec5b140239a4ce8ac62/public/blog-screenshots/body-dashboard.png)

The dashboard is intentionally quiet. A workshop in CatAgree is a long-running thing — days or weeks, not minutes — so the home screen is built around *which session needs me right now*, not a feed of every participant action. You set up a workshop, invite people, and check in when a phase is ready to close.

## The cockpit

![CatAgree workshop cockpit](https://raw.githubusercontent.com/jp206100/CatAgree/4acaa7503c39333ba5693ec5b140239a4ce8ac62/public/blog-screenshots/body-workshop-cockpit.png)

This is the screen I've spent the most time on. I think of it as the **cockpit**: it's where the admin lives once a workshop is in flight. It surfaces the current phase, who has contributed, what's still outstanding, and a single primary action — usually "close this phase and advance the group."

The design goal was to make facilitation feel like piloting rather than monitoring. You shouldn't have to dig to know what to do next.

## Key differentiators

To put a finer point on what makes CatAgree different from the tools I've used before:

- **Participants contribute, they don't just sort.** Cards and categories come from the team. The tool is a structured way to surface and converge on a shared vocabulary, not a way to test one you've already written.
- **Async and phased by default.** Four gated phases run at the team's pace. No calendar Tetris. No "let's get everyone on a Zoom for ninety minutes."
- **The admin is a facilitator, not an observer.** Most card sorting tools are unmoderated. CatAgree gives the admin a cockpit and explicit control over when each phase opens and closes — because real workshops have a facilitator for a reason.
- **The output is a deliverable.** A workshop ends with an exportable content map ready for stakeholders, not a CSV of co-occurrence scores you still have to interpret.

## Where things stand

What you're seeing here are designs, not a shipped product. I'm building this out in the open and the next milestones are the participant-facing flows and the export. If any of this resonates — particularly if you've run content workshops and have opinions about where the existing tools fall short — I'd love to hear from you.

More soon.
