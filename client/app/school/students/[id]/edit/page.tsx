import { StudentManagementPage } from '../../student-management-page'

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <StudentManagementPage initialEditStudentId={id} />
}
