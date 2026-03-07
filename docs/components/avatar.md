# Avatar Components Documentation

## Overview

The avatar system provides comprehensive profile picture management with a clean, two-component architecture that respects React best practices and provides excellent user experience.

## Architecture

### Component Split

The avatar functionality is implemented as two separate components:

```
src/components/auth/
├── UserAvatar.tsx          # Read-only display component (119 lines)
└── UserAvatarForm.tsx       # Editable form component (245 lines)
```

### Data Flow

UserCard (Layout)
├── UserAvatarForm (editable)
├── UserAvatar (read-only)
└── Upload/Delete functionality

## Components

### UserAvatar (Read-Only Display)

**Location**: `src/components/auth/UserAvatar.tsx`

**Purpose**: Display user profile picture with optimized loading and fallback hierarchy.

**Features**:

- **Optimized Images**: Uses `useOptimizedAvatar` hook with `srcSet` and `sizes`
- **MUI Fallback Hierarchy**: Progressive fallback chain
- **Three Size Presets**: Small (72px), Medium (120px), Large (responsive)
- **Accessibility**: Proper alt text and ARIA attributes
- **Initials Helper**: Extracts and displays user initials as fallback

**Props Interface**:

```typescript
interface UserAvatarProps {
  userId: string
  size?: 'small' | 'medium' | 'large'
  className?: string
  sx?: SxProps<Theme>
  onClick?: () => void
}
```

**Usage Example**:

```typescript
<UserAvatar
  userId={user.id}
  size="medium"
  onClick={() => router.push('/profile')}
/>
```

### UserAvatarForm (Editable Form)

**Location**: `src/components/auth/UserAvatarForm.tsx`

**Purpose**: Complete avatar management interface with upload, delete, and editing capabilities.

**Features**:

- **File Upload**: Drag-and-drop with 5MB limit
- **Image Validation**: JPEG/PNG/GIF/WebP support
- **Hover States**: Camera upload and delete icons
- **Loading Overlays**: Progress indicators for all operations
- **Form Integration**: Wraps `UserAvatar` for display
- **Profile Sync**: Uses `useProfile` hook for mutations

**Key Features**:

- **Upload**: New avatar file selection and upload
- **Delete**: Current avatar removal with confirmation
- **Cancel**: Operation cancellation and cleanup
- **Loading**: Comprehensive loading states for all operations
- **Error Handling**: User-friendly error messages

**Usage Example**:

```typescript
<UserAvatarForm userId={user.id}>
  <UserAvatar
    userId={user.id}
    size="large"
  />
</UserAvatarForm>
```

## Implementation Details

### Image Optimization

```typescript
// useOptimizedAvatar takes the raw avatar URL and returns a getUrl function.
// AVATAR_SIZES defines the server-side image transform dimensions:
//   thumbnail: 50×50px | small: 100×100px | medium: 200×200px | large: 400×400px
// These are distinct from the CSS display sizes in AVATAR_SIZE_CONFIG:
//   small: 72px | medium: 120px | large: 150–200px (responsive)
const avatarUrls = useOptimizedAvatar(profile.avatar_url)

const smallUrl = avatarUrls.getUrl(AVATAR_SIZES.small) // 100×100 transform
const mediumUrl = avatarUrls.getUrl(AVATAR_SIZES.medium) // 200×200 transform
const largeUrl = avatarUrls.getUrl(AVATAR_SIZES.large) // 400×400 transform
```

### Fallback Hierarchy

1. **Optimized Avatar** (from `useOptimizedAvatar`)
2. **User Initials** (from `getInitials()`)
3. **Default Icon** (MUI Person icon)

### File Validation Rules

- **Max Size**: 5MB
- **Allowed Types**: JPEG, PNG, GIF, WebP
- **Validation**: Client-side and server-side validation

## State Management

### React Query Integration

```typescript
const { uploadAvatar, deleteAvatar } = useProfile(userId)

// Upload mutation
const uploadMutation = useMutation({
  mutationFn: async (file: File) => {
    return await uploadAvatar(userId, file)
  },
  onMutate: (variables) => {
    // Optimistic updates
  },
  onSuccess: () => {
    // Invalidate cache
    queryClient.invalidateQueries({ queryKey: ['profile', userId] })
  },
})
```

## Styling

### Material UI Integration

- **Theme Support**: Respects active theme (concrete/ywybase)
- **Responsive Design**: Mobile-first approach
- **Custom Styles**: Via `sx` prop for flexibility
- **Consistent Spacing**: Follows MUI design system

## Accessibility

### WCAG 2.1 Compliance

- **Semantic HTML**: Proper element usage
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: Meets WCAG AA standards
- **Focus Management**: Proper focus indicators

## Performance

### Optimization Techniques

- **Image Optimization**: Next.js Image optimization with `srcSet`
- **Lazy Loading**: Components load only when needed
- **Memoization**: Expensive computations cached
- **Bundle Splitting**: Code split at component level

## Security

### File Upload Security

- **File Type Validation**: Server and client-side validation
- **Size Limits**: Enforced 5MB maximum
- **Sanitization**: File names and paths sanitized
- **Supabase Storage**: Secure file upload with RLS

## Testing

### Test Coverage

- **Unit Tests**: Component logic and utility functions
- **Integration Tests**: File upload and delete flows
- **E2E Tests**: Complete avatar management workflows
- **Accessibility Tests**: Screen reader and keyboard navigation

---

**Last Updated**: 2025-02-05
**Status**: ✅ Implemented and Documented
