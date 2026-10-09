# SOP: Conducting institute practice tests

This is the operating procedure for an institute (the vendor) that runs practice tests on 10tracker. It is written for institute admins, staff, and the students who sit the tests.

Platform mock tests on the public site are a separate product. This procedure covers only the institute portal at:

`/practice-tests/<institute-slug>`

Example for IPS Academy Indore:

`/practice-tests/ips-academy-indore`

Share the full site address with that path. Students and staff sign in with Google.

---

## 1. Roles

| Role | What they do |
| --- | --- |
| Institute admin | Settings, who may enter, enrollment rules, members, questions, tests, results |
| Staff | Questions, tests, and results. They cannot change access settings or membership |
| Student | Opens published tests, enters an enrollment number, and sits the test |

An admin can promote a member to staff or admin, or demote them, from **Members**.

Revoking a member blocks them immediately and freezes any test they have in progress. That attempt is not scored.

---

## 2. One-time setup (admin)

Do this once for the institute, then review it before a large exam.

### 2.1 Sign in

1. Open `/practice-tests/<institute-slug>`.
2. Sign in with Google.
3. Open **Admin** (or go to `/practice-tests/<institute-slug>/admin`).

A new 10tracker account is asked to complete a profile (name, country, exam, and terms) before the rest of the site opens. Students who arrive from the IPS Academy portal link have **General Aptitude** pre-selected. They can change it before saving.

### 2.2 Decide who can enter

Go to **Settings**.

**Access mode**

- **Domain + allowlist** (usual): people with an allowed email domain can enter. Other people enter only if an admin added them or approved a request.
- **Domain only**: only the allowed email domain.
- **Allowlist only**: only people an admin added or approved.
- **Open to all**: platform super admin only. Do not use this for a normal institute exam.

**Other access switches**

- **Auto-enroll matching domain users**: a matching institute email becomes a student the first time they sign in. Leave this on unless you want to add every student by hand.
- **Allow subdomains**: turn on only if addresses like `cs.yourcollege.edu` should count.
- **Require Google Workspace hosted domain**: turn on only if students must use the institute Google Workspace account, not a personal Gmail that happens to look similar.
- **Let any @gmail.com account enter as a student, with no approval**: off by default. Turn it on only if personal Gmail accounts should walk in as students. Revoked accounts stay blocked. Turn it off again to stop new Gmail signups. People who already entered stay until you revoke them.

**Allowed email domains**

Add the institute domain (for example `ipsacademy.org`) and save. Remove a domain only when those addresses must lose automatic access.

Save settings before leaving the page.

### 2.3 Set enrollment-number rules

Still in **Settings**, under **Enrollment numbers**.

Students must enter this number before a test starts. It is shown on results. Set:

- Minimum and maximum length (1–64).
- **Digits only**, if the ID is numeric.
- **Required prefix**, if every number starts with the same letters or digits (for example `IPS`). The prefix must be digits when **Digits only** is on, and it cannot be longer than the maximum length.
- **Hint shown to students**, such as “Use the number on your ID card.”

The number must also be unique inside the institute. Two students cannot share one.

Defaults (1–64 characters, no prefix) accept almost any number. Tighten the rules before the exam, not after students have already saved numbers you no longer want.

Save settings.

### 2.4 Add people who are not on the institute domain

Go to **Members**.

- **Add member**: email, name, enrollment number (optional here), branch, batch, and role. The enrollment number, if you type one, must already match the rules.
- **Bulk CSV**: first row must include `email`. Optional columns: `name`, `roll_no`, `branch`, `batch`, `year`, `role`.
- **Requests**: approve or reject people who asked for access.
- **Fix enrollment**: on each member, edit the number and choose **Save number**. Use this when a student typed the wrong ID.
- **Revoke** / **Restore**: revoke to cut off access. Restore to allow them back.

---

## 3. Build the question bank (admin or staff)

Go to **Questions**.

| Tab | Use it for |
| --- | --- |
| Bank | Review or delete questions already stored for this institute |
| Add manually | One question: topic, category, subject, chapter, difficulty, question, options A–D, correct option, solution |
| CSV | Up to 500 rows. Header row required: `topic`, `category`, `subject`, `chapter`, `difficulty`, `year`, `question`, `options_A`, `options_B`, `options_C`, `options_D`, `correct_option`, `solution` |
| JSON | A JSON list of the same fields |
| Import from platform | Copy questions from the platform bank into this institute. Filter, select, then import |

Check a sample of imported questions in **Bank** before you attach them to a test. Deleting a question asks for confirmation. Do not delete a question that a live test still needs.

---

## 4. Create and publish a test (admin or staff)

Go to **Tests**.

### 4.1 Create a draft

Fill in:

- Title, description, and instructions students will read.
- Duration in minutes.
- Negative marking per wrong answer. Use `0` for no negative marking.
- Passing marks, if you want a pass mark recorded.
- Start and end time. Outside this window students see that the test is not open. Leave them empty only if the test should stay open.
- Max attempts (1–20).
- Shuffle questions and shuffle options, if the paper should differ per student.
- **Result release**
  - `instant`: the student sees the score as soon as they submit.
  - `after_window`: the score appears after the end time.
  - `manual`: the score stays hidden until an admin or staff member clicks **Release results**.
