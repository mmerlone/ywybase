# Flash Messages

Flash messages are temporary notifications that survive server-side redirects. They're the clean, secure way to show messages after API route redirects or Server Actions.

## Why Flash Messages?

✅ **Clean URLs** - No ugly query parameters  
✅ **Secure** - Can't be bookmarked, shared, or manipulated  
✅ **Transient** - Automatically cleared after being shown once  
✅ **Works with redirects** - Survives server-side redirects  
✅ **Path-agnostic** - Works on any page globally

## Usage

### In API Routes

```typescript
import { NextResponse } from 'next/server'
import { setFlashMessage } from '@/lib/utils/flash-messages'

export async function GET(request: NextRequest) {
  // ... do something ...

  const response = NextResponse.redirect(new URL('/profile', request.url))
  setFlashMessage(response, 'Operation successful!', 'success')

  return response
}
```

### In Server Actions

Server Actions cannot attach cookies to a `NextResponse` directly. Prefer setting flash
messages in **route handlers** or **middleware** where you can return a response. For
Server Actions, use the returned `successMessage` for UI feedback or redirect to a route
that sets a flash message.

### In Middleware

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { setFlashMessageInMiddleware } from '@/lib/utils/flash-messages.server'

export function middleware(request: NextRequest) {
  const response = NextResponse.redirect(new URL('/login', request.url))

  setFlashMessageInMiddleware(request, response, 'Please log in to continue', 'warning')

  return response
}
```

## Message Severities

- `'success'` - Green checkmark (e.g., "Profile updated!")
- `'error'` - Red alert (e.g., "Something went wrong")
- `'warning'` - Orange caution (e.g., "Please verify your email")
- `'info'` - Blue info (e.g., "Your session will expire soon")

## How It Works

1. **Server sets cookie** - API route/middleware sets a temporary cookie with the message
2. **User is redirected** - Server redirects to destination page
3. **Client reads cookie** - `FlashMessageHandler` (in root layout) reads the cookie
4. **Shows notification** - Displays message via `SnackbarContext`
5. **Clears cookie** - Automatically removes the cookie after showing

## Architecture

```
┌─────────────────┐
│   API Route     │ setFlashMessage(response, 'Success!', 'success')
└────────┬────────┘
         │ Sets cookie + redirects
         ↓
┌─────────────────┐
│   User Browser  │ Redirected to /profile
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  LayoutClient   │ Contains FlashMessageHandler
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│ FlashMessage    │ Reads cookie → Shows snackbar → Clears cookie
│    Handler      │
└─────────────────┘
```

## Configuration

Flash messages are configured in `src/lib/utils/flash-messages.ts`:

- **Cookie name**: `flash_message`
- **Max age**: 60 seconds (enough time for redirect)
- **Path**: `/` (available site-wide)
- **HttpOnly**: `false` (needs client-side reading)
- **Secure**: `true` in production
- **SameSite**: `lax`

## Examples

### Email Verification Success

```typescript
const response = NextResponse.redirect(new URL('/profile', origin))
setFlashMessage(response, 'Email verified successfully!', 'success')
return response
```

### Form Submission Error

```typescript
const response = NextResponse.redirect(new URL('/settings', request.url))
setFlashMessage(response, 'Failed to save settings. Please try again.', 'error')
return response
```

### Warning Before Action

```typescript
const response = NextResponse.redirect(new URL('/account', request.url))
setFlashMessage(response, 'Your subscription expires in 3 days', 'warning')
return response
```

## Migration from URL Parameters

**Before** (URL params - ❌):

```typescript
redirectUrl.searchParams.set('verified', 'true')
redirectUrl.searchParams.set('message', 'Success!')
return NextResponse.redirect(redirectUrl)
```

**After** (Flash messages - ✅):

```typescript
const response = NextResponse.redirect(redirectUrl)
setFlashMessage(response, 'Success!', 'success')
return response
```

## Best Practices

1. **Keep messages concise** - Users only see them for 6 seconds
2. **Use appropriate severity** - Match the message importance
3. **Don't rely on them for critical info** - They disappear after being shown once
4. **Test redirect timing** - 60 second max age is usually enough
5. **Use for user feedback only** - Not for data transmission

## Troubleshooting

**Message not showing?**

- Check cookie is being set: DevTools → Application → Cookies
- Verify `FlashMessageHandler` is in `LayoutClient`
- Ensure redirect happens within 60 seconds
- Check browser console for errors

**Message shows on wrong page?**

- Messages are path-agnostic by design
- They show wherever the user lands after redirect
- This is intentional - messages follow the user

**Message shows twice?**

- Check for double redirects in your flow
- Ensure only one `FlashMessageHandler` instance exists
