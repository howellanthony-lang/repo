# Composio + GitHub Automation Workflows

This document describes an automation-first operating system where GitHub is the source of truth and Composio-style authenticated integrations let AI agents take approved actions across tools.

## Core Architecture

```text
TikTok/comments/analytics
        ↓
Content + customer insight inbox
        ↓
AI triage agent
        ↓
GitHub issues and project board
        ↓
Human approval
        ↓
Composio-connected actions: email, docs, scheduler, CRM, support, analytics
        ↓
Weekly report and next sprint
```

## GitHub Repository Structure

```text
automated-fitness-business/
  content/
    30-day-content-calendar.csv
    tiktok-launch-playbook.md
  products/
    7-day-strength-reset/
    beginner-barbell-blueprint/
  automations/
    composio-github-workflows.md
  prompts/
    automation-agent-prompts.md
  templates/
    product-drop-checklist.md
    kpi-dashboard.csv
```

## Labels for GitHub Issues

| Label | Purpose |
| --- | --- |
| `content:idea` | Raw TikTok hook or concept |
| `content:script-ready` | Script ready for filming |
| `content:posted` | Video has gone live |
| `product:drop` | Launch task for a paid/free product |
| `customer:insight` | Customer comment, objection, or testimonial |
| `support:needs-human` | Sensitive support issue requiring manual handling |
| `automation:bug` | Broken workflow, missing tag, failed email, failed delivery |
| `analytics:review` | Weekly metrics task |

## Workflow 1: TikTok Comment to Content Idea

**Trigger:** New high-signal TikTok comment, DM theme, or repeated objection is added to the content inbox.

**Agent actions:**

1. Summarise the customer problem in one sentence.
2. Create a GitHub issue labelled `content:idea` and `customer:insight`.
3. Draft three video hooks.
4. Draft one 30-second script.
5. Suggest the most relevant product CTA.

**Human checkpoint:** Approve the angle, film the video, then update the issue status.

## Workflow 2: Content Batch Generator

**Trigger:** Weekly content planning issue is created.

**Agent actions:**

1. Read the content calendar and recent winning topics.
2. Generate 10 hooks across the six content pillars.
3. Generate scripts in a consistent format: hook, problem, demo, cue, CTA.
4. Create GitHub issues for each approved script.
5. Add filming notes and b-roll suggestions.

**Human checkpoint:** Pick the strongest scripts and record them.

## Workflow 3: Posted Video Repurposer

**Trigger:** Issue moved to `content:posted`.

**Agent actions:**

1. Draft one email newsletter from the video.
2. Draft one carousel outline.
3. Draft one short blog/SEO post.
4. Draft three follow-up TikTok hooks from comments or likely objections.
5. Update the content calendar with the post URL, CTA, and next action.

**Human checkpoint:** Approve copy before scheduling anywhere public.

## Workflow 4: Lead Magnet Delivery

**Trigger:** New subscriber joins with tag `strength-reset`.

**Automated actions:**

1. Send the lead magnet email.
2. Add subscriber to the welcome sequence.
3. Tag source as TikTok if link includes UTM source.
4. Create a dashboard row with signup date and source.
5. If no email open within 48 hours, send a resend subject line test.

**Human checkpoint:** Review conversion and unsubscribe trends weekly.

## Workflow 5: Product Sale Fulfilment

**Trigger:** Checkout purchase completed.

**Automated actions:**

1. Deliver the digital product download.
2. Tag buyer by product and source.
3. Send onboarding email with how to use the plan.
4. Create a testimonial request 10 days later.
5. Add buyer to upgrade sequence for the core plan or club.
6. Update KPI dashboard.

**Human checkpoint:** Check refund requests, support issues, and customer feedback.

## Workflow 6: Support Triage

**Trigger:** New support email or form submission.

**Agent actions:**

1. Classify as billing, access, exercise clarification, refund, testimonial, or risk/safety.
2. Draft a response using the FAQ and policy.
3. Create a GitHub issue for product bugs or repeated questions.
4. Escalate injury, medical, refund dispute, or angry customer messages with `support:needs-human`.

**Human checkpoint:** Send or edit the reply.

## Workflow 7: Weekly Analytics Review

**Trigger:** Every Monday morning.

**Agent actions:**

1. Pull or ingest TikTok metrics, email metrics, checkout metrics, and content calendar status.
2. Identify top three hooks by watch time, saves, comments, and conversions.
3. Identify bottom three topics to stop or reframe.
4. Create next week's GitHub sprint: content ideas, offer tests, product improvements.
5. Produce a short founder report.

**Human checkpoint:** Pick experiments and approve the following week's sprint.

## Required Secrets and Access

Store these in the relevant platform, not in the repository:

- Composio API key
- GitHub token or GitHub App access
- Email platform API key
- Checkout platform API key/webhook secret
- Analytics export credentials
- TikTok scheduler credentials if using an approved scheduling tool

## Safety Rules for Agents

- Agents may draft public content, but must not publish without approval.
- Agents may draft exercise advice, but must avoid medical diagnosis and injury treatment.
- Agents may process customer data only for the workflow purpose.
- Agents must label uncertainty and create a human review task when context is missing.
- Agents must never store API keys, private customer data, or passwords in GitHub issues.
