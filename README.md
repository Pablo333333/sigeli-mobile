# Talento — Mobile app

Field app for **Talento**, the local-employment system for communities in a mining influence area. This is the interface of the **comunero**: build a CV, see jobs, apply, follow the hiring steps, talk to the assistant in Spanish or Quechua, and file a complaint. The **community board** uses the same app to watch the territory and to apply on behalf of a neighbor who is not doing it themselves.

Company staff, admins, and auditors do their daily work on the web console. A comunero who opens the website is turned away.

Stack: Expo (React Native) with Expo Router. The app calls the Talento API.

## What a comunero does here

The tabs are Inicio, Trabajos, Mi Perfil, Postulaciones, Chat, and Más. Items the role cannot use are hidden.

**Inicio.** Summary of the person's situation: open offers nearby, applications in progress, and points. The board sees this tab as a monitoring panel instead of a personal home.

**Trabajos.** Vacancies that are still open. Each card is a labor offer: company, sector, salary, labor type, how many days are left before it closes, and how many seats remain. An offer past its closing date disappears from this list.

**Mi Perfil (CV).** The comunero's employment identity.

- DNI (8 digits, unique in the system) and age 18 or older
- specialty, mining experience, and general experience
- education, skills, and a short professional summary
- photos and a presentation video

The board does not have this tab. It can read CVs through the API but does not keep a CV of its own.

**Postulaciones.** The status of every application. The path is fixed:

```
CV submitted
  → Security review
  → Employer CV review
  → Interview
  → Medical exam
  → Induction
  → Hired (start of work)
```

The comunero watches the timeline. They do not move the stages; the company or the board does that. Rejection at any step closes the process. A person can apply again to the same offer only after a rejection.

**Chat.** Messages attached to an application, between the worker, the board, and the company. The state of each message (pending, read, answered) is the record that the conversation happened.

**Más** collects the rest of the services, each gated by role:

| Service | Who | Business meaning |
|---|---|---|
| Evaluaciones 360° | Comunero | Satisfaction survey on an active contract: score, discrimination flag, comments |
| Capacitaciones (CV) | Comunero | Courses already on the CV. A certificate adds a verified skill and 100 points |
| Entrenamiento laboral | Comunero | Survey of the partner program (Antamina or another contractor): year, hours, topics, certificate. This is what leadership reports as “trained,” separate from the CV |
| Programa de puntos | Comunero | Balance earned from certifications |
| Buzón de reclamos | Comunero | Complaint against the company. Starts pending and is answered officially |
| Postular comunero | Board, company | Submit a neighbor's CV to an open offer. Only a user with role COMUNERO can be the candidate |

The board does not file complaints, does not answer 360° surveys, and does not earn points.

## Voice, in Spanish and Quechua

The Voz screen is for people who will not type a form. The user speaks or types in Spanish or Quechua. The assistant recognizes intents and answers from live data:

- “how is my application”
- “what jobs are open”
- trust level of the community
- training progress
- own complaints
- points balance

Speech-to-text runs on the device against a fixed phrase list, so the flow works without a cloud transcription service. Answers for applications, offers, and complaints are still real records from the API.

## Identity

Login is email and password. A comunero can also enter with facial biometrics and their DNI: the first photo enrolls the face, the next ones must match. That same check can be required when a contract is formalized, so the person signing is the person on the CV.

## Offline

Connectivity in these towns is uneven. Writes that fail for lack of network (applications, CV updates, multimedia) stay in a local queue and are sent when the connection returns. Reads of offers, the CV, and applications are cached so the last known state is still visible offline. Client errors are dropped from the queue; server errors are retried.

## Points

Points are a participation balance, not money. The action that grants them today is finishing a certification (100 points) and having that course written onto the CV as a verified skill. The board's monitoring role does not accumulate a balance.

## Run

```bash
npm install
npx expo start
```

Point the API client at the Talento backend (default `http://localhost:3001`; on a device, use the machine's LAN address). A seeded admin exists for API checks, but this app is meant to be opened with a `COMUNERO` or `DIRECTIVA` account.
