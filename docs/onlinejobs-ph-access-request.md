# OnlineJobs.ph — request for §7.4 permission

## Why this document exists

Craftiv's Job Hunter helps Filipino remote workers score their resume against a
job advert and tailor it before applying. OnlineJobs.ph is where most of that
audience actually looks for work, so it is the source users ask for first.

Their Terms of Use close the automated route unless they open it:

> **§7.4** "You are only permitted to use the Service personally and agree to do
> so without the use of any automated means including but not limited to the use
> of robotic tools **except where permission has been expressly granted by
> OnlineJobs**."

Related clauses worth having in front of you before any conversation:

- **§7.1** grants use "solely for your own internal business purposes".
- **§7.3** forbids making the Service available to third parties, and forbids
  accessing it to "build a competitive product or service".
- **§4.6** one account per person, no sharing or renting accounts.

There is no public API, no RSS feed and no partner XML feed. `robots.txt`
declares `Crawl-delay: 5` and disallows only `/min/` and `/jobseekers_pictures/`
— but robots.txt is not a licence, and the terms govern. They also appear to
fingerprint non-browser clients: `/llms.txt` is listed as *Allowed* in
robots.txt yet returns HTTP 403 to a non-browser request.

## What Craftiv does today, without permission

Nothing that needs any. Two paths, both driven by the user:

1. **Paste** — the user copies a job description into Craftiv.
2. **Clipper bookmarklet** — runs in the user's own browser, on a page they
   opened themselves, and hands the job to Craftiv by navigation. No Craftiv
   server ever contacts OnlineJobs.ph.

A URL is parsed for its posting id only, as a string, with no request made — so
a job can be deduplicated and linked back to without fetching anything.

Server-side scraping exists in the codebase behind `ONLINEJOBS_SCRAPE_ENABLED`,
**off by default**. It should stay off until this request is answered.

## The pitch

The argument is that Craftiv sends OnlineJobs.ph better-prepared applicants,
which is what employers on their platform are paying for.

- Craftiv users arrive at a posting having already checked their resume against
  it, so employers see fewer scattergun applications.
- Every job links back to the OnlineJobs.ph posting; applications are always
  completed on their site. Craftiv never accepts an application, never proxies
  one, and never asks for an OnlineJobs.ph login.
- Craftiv is a resume tool, not a job board. It does not list jobs publicly, does
  not surface one user's clipped posting to another, and does not sell job data.
  That is the §7.3 "competitive product" concern addressed directly.
- Attribution is already built in: every job from a source carries that source's
  name in the UI.

## What to ask for

In order of preference:

1. **A jobs API or feed**, even a rate-limited one, for postings their employers
   have already chosen to publish publicly.
2. **Written §7.4 permission** to fetch public job pages on a user's explicit
   request, at a stated rate, with an identifying User-Agent.
3. **An affiliate or partner arrangement** — if they want the relationship to be
   commercial, that is a better outcome than a grey one.

If the answer is no, that is a clear answer. The paste and clipper paths keep
working, and the scraping flag stays off.

## Draft email

> **Subject:** API or permitted access for a resume tool that sends you prepared applicants
>
> Hello,
>
> I run Craftiv, a resume and cover-letter tool used largely by Filipino remote
> workers. Our users repeatedly ask us to work with their OnlineJobs.ph job
> search, and I would rather ask you than guess.
>
> Today we do this entirely user-side: someone pastes a job description, or uses
> a browser bookmarklet that reads the page they already have open. Our servers
> never contact your site. Every job links back to your posting and every
> application is completed on OnlineJobs.ph.
>
> I am writing because §7.4 of your terms reserves automated access unless you
> grant it expressly, and I would like to ask whether you would consider:
>
> 1. a jobs API or feed for postings your employers already publish publicly, or
> 2. written permission to fetch public job pages on a user's explicit request,
>    at whatever rate and with whatever identifying User-Agent you specify, or
> 3. a partner or affiliate arrangement, if you would prefer this to be
>    commercial.
>
> To be clear about what we are not: we are not a job board. We do not list your
> jobs publicly, we do not show one user's saved posting to another, and we do
> not resell job data. Our interest is that our users apply to your postings
> with a resume that actually matches them.
>
> If the answer is no, that is genuinely fine and we will carry on as we are.
>
> Happy to talk on a call, and happy to agree to any rate limit or attribution
> you would want.
>
> Thanks for your time,
> [name] — [email] — https://craftiv.app

## If permission is granted

The adapter is already built for it. In `lib/job-sources/onlinejobs-ph.ts`:

- Set `ONLINEJOBS_SCRAPE_ENABLED=true`.
- Set `crawlDelaySeconds` to whatever rate they specify (currently 5, from their
  robots.txt).
- Update `CRAWLER_USER_AGENT` in `lib/job-sources/http.ts` if they want a
  particular identifier.
- Record the permission — who granted it, when, and on what terms — in this
  file, so the next person to read the code knows the flag is legitimate.

`lib/job-sources/registry.test.ts` asserts the source is not pollable by
default. That test stays; it protects the default, not the decision.
