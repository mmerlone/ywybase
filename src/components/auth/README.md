# Auth Components

This directory contains the interactive authentication UI used by the App Router auth pages and the global header.

## Current Structure

```text
src/components/auth/
├── AuthForm/
│   ├── index.tsx
│   ├── AuthFormFields.tsx
│   ├── AuthFormHeader.tsx
│   ├── AuthOperationSelector.tsx
│   ├── AuthSuccessMessage.tsx
│   ├── LoginButtons.tsx
│   ├── config/
│   │   ├── authFormDefaults.ts
│   │   ├── authFormSchemas.ts
│   │   └── uiText.ts
│   └── utils/
│       └── authHelpers.ts
├── PasswordMeter.tsx
├── ProviderBadge.tsx
├── UserMenu.tsx
└── README.md
```

## Responsibilities

- `AuthForm/`: single adaptive auth surface for login, sign-up, password reset, password update, and verification resend flows
- `PasswordMeter.tsx`: password strength feedback used by auth and account-management forms
- `ProviderBadge.tsx`: provider label/icon rendering for OAuth-related UI
- `UserMenu.tsx`: authenticated header menu plus anonymous login/sign-up actions

## Notes

- Route protection is handled by Next.js middleware and route config, not by a dedicated auth wrapper component in this directory.
- Auth mutations live in `src/lib/actions/auth/server.ts`.
- Client-side auth reads and OAuth helpers live in `src/lib/actions/auth/client.ts`.
