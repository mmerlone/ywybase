import type React from 'react'
import type { ReactElement } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import UserPageClient from '@/components/dashboard/users/UserPageClient'
import { blockUser, deleteUser, fetchAdminProfileAction } from '@/lib/actions/admin/users'
import { queryAdminProfile } from '@/lib/adminUsers'
import { BusinessError } from '@/lib/error/errors'

export const metadata: Metadata = {
  title: 'User Details',
  description: 'View and manage a user account in the admin dashboard.',
}

type PageProps = {
  params: Promise<{
    profileId: string
  }>
}

export default async function UserDetailsPage({ params }: PageProps): Promise<ReactElement> {
  const { profileId } = await params

  if (!profileId) {
    notFound()
  }

  let initialData

  try {
    initialData = await queryAdminProfile(profileId)
  } catch (error) {
    if (error instanceof BusinessError && error.statusCode === 404) {
      notFound()
    }

    throw error
  }

  return (
    <UserPageClient
      profileId={profileId}
      initialData={initialData}
      fetchProfileAction={fetchAdminProfileAction}
      blockUserAction={blockUser}
      deleteUserAction={deleteUser}
    />
  )
}