- **Fullscreen proctoring**: on for a supervised test.
- **Allowed switches**: how many times a student may leave fullscreen or switch away. The default is 4. The next switch after that number submits the test and marks it **cheated**. Answers already given are still scored.

Choose **Create draft**.

### 4.2 Attach questions

On the same page, open **Edit questions** for that draft.

1. Tick the questions from the bank.
2. Choose **Save question set**.

A test cannot be published with an empty question set.

You can change **Fullscreen proctoring** and **Allowed switches** on the test row after it is created. Save the switch limit by leaving the number field (click elsewhere). Do this before students start. Changing it during a live attempt does not rewrite attempts that already finished.

### 4.3 Publish

Choose **Publish**. Students only see published tests.

To stop a test later, choose **Archive**. **Back to draft** is available from archived.

---

## 5. Tell students how to sit the test

Send them:

1. The portal link: `/practice-tests/<institute-slug>`.
2. The sign-in rule: institute Google account, or Gmail only if you turned that on.
3. The enrollment rule: the exact format from Settings (length, digits, prefix) and that they need the number on their ID card.
4. The exam window: start and end time.
5. Device rule: a laptop or desktop with a current Chrome, Edge, or Firefox. The test must be able to go fullscreen. A phone browser often cannot lock fullscreen. In that case the test still runs, and switching away still counts.
6. Proctoring rule, if it is on: stay in fullscreen and on the test tab. Leaving fullscreen or switching tabs counts as one switch. More than the allowed number submits the paper and marks it cheated. The clock keeps running while they are looking at **Return to fullscreen**. Copy, cut, paste, and right-click are blocked.

They open **View tests**, then the test. They read the instructions, save their enrollment number, and choose **Start test**.

A student who leaves and comes back inside the time limit, with an attempt still in progress, chooses **Resume test**. That does not use a new attempt.

---

## 6. What the student does

1. Open the link and sign in with Google.
2. If the account is new, complete the 10tracker profile and accept the terms.
3. If the portal says access is restricted, use **Request access** and wait for an admin to approve it. Do not share answers while waiting. They cannot see the paper.
4. Open the published test.
5. Enter the enrollment number exactly as the institute defined it, plus a display name, and choose **Save enrollment**.
6. If fullscreen proctoring is on, choose **Enter fullscreen**.
7. Answer the questions. Answers save automatically about every 5 seconds. They can also move with the question numbers or the arrow keys.
8. Choose **Submit** before the timer ends, or the timer submits the paper when time is up.

After submit they land on their result. If release is not instant, they see that the institute has not released scores yet. A cheated attempt shows a clear note. The score is still the score of the answers they had given.

---

## 7. While the test is open (admin or staff)

- Keep one admin signed in to **Members** in case a student is locked out or typed the wrong enrollment number.
- Do not archive or unpublish the test until the window is over.
- Do not delete questions that are on the live paper.
- A revoked student cannot continue. Their in-progress attempt freezes and is not scored.

---

## 8. After the test (admin or staff)

Go to **Results**, then open the test.

You will see rank, enrollment number, name, email, score, time, status, and a **cheated** badge when the switch limit was crossed.

- If result release is `manual`, click **Release results** when you are ready for students to see scores. This cannot be used as a way to hide a cheated flag from your own admin view. Admins see the flag either way.
- Download the CSV for your own records. It includes rank, enrollment, name, email, score, status, whether the attempt was cheated, and how many focus switches were recorded.
- Ranks include cheated attempts, because those answers were still scored. Filter or footnote them in your own report if the institute does not want them in the merit list.

---

## 9. Checklist

**The day before**

- [ ] Allowed domain is correct.
- [ ] Gmail auto-entry is on only if you intend it.
- [ ] Enrollment rules match the real ID cards.
- [ ] Question bank was spot-checked.
- [ ] Draft has the right duration, window, attempts, negative marking, and question set.
- [ ] Fullscreen proctoring and the switch limit are set.
- [ ] Result release mode is the one you want.
- [ ] Test is **Published**.
- [ ] The student link was sent with the sign-in and enrollment instructions.

**During**

- [ ] An admin is available to approve requests and fix enrollment numbers.
- [ ] The test stays published until the end time.

**After**

- [ ] Results reviewed, including cheated attempts.
- [ ] Results released, if the mode is manual.
- [ ] CSV saved.
- [ ] Test archived if it should not be started again.

---

## 10. Common problems

| What the student sees | What to do |
| --- | --- |
| Access restricted | They are not on the domain and not on the member list. Approve the request, add them, or turn on Gmail entry if that is your policy. |
| Enrollment number rejected | It breaks the length, digits, prefix, or uniqueness rule. Fix it in **Members** or have them enter the correct number. |
| Test is outside its schedule window | Start or end time does not include “now.” Adjust the draft only if it is not yet published, or plan the next window. |
| Fullscreen will not start | Use a desktop browser. Phones often cannot lock fullscreen. Switching tabs still counts. |
| Paper submitted and marked cheated | They left fullscreen or the tab more times than **Allowed switches**. The score of answers already saved is kept. A new attempt is allowed only if max attempts is not used up. |
| Score not visible | Result release is `after_window` or `manual`. Wait for the end time, or click **Release results**. |
| Staff cannot open Settings or Members | That is expected. Those pages are for institute admins. |
