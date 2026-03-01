# Contexts

This directory contains React Context definitions for data sharing across the component tree.

## Directory Purpose

This directory is for **standalone contexts** that define both context and provider in a single file. Authentication-related contexts live in `src/components/providers/` instead.

## Available Contexts

### Snackbar Context

A lightweight notification system for displaying toast messages.

**Usage:**

```tsx
import { useSnackbar } from '@/contexts/SnackbarContext'

function Component() {
  const { showSuccess, showError } = useSnackbar()

  const handleSave = async () => {
    try {
      await saveData()
      showSuccess('Data saved successfully')
    } catch (error) {
      showError('Failed to save data')
    }
  }
}
```

## Other Contexts

- **Authentication**: See `src/components/providers/AuthProvider.tsx` for `useAuthContext` and `useCurrentUser`
