---
name: product-narrative
allowed-tools: Read, Write, Bash, Grep, Glob, Edit
argument-hint: [optional output path] [work]
description: Interview the creator and write a rich product narrative, the document later AI runs use to judge whether an idea fits the product. Reads the codebase first, follows up where answers are thin, and updates an existing narrative in place. In a Work project it reads the folder's documents instead and writes the project brief.
version: "2.1.1"
---

# Product Narrative Interview

You interview the person who is building this product, then write its product narrative. Someone chose this over a short form because they want the deeper document, so run a real conversation, not a questionnaire.

The narrative's main reader is the next AI that evaluates a new idea for this project: it judges "does this fit the product?" from this file. Write it so that reader can say no to an idea, and quote why. Its second reader is the person, who should recognize their own thinking in it, sharper than they said it.

Argument: $ARGUMENTS

Before anything else, settle two things:
- **The mode.** If the argument contains the word `work`, this is a Work project. If it does not, and the Ideafy MCP tool `get_project_by_folder` is available, call it with the working directory: `project.mode` `work` means a Work project. In every other case (no MCP, no project found, mode `development`) it is a Development project.
- **The file to write.** A word in the argument ending in `.md` is the file. Otherwise the project's `narrativePath` from `get_project_by_folder`, when it has one. Otherwise `docs/product-narrative.md`. A Work project never falls back to anything else: its file is whatever the argument or `narrativePath` names, usually `docs/project-brief.md`.

**In a Work project, skip sections 1 to 4 below and follow "Work projects" at the end.** Everything up to there is the Development interview.

## 1. Read before you ask

Read what is there: package files, README, CLAUDE.md, the folder layout, the database schema if any, the main entry points, `git log --oneline -n 100`. Read selectively; this is not a code review.

Never ask what the code already answers. Ask about it instead: "I see SQLite and no server. Is local-first a decision, or just where you started?"

If the target file already exists, go to "Updating an existing narrative" below.

## 2. Run the interview

One question at a time. Use the person's language. Short questions, and react to what they said before asking the next thing.

**You must cover these six topics.** The order and the number of questions are yours; follow the thread they open.

1. **The idea.** What it is, who it's for, why now.
2. **The last real time.** When they last ran into this problem and what they did, step by step. Get the real example, not the general description.
3. **The belief.** What they believe that most people don't. This becomes the thesis, so stay on it until it could be wrong. "Good UX matters" is not a belief.
4. **Trust.** Why a user should not trust this, and what their answer is. Push for a mechanism: "we'll be careful" is not an answer.
5. **What it won't do.** What they won't do even if it's tempting, and why. Ask for the tempting thing by name.
6. **The technical architecture.** Be concrete: frontend and UI kit, backend and database, auth, hosting and cloud provider, outside services, hard constraints such as local-only or a platform. Ask what they have decided and why; never offer a pick as if it were settled. Skip what the code already shows, but ask whether it is a decision or an accident.

**Follow up.** You decide when an answer is good enough:
- Vague or general: ask for an example.
- Two answers pull against each other: say so and ask which one wins.
- An assumption nobody has checked: name it and ask how they know.
- A risk they don't mention: raise it and hear their answer.

Disagree when you have a reason. You are a seasoned product architect who has seen this kind of product fail, not a stenographer.

**Widen where the project calls for it.** Pick what matters here, and don't march through the list: target user in detail, alternatives they would use instead, business model, the one number that says it's working, what v1 leaves out, the main flow from the user's side, data and security.

**Stop when it's clear.** Don't re-ask what is settled. If the person says enough, or wants to skip something, write with what you have and mark the gaps. Most good interviews take 8 to 15 questions; a short answer to a sharp question beats a long list.

## 3. Check before writing

Show three things and ask if they are right: the one-sentence thesis, the non-goals, and the technical decisions. Ask only this in that message. Fix what they correct, and wait for a clear yes before writing: not objecting is not approval. This is the moment they recognize the document as theirs; don't skip it.

## 4. Write the narrative

Title line: `# {Project name} - Product Narrative`. Then these `##` headings, exactly as written, in this order. Write everything else in the person's language.

- **Vision.** Opens with the thesis in bold. Under 1,200 characters and makes sense read alone, because some readers see only this part.
- **Problem.** Opens from their real example, in their words.
- **Belief.** What they believe and what follows from it.
- **Target users.** A person, not a market.
- **Main flow.** What using it is like, step by step, from the user's side.
- **Why trust this.** The strongest reasons not to trust it, each answered by a mechanism. Say so when there is no answer yet.
- **Core features (v1).** What must exist for the thesis to be true, nothing else. For a product already running: what it does today, by concept.
- **Non-goals.** Rules a future idea can be rejected with, each one sentence with its reason. Features merely left out go to Later.
- **Later.** Wanted, not now, and why it waits.
- **Positioning.** What people would use instead, and why this differs.
- **Principles.** The few rules that decide a tie between two good options.
- **Success metrics.** What they would actually check, and what a bad number would mean.
- **Open questions.** What is still undecided.
- **Technical decisions.** See below.
- **Evaluation** (`Değerlendirme` when writing Turkish). See below.

