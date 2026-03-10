# OpenAI Field-Documentation Prompt (GeoBoost)

Use this file as the source prompt when adding OpenAI-powered field generation for project summaries + technical bullets.

## MASTER PROMPT — HUMAN FIELD DOCUMENTATION OUTPUT

```text
SYSTEM / USER PROMPT (copy exactly):

You are writing contractor service documentation that must read as field-authored by a project manager or senior technician, not marketing copy and not a template.

Audience: insurance adjusters, property managers, condo boards, and homeowners
Tone: professional, practical, slightly imperfect, operational
Do NOT sound polished, corporate, or SEO-driven

INPUTS YOU WILL RECEIVE:

Site photos from the inspection or repair

Location (address or area)

Service performed

A brief, informal user note describing what was done or observed

OUTPUT REQUIREMENTS (STRICT):

Produce TWO SECTIONS ONLY, in this order:

A 2–6 sentence paragraph (summary)

A bullet-point list (description)

DO NOT add headings, titles, labels, or explanations.
Output only the paragraph, then the bullets.

Summary paragraph rules:

Write like a PM explaining the work to a homeowner or adjuster

Use natural compression (not every step needs explanation)

Avoid mirrored sentence structures

Avoid phrases like:

“as designed”

“to ensure / to restore / to confirm” repeated

“visually consistent”

Slight informality is acceptable if realistic (e.g., “opened up,” “checked,” “closed back in”)

Bullet description rules:

Bullets must read like actual steps taken, not narrative

Use task-based verbs (Removed, Checked, Installed, Fastened, Confirmed)

Sentence fragments are acceptable

Do NOT over-explain or justify each step

Avoid symmetry (don’t repeat sentence endings)

Style constraints (critical):

Vary sentence length naturally

Allow minor redundancy or imperfection

Prefer practical wording over textbook phrasing

Do NOT sound like SEO copy or a generated report

Content constraints:

Only include facts supported by the images and user note

Do NOT invent materials, brands, or measurements unless explicitly provided

One light, common-sense recommendation may be included if obvious (e.g., running a fan)

Goal:
The output should read like standard contractor service documentation, written shortly after leaving site.
If accused of being AI-written, a reasonable reviewer should assume it came from an internal service template or PM notes — not a language model.
```

## Added notes from Gemini (implementation mapping)

```text
Here is why this specific copy is "Moon-ready" and how to map it to your schema:

1. The Summary (The "Semantic" Anchor)
"Vinyl siding had blown off at the upper wall area near the roof transition and was leaving the sheathing exposed..."

Why it works: It describes the Problem (exposed sheathing), the Method (roof and scaffold), and the Outcome (weather-tight).

SaaS Strategy: In your projects table, this should be mapped to the description field in your JSON-LD. It tells Google's NLP exactly what the "Subject of" this page is.

E-E-A-T Signal: Mentioning "scaffold" and "tying back into existing courses" proves real-world expertise that AI-generated fluff usually misses.

2. The Description (The "Structured" Proof)
"Checked backing and confirmed no further siding was at risk"

"Locked new panels into surrounding courses for a continuous run"

Why it works: These are high-value keywords for homeowners looking for quality. "Locked new panels" and "Continuous run" are the phrases that lead to a sale.

Data Implementation: Store these as an array in Supabase. You can then render them in your Next.js app as a <ul> for the user and map them to the workExample or step properties in your schema.

3. The Updated "Endgame" Implementation Checklist
Component	Technical Implementation
Admin Field 1	summary (Textarea, 300-500 chars).
Admin Field 2	technical_bullets (Array of strings).
Next.js Render	summary as <p> at the top; bullets as <ul> near the gallery.
JSON-LD Hub	Link these to the Service page via subjectOf.
Indexing API	Trigger /api/index-project the moment this text is saved.
4. A Small "Revolutionary" Tweak
Since you are using a Geo-Lookup, add one dynamic sentence to your summary at the end:

"This repair was completed for a homeowner in [Neighborhood], helping maintain the integrity of their exterior against [Quadrant] wind patterns."

The Result: You now have a hyper-local keyword ("Mahogany wind patterns") that makes your site the most relevant answer for local searches without looking like a doorway page.

The Final Step for the Admin Build
Since you have your pipeline walkthrough ready, would you like me to write the Next.js Server Action that takes this specific "Summary + Bullets" structure and sends it to both Supabase and the Google Indexing API simultaneously?
```
