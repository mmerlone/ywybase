# Authentication Providers Setup Guide

YwyBase supports multiple authentication providers via Supabase. This guide explains how to enable and configure each supported provider, with direct links to the relevant setup pages.

## Supported Providers

- **Google**
- **GitHub**
- **Microsoft**
- **Apple**

---

## 1. Google

- **Supabase Docs:** [Google Auth Setup](https://supabase.com/docs/guides/auth/social-login/auth-google)
- **Google Cloud Console:** [Google API Credentials](https://console.cloud.google.com/apis/credentials)

**Steps:**

1. Go to the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Create a new OAuth 2.0 Client ID (Web application).
3. Set the redirect URI to your Supabase project's callback URL (see Supabase dashboard for the correct value).
4. Copy the Client ID and Client Secret.
5. In the [Supabase Dashboard > Authentication > Providers](https://app.supabase.com/project/_/auth/providers), enable Google and paste your credentials.

---

## 2. GitHub

- **Supabase Docs:** [GitHub Auth Setup](https://supabase.com/docs/guides/auth/social-login/auth-github)
- **GitHub Developer Settings:** [GitHub OAuth Apps](https://github.com/settings/developers)

**Steps:**

1. Go to [GitHub Developer Settings](https://github.com/settings/developers) > OAuth Apps > New OAuth App.
2. Set the Authorization callback URL to your Supabase project's callback URL.
3. Register the app and copy the Client ID and Client Secret.
4. In the [Supabase Dashboard > Authentication > Providers](https://app.supabase.com/project/_/auth/providers), enable GitHub and paste your credentials.

---

## 3. Microsoft

- **Supabase Docs:** [Microsoft Auth Setup](https://supabase.com/docs/guides/auth/social-login/auth-azure)
- **Azure Portal:** [Azure App Registrations](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade)

**Steps:**

1. Go to the [Azure Portal](https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade).
2. Register a new application.
3. Set the redirect URI to your Supabase project's callback URL.
4. Copy the Application (client) ID and Client Secret.
5. In the [Supabase Dashboard > Authentication > Providers](https://app.supabase.com/project/_/auth/providers), enable Microsoft and paste your credentials.

---

## 4. Apple

- **Supabase Docs:** [Apple Auth Setup](https://supabase.com/docs/guides/auth/social-login/auth-apple)
- **Apple Developer Portal:** [Certificates, Identifiers & Profiles](https://developer.apple.com/account/resources/identifiers/list)

**Steps:**

1. Go to the [Apple Developer Portal](https://developer.apple.com/account/resources/identifiers/list).
2. Register a new Service ID and configure Sign In with Apple.
3. Set the redirect URI to your Supabase project's callback URL.
4. Generate and download the key, copy the Key ID, Team ID, and Service ID.
5. In the [Supabase Dashboard > Authentication > Providers](https://app.supabase.com/project/_/auth/providers), enable Apple and paste your credentials.

---

## Notes

- The callback/redirect URI for each provider is shown in your Supabase project's Auth > Providers page.
- After enabling a provider, test the login flow in your app.
- For more details, see the [Supabase Social Auth Docs](https://supabase.com/docs/guides/auth/social-login).