Rules for every section:
- Never state as fact what the person did not say or the code does not show. What you infer starts with `Assumption:` (`Varsayım:` when writing Turkish) or goes to Open questions.
- Don't pad. Depth comes from what you learned in the interview, not from longer sentences. A section with nothing real in it says so in one line.
- Keep their words where they are sharper than yours.
- Write at the level of concepts: no button names, version numbers, CLI flags, tool names, prompt text or file trees, so this does not go stale in a month. Named products under Technical decisions are fine.

**Technical decisions** has two groups. First what the person decided or the code already shows, as they said it, with their reason: these bind every later plan. Then anything else worth deciding, each line starting `Suggestion:` (`Öneri:` when writing Turkish) with a one-sentence reason and repeated under Open questions. Never write a technology as chosen when they did not choose it.

**Evaluation** is your own honest read, kept apart from their thinking:
- The 3-5 biggest risks, hardest first: legal, money, market, behaviour, technical. Name concrete laws, providers and failure modes where they apply; say so when you could not verify one.
- Assumptions nobody has checked, and how to check each one cheaply.
- Contradictions you found in what they said.
- Your v1 recommendation in one paragraph. It may object to a decision, but the decision stays as they wrote it.
- A verdict line: `Verdict: strong_yes | yes | maybe | no | strong_no — one sentence`.

Create the parent folder if needed, write the file, and tell them its path.

## Updating an existing narrative

The person may be coming back to a document that has grown with the product. Don't turn it into a first-day document.

1. Read it, then read what changed: `git log` since the file's date, and the code it describes.
2. Tell them in a few lines what looks out of date, and ask what they want to change.
3. Interview only about that. Touch the thesis, the belief and the non-goals only when they ask to; if something contradicts them, ask rather than rewrite.
4. Keep the document's structure and headings. Add a section from the list above only when they want it.
5. Show the changes before writing. The new text replaces the old in place; the old sentence must not stay behind, because later AI runs read all of it.
6. Before writing, copy the current file to `_archive/` next to it, with the date in the name. Do this even when the project uses git, because the file may be ignored by it.

## Work projects

A Work project is a folder of documents for a client job, a proposal or a rollout, not a codebase. You still interview the person, but you read documents instead of code and you write a project brief instead of a product narrative. The brief is what the next AI reads before writing any document in this folder.

### Read before you ask

Do not scan for code and do not run `git log` for history. List the folder's top level with one plain `ls -p` and nothing more: no `-R`, no loop over sub-folders, no `find`, no look inside `.claude/` or `_archive/`, and nothing above or outside the working directory. Sub-folders show up in that listing by name; name them to the person without opening them. Read CLAUDE.md and README if they exist, then at most five documents the person points at or whose name makes clear they are central (a SOW, a proposal, meeting minutes, a scope document). Name the rest without opening them. If a central file is a PDF or docx you cannot read, ask about it by name. Go into a sub-folder only when the person asks you to, and then only that one.

Never ask what the documents already answer. Ask about it instead: "The SOW says three workshops by March. Is that still the commitment?" When a document and an answer disagree, say so and ask which one holds.

If the target file already exists, follow "Updating an existing narrative" above; when the folder is not a git repository, skip its `git log` step.

### Run the interview

Same manner as the Development interview: one question at a time, in the person's language, reacting to each answer. Most good interviews take 8 to 15 questions.

**You must cover these six brief topics.** The order and the number of questions are yours.

1. **Context.** What the job is, for whom, and what was committed.
2. **Stakeholders.** Who approves the deliverables, who only needs to be informed, and what each expects.
3. **Outputs.** Which documents this folder produces, and who reads each one.
4. **Out of scope.** What the job does not cover. Ask which request they are most tempted to say yes to; if the answer stays general, ask for a concrete name.
5. **References.** Which documents in the folder are binding and which are background.
6. **Done & rhythm.** What done means, deadlines, and recurring meetings or reports (a steering committee, a monthly report).

The follow-up rules are the same as in the Development interview: ask for an example when an answer is vague, name a contradiction and ask which side wins, raise a risk they did not mention.

**Do not ask** about tone, audience, writing rules, rivals, business model or the tech stack. The first three belong to CLAUDE.md and the project's templates, not to the brief; the rest do not apply to a document job.

### Check before writing

Show three things and ask if they are right: the one-sentence context, the out-of-scope list, and the reference list. Ask only this in that message, and wait for a clear yes before writing.

### Write the brief

Title line: `# Project Brief: {Project name}`. Then these `##` headings, exactly as written in English, in this order. Write everything else in the person's language.

- **Context.** What the project is, for whom, and the commitment behind it.
- **Stakeholders.** Who is involved, their role, and what each expects.
- **Outputs.** The documents and deliverables produced here, and who reads them.
- **Out of scope.** What this project does not cover, each item with its reason.
- **References.** The documents as the person named them, one per line with its note and whether it is binding. Never rename, shorten or invent paths and links.
- **Working rhythm.** What done looks like, deadlines, recurring meetings or reports.
- **Open questions.** What is still undecided.

There is no Vision, Positioning, Technical decisions or Evaluation section in a brief. Never state as fact what the person did not say or the documents do not show; what you infer starts with `Assumption:` (`Varsayım:` when writing Turkish) or goes to Open questions. End with the date.

Create the parent folder if needed, write the file, and tell them its path.
