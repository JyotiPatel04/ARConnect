import { useOutletContext } from 'react-router-dom'
import NotificationList from '../../components/shared/NotificationList'
import PageHeader from '../../components/PageHeader'
import useDocumentTitle from '../../hooks/useDocumentTitle'

export default function EmployerNotificationsPage() {
  useDocumentTitle('Notifications')
  const notifications = useOutletContext()

  return (
    <div>
      <PageHeader title="Notifications" />
      <NotificationList {...notifications} />
    </div>
  )
}
