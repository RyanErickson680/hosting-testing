import {
  Box,
  Container,
  Stack,
  Typography,
  Divider,
  Alert,
  Tooltip,
  IconButton,
  Grid,
  Paper,
  Chip,
  Tabs,
  Tab,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  InputAdornment,
} from '@mui/material'
import {
  deleteUser,
  getUser,
  getUserByEmail,
  getUsers,
  getUsersByRole,
  updateUser,
  createUser,
  resendVolunteerWaiver,
} from '../api/user'
import {
  getEvents,
  createEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  getEventStats,
  getEventAttendance,
  getEventAttendanceLink,
} from '../api/event'
import { getDonationStats, getAdminDonationPayments } from '../api/donation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  updateProjectImages,
} from '../api/project'
import { colors } from '../theme/colors'
import Button from '../components/Button'
import UserFilters from '../components/admin/UserFilters'
import UserLookup from '../components/admin/UserLookup'
import UsersTable from '../components/admin/UsersTable'
import ManageUsersForms from '../components/admin/ManageUsersForms'
import EventsTable from '../components/admin/EventsTable'
import EventFilters from '../components/admin/EventFilters'
import CreateEventForm from '../components/admin/CreateEventForm'
import EventModal from '../components/admin/EventModal'
import CreateProjectForm from '../components/admin/CreateProjectForm'
import FeedbackToUserSection from '../components/admin/FeedbackToUserSection'
import { sendFeedback } from '../api/feedback'
import {
  getWishlist,
  createWishlistItem,
  updateWishlistItem,
  deleteWishlistItem,
} from '../api/wishlist'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import to from 'await-to-js'
import { useAuth } from '../context/AuthContext'
import RefreshIcon from '@mui/icons-material/Refresh'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import EventIcon from '@mui/icons-material/Event'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import AnalyticsIcon from '@mui/icons-material/Analytics'
import EditNoteIcon from '@mui/icons-material/EditNote'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import VolunteerActivismIcon from '@mui/icons-material/VolunteerActivism'
import WaterDropIcon from '@mui/icons-material/WaterDrop'
import LocationOnIcon from '@mui/icons-material/LocationOn'
import SearchIcon from '@mui/icons-material/Search'
import { useHomeContent } from '../context/HomeContentContext'

function ProjectCard({ project, formatDate, colors, isPast = false, onEdit, onDelete }) {
  const progress = project.goalAmount
    ? Math.min(100, Math.round(((project.currentAmount || 0) / project.goalAmount) * 100))
    : 0

  return (
    <Box
      sx={{
        p: 2.5,
        border: 'none',
        borderRadius: 2,
        backgroundColor: isPast ? '#f5f5f5' : colors.background.section,
        opacity: isPast ? 0.8 : 1,
        display: 'flex',
        flexDirection: 'column',
        gap: 1,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.text.primary }}>
          {project.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Chip
            label={project.status}
            size="small"
            sx={{
              textTransform: 'capitalize',
              fontWeight: 600,
              fontSize: '11px',
              backgroundColor: isPast ? '#e0e0e0' : colors.secondary.light,
              color: isPast ? colors.text.secondary : colors.primary.dark,
            }}
          />
          {onEdit && (
            <IconButton size="small" onClick={onEdit} title="Edit campaign">
              <EditIcon fontSize="small" />
            </IconButton>
          )}
          {onDelete && (
            <IconButton size="small" onClick={onDelete} title="Delete campaign" sx={{ color: '#d32f2f' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {project.description && (
        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
          {project.description}
        </Typography>
      )}

      {/* Progress bar */}
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" sx={{ color: colors.text.secondary }}>
            ${(project.currentAmount || 0).toLocaleString()} raised
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, color: colors.primary.main }}>
            {progress}%
          </Typography>
        </Box>
        <Box
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: '#c8e6c9',
            overflow: 'hidden',
          }}
        >
          <Box
            sx={{
              height: '100%',
              width: `${progress}%`,
              borderRadius: 3,
              backgroundColor: isPast ? colors.text.disabled : colors.primary.main,
              transition: 'width 0.4s ease',
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
          Goal: ${(project.goalAmount || 0).toLocaleString()}
        </Typography>
      </Box>

      {project.targetEndDate && (
        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
          {isPast ? 'Ended' : 'Ends'}: {formatDate(project.targetEndDate)}
        </Typography>
      )}
    </Box>
  )
}

export default function AdminDashboard() {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth()
  const { content, updateContent, resetContent, saving } = useHomeContent()
  const [users, setUsers] = useState([])
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [section, setSection] = useState(0)
  const [userTab, setUserTab] = useState(0)
  const [eventTab, setEventTab] = useState(0)
  const [fundraisingTab, setFundraisingTab] = useState(0)
  const [contentTab, setContentTab] = useState(0)
  const [wishlistItems, setWishlistItems] = useState([])
  const [wishlistLoading, setWishlistLoading] = useState(false)
  const [newWishlistName, setNewWishlistName] = useState('')
  const [newWishlistPriority, setNewWishlistPriority] = useState('medium')
  const [newWishlistPrice, setNewWishlistPrice] = useState('')

  // Filter states
  const [filterRole, setFilterRole] = useState('')
  const [filterEmail, setFilterEmail] = useState('')
  const [filterWaiver, setFilterWaiver] = useState('')

  // Form states
  const [userId, setUserId] = useState('')
  const [userEmail, setUserEmail] = useState('')
  const [deleteUserId, setDeleteUserId] = useState('')

  // Event states
  const [events, setEvents] = useState([])
  const [filterStatus, setFilterStatus] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)
  const [attendancePayload, setAttendancePayload] = useState(null)
  const [attendanceLoadingId, setAttendanceLoadingId] = useState(null)
  const [attendanceQrDialogOpen, setAttendanceQrDialogOpen] = useState(false)
  const [attendanceQrUrl, setAttendanceQrUrl] = useState('')
  const [attendanceQrEventName, setAttendanceQrEventName] = useState('')
  const [attendanceQrLoading, setAttendanceQrLoading] = useState(false)

  // Project/Fundraising states
  const [projects, setProjects] = useState([])
  const [filterProjectStatus, setFilterProjectStatus] = useState('')
  const [editingProject, setEditingProject] = useState(null)
  const [editFormData, setEditFormData] = useState({})
  const [editImages, setEditImages] = useState([]) // [{ url, caption }]
  const [newImageUrl, setNewImageUrl] = useState('')
  const [newImageCaption, setNewImageCaption] = useState('')
  const [deleteProjectId, setDeleteProjectId] = useState(null)

  // Analytics
  const [donationStats, setDonationStats] = useState(null)
  const [eventStats, setEventStats] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [paymentLookupQuery, setPaymentLookupQuery] = useState('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('')
  const [paymentProjectFilter, setPaymentProjectFilter] = useState('')
  const [paymentResults, setPaymentResults] = useState([])
  const [paymentTotal, setPaymentTotal] = useState(0)
  const [paymentLoading, setPaymentLoading] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  // Load wishlist from MongoDB
  const fetchWishlist = async () => {
    setWishlistLoading(true)
    try {
      const res = await getWishlist()
      setWishlistItems(res.data.items || [])
    } catch (err) {
      console.error('Failed to load wishlist', err)
    } finally {
      setWishlistLoading(false)
    }
  }

  useEffect(() => {
    fetchWishlist()
  }, [])

  const loadInitialData = async () => {
    await Promise.all([getAllUsers(), getAllEvents(), getAllProjects()])
  }

  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(null), 5000)
    return () => clearTimeout(timer)
  }, [success])

  const showError = (msg) => {
    setError(msg)
    setSuccess(null)
  }

  const showSuccess = (msg) => {
    setSuccess(msg)
    setError(null)
  }

  const getAllUsers = async (filters = {}) => {
    setLoading(true)
    setError(null)
    const [err, res] = await to(getUsers(filters))
    setLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to fetch users')
      return
    }

    const { data } = res
    setUsers(data.users || [])
    showSuccess(`Loaded ${data.total || 0} users`)
  }

  const onUserFind = async () => {
    if (!userId.trim()) return

    setLoading(true)
    const [err, res] = await to(getUser({ id: userId.trim() }))
    setLoading(false)

    if (err) {
      setUser(null)
      showError(err.response?.data?.error || 'User not found')
      return
    }

    setUser(res.data.user)
    showSuccess('User found!')
  }

  const onUserFindByEmail = async () => {
    if (!userEmail.trim()) return

    setLoading(true)
    const [err, res] = await to(getUserByEmail({ email: userEmail.trim() }))
    setLoading(false)

    if (err) {
      setUser(null)
      showError(err.response?.data?.error || 'User not found')
      return
    }

    setUser(res.data.user)
    showSuccess('User found!')
  }

  const onFilterUsers = () => {
    const filters = {}
    if (filterRole) filters.role = filterRole
    if (filterEmail) filters.email = filterEmail
    if (filterWaiver) filters.waiverSigned = filterWaiver

    getAllUsers(filters)
  }

  if (authLoading) {
    return null
  }

  if (!isAuthenticated || !['admin', 'staff'].includes(authUser?.role)) {
    return <Navigate to="/" replace />
  }

  const isStaff = authUser?.role === 'staff'

  const onFilterByRole = async (role) => {
    if (!role) return

    setLoading(true)
    const [err, res] = await to(getUsersByRole({ role }))
    setLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to fetch users')
      return
    }

    setUsers(res.data.users || [])
    showSuccess(`Loaded ${res.data.count || 0} ${role}s`)
  }

  const onUserDelete = async () => {
    if (!deleteUserId.trim()) return

    setLoading(true)
    const [err] = await to(deleteUser({ id: deleteUserId.trim() }))
    setLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to delete user')
      return
    }

    showSuccess('User deleted successfully')
    setDeleteUserId('')
    loadInitialData()
  }

  const onDeleteUserQuick = async (id) => {
    if (!id) return
    setLoading(true)
    const [err] = await to(deleteUser({ id }))
    setLoading(false)
    if (err) {
      showError(err.response?.data?.error || 'Failed to delete user')
      return
    }
    showSuccess('User deleted successfully')
    getAllUsers()
  }

  const resetUserFilters = () => {
    setFilterRole('')
    setFilterEmail('')
    setFilterWaiver('')
    getAllUsers()
  }

  const onResendWaiver = async (id) => {
    if (!id) return
    setLoading(true)
    const [err] = await to(resendVolunteerWaiver({ id }))
    setLoading(false)
    if (err) {
      showError(err.response?.data?.error || 'Failed to resend waiver email')
      return
    }
    showSuccess('Waiver email sent.')
    getAllUsers()
  }

  const onOverrideWaiver = async (userRow, newSigned) => {
    if (!userRow?.email) return
    const confirmed = window.confirm(
      `Are you sure you want to ${newSigned ? 'approve' : 'revoke'} this volunteer's waiver?`
    )
    if (!confirmed) return
    setLoading(true)
    const payload = {
      email: userRow.email,
      'volunteerProfile.waiverSigned': newSigned,
    }
    if (newSigned) {
      payload['volunteerProfile.waiverSignedAt'] = new Date().toISOString()
      payload['volunteerProfile.waiverToken'] = null
      payload['volunteerProfile.waiverTokenExpiresAt'] = null
    } else {
      payload['volunteerProfile.waiverSignedAt'] = null
      payload['volunteerProfile.waiverToken'] = null
      payload['volunteerProfile.waiverTokenExpiresAt'] = null
    }
    const [err] = await to(updateUser(payload))
    setLoading(false)
    if (err) {
      showError(err.response?.data?.error || 'Failed to update waiver status')
      return
    }
    showSuccess(newSigned ? 'Waiver marked as signed.' : 'Waiver revoked.')
    getAllUsers()
  }

  const onCreateUser = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = {
      email: e.target.email.value.trim(),
      role: e.target.role.value,
      firstName: e.target.firstName.value.trim(),
      lastName: e.target.lastName.value.trim(),
      createdAt: new Date(),
    }

    // Optional fields
    if (e.target.passwordHash?.value.trim()) {
      formData.passwordHash = e.target.passwordHash.value.trim()
    }

    if (e.target.phone?.value.trim()) {
      formData.contactInfo = {
        phone: e.target.phone.value.trim(),
        preferredContactMethod: e.target.preferredContactMethod?.value || 'email',
      }
    }

    // For base users, allow both volunteer and donor sub-profiles on one account.
    if (formData.role === 'user') {
      const skills = e.target.skills?.value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s)
      formData.volunteerProfile = {
        skills: skills || [],
        waiverSigned: e.target.waiverSigned?.checked || false,
        totalHoursVolunteered: parseFloat(e.target.totalHours?.value) || 0,
        availability: [],
      }
      formData.donorProfile = {
        totalAmountDonated: parseFloat(e.target.totalAmount?.value) || 0,
        recurringDonationCount: parseInt(e.target.recurringCount?.value, 10) || 0,
      }
    }

    const [err, res] = await to(createUser(formData))
    setLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to create user')
      return
    }

    showSuccess('User created successfully!')
    e.target.reset()
    loadInitialData()
  }

  const onUpdateUser = async (e) => {
    e.preventDefault()
    setLoading(true)

    const email = e.target.email.value.trim()
    const updateData = {
      updatedAt: new Date(),
    }

    if (e.target.firstName?.value.trim()) {
      updateData.firstName = e.target.firstName.value.trim()
    }
    if (e.target.lastName?.value.trim()) {
      updateData.lastName = e.target.lastName.value.trim()
    }
    if (e.target.role?.value) {
      updateData.role = e.target.role.value
    }

    const [err, res] = await to(updateUser({ email, ...updateData }))
    setLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to update user')
      return
    }

    showSuccess('User updated successfully!')
    e.target.reset()
    setUser(null)
    loadInitialData()
  }

  const formatDate = (date) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString()
  }

  // Event handlers
  const getAllEvents = async (filters = {}) => {
    setLoading(true)
    setError(null)
    const [err, res] = await to(getEvents(filters))
    setLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to fetch events')
      return
    }

    const { data } = res
    setEvents(data.events || [])
    showSuccess(`Loaded ${data.total || 0} events`)
  }

  const onFilterEvents = () => {
    const filters = {}
    if (filterStatus) filters.status = filterStatus
    if (filterStartDate) filters.startDate = filterStartDate
    if (filterEndDate) filters.endDate = filterEndDate

    getAllEvents(filters)
  }

  const onCreateEvent = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = {
      name: e.target.name.value.trim(),
      eventType: e.target.eventType.value,
      date: e.target.date.value,
      endTime: e.target.endTime.value,
      status: e.target.status.value,
      createdAt: new Date(),
    }

    // Optional fields
    if (e.target.description?.value.trim()) {
      formData.description = e.target.description.value.trim()
    }
    if (e.target.location?.value.trim()) {
      formData.location = e.target.location.value.trim()
    }
    if (e.target.cost?.value) {
      formData.cost = parseFloat(e.target.cost.value)
    }
    if (e.target.volunteersNeeded?.value) {
      formData.volunteersNeeded = parseInt(e.target.volunteersNeeded.value)
    }
    if (e.target.priority?.value) {
      formData.priority = parseInt(e.target.priority.value)
    }
    if (e.target.currentVolunteerCount?.value) {
      formData.currentVolunteerCount = parseInt(e.target.currentVolunteerCount.value)
    }

    formData.waiverRequired = Boolean(e.target.waiverRequired?.checked)

    // Parse skills
    if (e.target.skillsNeeded?.value.trim()) {
      const skills = e.target.skillsNeeded.value
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s)
      formData.skillsNeeded = skills
    }

    const [err, res] = await to(createEvent(formData))
    setLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to create event')
      return
    }

    showSuccess('Event created successfully!')
    e.target.reset()
    getAllEvents()
  }

  const onDeleteEvent = async (id) => {
    if (!id) return
    setLoading(true)
    const [err] = await to(deleteEvent({ id }))
    setLoading(false)
    if (err) {
      showError(err.response?.data?.error || 'Failed to delete event')
      return
    }
    showSuccess('Event deleted successfully')
    getAllEvents()
  }

  const onViewEvent = async (id) => {
    setLoading(true)
    const [err, res] = await to(getEvent({ id }))
    setLoading(false)
    
    if (err) {
      showError(err.response?.data?.error || 'Failed to fetch event')
      return
    }
    
    setEditingEvent(res.data.event)
    setEventModalOpen(true)
  }

  const onCloseEventModal = () => {
    setEventModalOpen(false)
    setEditingEvent(null)
  }

  const onViewAttendance = async (id) => {
    if (!id) return
    setAttendanceDialogOpen(true)
    setAttendancePayload(null)
    setAttendanceLoadingId(id)
    const [err, res] = await to(getEventAttendance({ id }))
    setAttendanceLoadingId(null)
    if (err) {
      showError(err.response?.data?.error || 'Failed to load attendance')
      setAttendanceDialogOpen(false)
      return
    }
    setAttendancePayload(res.data)
  }

  const onCloseAttendanceDialog = () => {
    setAttendanceDialogOpen(false)
    setAttendancePayload(null)
    setAttendanceLoadingId(null)
  }

  const onOpenAttendanceQr = async (id) => {
    if (!id) return
    const ev = events.find((e) => e._id === id)
    setAttendanceQrEventName(ev?.name || '')
    setAttendanceQrUrl('')
    setAttendanceQrDialogOpen(true)
    setAttendanceQrLoading(true)
    const [err, res] = await to(getEventAttendanceLink({ id }))
    setAttendanceQrLoading(false)
    if (err) {
      showError(err.response?.data?.error || 'Failed to load attendance link')
      setAttendanceQrDialogOpen(false)
      return
    }
    setAttendanceQrUrl(res.data?.url || '')
  }

  const onCloseAttendanceQrDialog = () => {
    setAttendanceQrDialogOpen(false)
    setAttendanceQrUrl('')
    setAttendanceQrEventName('')
  }

  const onUpdateEvent = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const id = e.target.id.value
    const formData = {
      name: e.target.name.value.trim(),
      date: e.target.date.value,
      endTime: e.target.endTime.value,
      status: e.target.status.value,
      eventType: e.target.eventType.value,
    }

    if (e.target.description?.value.trim()) {
      formData.description = e.target.description.value.trim()
    }
    if (e.target.location?.value.trim()) {
      formData.location = e.target.location.value.trim()
    }
    if (e.target.cost?.value) {
      formData.cost = parseFloat(e.target.cost.value)
    }
    if (e.target.volunteersNeeded?.value) {
      formData.volunteersNeeded = parseInt(e.target.volunteersNeeded.value)
    }
    if (e.target.priority?.value) {
      formData.priority = parseInt(e.target.priority.value)
    }
    if (e.target.currentVolunteerCount?.value) {
      formData.currentVolunteerCount = parseInt(e.target.currentVolunteerCount.value)
    }

    formData.waiverRequired = Boolean(e.target.waiverRequired?.checked)

    if (e.target.skillsNeeded) {
      const skillsValue = e.target.skillsNeeded.value.trim()
      formData.skillsNeeded = skillsValue
        ? skillsValue.split(',').map((s) => s.trim()).filter((s) => s)
        : []
    }

    const [err, res] = await to(updateEvent({ id, ...formData }))
    setLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to update event')
      return
    }

    showSuccess('Event updated successfully!')
    await getAllEvents()
    onCloseEventModal()
  }

  // Project/Fundraising handlers
  const getAllProjects = async (filters = {}) => {
    setLoading(true)
    setError(null)
    const [err, res] = await to(getProjects(filters))
    setLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to fetch projects')
      return
    }

    const { data } = res
    setProjects(data.projects || [])
    showSuccess(`Loaded ${data.total || 0} projects`)
  }

  const onFilterProjects = () => {
    const filters = {}
    if (filterProjectStatus) filters.status = filterProjectStatus

    getAllProjects(filters)
  }

  const onCreateProject = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = {
      name: e.target.name.value.trim(),
      description: e.target.description.value.trim(),
      goalAmount: parseFloat(e.target.goalAmount.value),
      status: e.target.status.value,
      priority: parseInt(e.target.priority.value),
      createdAt: new Date(),
    }

    // Optional fields
    if (e.target.currentAmount?.value) {
      formData.currentAmount = parseFloat(e.target.currentAmount.value)
    }
    if (e.target.startDate?.value) {
      formData.startDate = new Date(e.target.startDate.value)
    }
    if (e.target.targetEndDate?.value) {
      formData.targetEndDate = new Date(e.target.targetEndDate.value)
    }
    if (e.target.currentNeeds?.value.trim()) {
      try {
        formData.currentNeeds = JSON.parse(e.target.currentNeeds.value)
      } catch (err) {
        showError('Invalid JSON format for Current Needs')
        setLoading(false)
        return
      }
    }

    const [err, res] = await to(createProject(formData))
    setLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to create project')
      return
    }

    showSuccess('Project created successfully!')
    e.target.reset()
    getAllProjects()
  }

  const onStartEditProject = (project) => {
    setEditFormData({
      name: project.name || '',
      description: project.description || '',
      goalAmount: project.goalAmount ?? '',
      priority: project.priority ?? '',
      status: project.status || 'active',
      startDate: project.timeline?.startDate
        ? new Date(project.timeline.startDate).toISOString().slice(0, 10)
        : '',
      targetEndDate: project.timeline?.targetEndDate
        ? new Date(project.timeline.targetEndDate).toISOString().slice(0, 10)
        : '',
    })
    setEditImages(project.images || [])
    setNewImageUrl('')
    setNewImageCaption('')
    setEditingProject(project)
  }

  const onUpdateProject = async () => {
    setLoading(true)
    setError(null)
    const payload = {
      name: editFormData.name.trim(),
      description: editFormData.description.trim(),
      goalAmount: parseFloat(editFormData.goalAmount),
      priority: parseInt(editFormData.priority),
      status: editFormData.status,
      startDate: editFormData.startDate || undefined,
      targetEndDate: editFormData.targetEndDate || undefined,
    }
    const [err] = await to(updateProject({ id: editingProject._id, ...payload }))
    if (err) {
      setLoading(false)
      showError(err.response?.data?.error || 'Failed to update project')
      return
    }
    const [imgErr] = await to(updateProjectImages({ id: editingProject._id, images: editImages }))
    if (imgErr) {
      showError('Project saved but images failed to update. Please try again.')
      setLoading(false)
      return
    }
    setLoading(false)
    showSuccess('Project updated successfully!')
    setEditingProject(null)
    getAllProjects()
  }

  const onConfirmDeleteProject = async () => {
    setLoading(true)
    setError(null)
    const [err] = await to(deleteProject({ id: deleteProjectId }))
    setLoading(false)
    if (err) {
      showError(err.response?.data?.error || 'Failed to delete project')
      return
    }
    showSuccess('Project deleted!')
    setDeleteProjectId(null)
    getAllProjects()
  }

  const loadAnalytics = async () => {
    setAnalyticsLoading(true)
    const [[, dStats], [, eStats]] = await Promise.all([
      to(getDonationStats()),
      to(getEventStats()),
    ])
    if (dStats) setDonationStats(dStats.data)
    if (eStats) setEventStats(eStats.data)
    setAnalyticsLoading(false)
  }

  const loadDonationPayments = async (overrides = {}) => {
    setPaymentLoading(true)
    const params = {
      query: paymentLookupQuery.trim(),
      status: paymentStatusFilter,
      projectId: paymentProjectFilter,
      limit: 25,
      ...overrides,
    }

    const [err, res] = await to(getAdminDonationPayments(params))
    setPaymentLoading(false)

    if (err) {
      showError(err.response?.data?.error || 'Failed to fetch donation payments')
      return
    }

    setPaymentResults(res.data.payments || [])
    setPaymentTotal(res.data.total || 0)
  }

  const onSearchPayments = () => {
    loadDonationPayments()
  }

  const resetPaymentFilters = () => {
    setPaymentLookupQuery('')
    setPaymentStatusFilter('')
    setPaymentProjectFilter('')
    loadDonationPayments({ query: '', status: '', projectId: '' })
  }

  const sectionTitles = {
    0: 'Overview',
    1: 'Users',
    2: 'Events',
    3: 'Fundraising Projects',
    4: 'Content Management',
    5: 'Statistics & Analytics',
  }

  const renderStatsCards = () => {
    const activeProjects = projects.filter((p) => p.status === 'active').length
    const volunteerCount = users.filter((u) => Boolean(u.volunteerProfile)).length
    const upcomingEventsCount = events.filter((e) => new Date(e.date) >= new Date()).length
    const projectPct = projects.length > 0 ? Math.min(100, (activeProjects / projects.length) * 100) : 0

    const cardSx = {
      p: 3,
      borderRadius: '1.25rem',
      backgroundColor: colors.background.paper,
      boxShadow: '0px 12px 32px rgba(24, 29, 27, 0.06)',
      transition: 'transform 0.2s',
      '&:hover': { transform: 'scale(1.02)' },
    }
    const labelSx = {
      color: colors.text.secondary,
      fontSize: '0.65rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      mb: 1.5,
      fontFamily: 'Manrope, sans-serif',
    }
    const valueSx = {
      fontSize: '2.5rem',
      fontWeight: 800,
      color: colors.primary.main,
      fontFamily: '"Plus Jakarta Sans", sans-serif',
      lineHeight: 1,
    }

    return (
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        <Paper elevation={0} sx={cardSx}>
          <Typography sx={labelSx}>Total Users</Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Typography sx={valueSx}>{users.length}</Typography>
            <Box sx={{ backgroundColor: '#acf4a4', color: '#00450d', px: 1.5, py: 0.5, borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif', whiteSpace: 'nowrap' }}>
              Live
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={cardSx}>
          <Typography sx={labelSx}>Volunteers</Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Typography sx={valueSx}>{volunteerCount}</Typography>
            <VolunteerActivismIcon sx={{ fontSize: 28, color: '#1b5e20' }} />
          </Box>
        </Paper>

        <Paper elevation={0} sx={cardSx}>
          <Typography sx={labelSx}>Upcoming Events</Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Typography sx={valueSx}>{upcomingEventsCount}</Typography>
            <Box sx={{ backgroundColor: '#ffdeac', color: '#503600', px: 1.5, py: 0.5, borderRadius: '0.5rem', fontSize: '0.7rem', fontWeight: 700, fontFamily: 'Manrope, sans-serif' }}>
              Scheduled
            </Box>
          </Box>
        </Paper>

        <Paper elevation={0} sx={cardSx}>
          <Typography sx={labelSx}>Active Projects</Typography>
          <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Typography sx={valueSx}>{activeProjects}</Typography>
            <Box sx={{ width: 52, height: 8, borderRadius: '999px', backgroundColor: '#e5e9e6', overflow: 'hidden' }}>
              <Box sx={{ width: `${projectPct}%`, height: '100%', backgroundColor: colors.primary.main, borderRadius: '999px' }} />
            </Box>
          </Box>
        </Paper>
      </Box>
    )
  }

  const renderUpcomingEvents = () => {
    const upcoming = events
      .filter((e) => new Date(e.date) >= new Date())
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 3)

    const statusBadge = (status) => {
      if (status === 'open') return { bg: '#acf4a4', color: '#00450d', label: 'Open' }
      if (status === 'full') return { bg: '#ffdbcf', color: '#2e150b', label: 'Full' }
      if (status === 'cancelled') return { bg: '#ffdad6', color: '#93000a', label: 'Cancelled' }
      return { bg: '#e5e9e6', color: '#41493e', label: status }
    }

    return (
      <Box
        sx={{
          backgroundColor: colors.background.paper,
          borderRadius: '1.5rem',
          overflow: 'hidden',
          height: '100%',
          boxShadow: '0px 12px 32px rgba(24, 29, 27, 0.06)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box sx={{ p: 3, flex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.15rem', fontWeight: 700, color: colors.primary.main }}>
              Upcoming Events
            </Typography>
            <Typography
              onClick={() => setSection(2)}
              sx={{ fontSize: '0.75rem', fontWeight: 700, color: colors.primary.main, cursor: 'pointer', fontFamily: 'Manrope, sans-serif', '&:hover': { textDecoration: 'underline' } }}
            >
              View All
            </Typography>
          </Box>

          {upcoming.length === 0 ? (
            <Typography sx={{ color: colors.text.secondary, fontSize: '0.875rem', fontFamily: 'Manrope, sans-serif' }}>
              No upcoming events scheduled.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {upcoming.map((event) => {
                const d = new Date(event.date)
                const badge = statusBadge(event.status)
                return (
                  <Box
                    key={event._id}
                    sx={{
                      display: 'flex',
                      gap: 2,
                      p: 2,
                      borderRadius: '1rem',
                      backgroundColor: '#f1f5f2',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                      '&:hover': { backgroundColor: '#ebefec' },
                    }}
                  >
                    {/* Calendar chip */}
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        backgroundColor: '#ffffff',
                        borderRadius: '0.75rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                      }}
                    >
                      <Typography sx={{ fontSize: '0.55rem', fontWeight: 700, color: '#503600', textTransform: 'uppercase', lineHeight: 1, fontFamily: 'Manrope, sans-serif' }}>
                        {d.toLocaleString('en-US', { month: 'short' })}
                      </Typography>
                      <Typography sx={{ fontSize: '1.15rem', fontWeight: 900, color: colors.primary.main, lineHeight: 1.2, fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                        {d.getDate()}
                      </Typography>
                    </Box>

                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography sx={{ fontWeight: 700, fontSize: '0.875rem', color: colors.text.primary, fontFamily: '"Plus Jakarta Sans", sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {event.name}
                      </Typography>
                      {event.location && (
                        <Typography sx={{ fontSize: '0.75rem', color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', fontWeight: 500, mt: 0.25, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 13 }} /> {event.location}
                        </Typography>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5 }}>
                        <Box sx={{ backgroundColor: badge.bg, color: badge.color, px: 1, py: 0.25, borderRadius: '0.25rem', fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', fontFamily: 'Manrope, sans-serif' }}>
                          {badge.label}
                        </Box>
                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 700, color: colors.text.secondary, fontFamily: 'Manrope, sans-serif' }}>
                          {d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                )
              })}
            </Stack>
          )}


        </Box>
      </Box>
    )
  }

  const renderQuickNavigation = () => {
    const navItems = [
      { label: 'Overview', Icon: DashboardIcon, sec: 0 },
      { label: 'Users', Icon: PeopleIcon, sec: 1 },
      { label: 'Events', Icon: EventIcon, sec: 2 },
      { label: 'Fundraising', Icon: MonetizationOnIcon, sec: 3 },
      { label: 'Content', Icon: EditNoteIcon, sec: 4 },
      { label: 'Statistics', Icon: AnalyticsIcon, sec: 5 },
    ]
    return (
      <Box>
        <Typography sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: '1.15rem', fontWeight: 700, color: colors.primary.main, mb: 3 }}>
          Quick Navigation
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
          {navItems.map(({ label, Icon, sec }) => (
            <Box
              key={label}
              onClick={() => setSection(sec)}
              sx={{
                backgroundColor: '#f1f5f2',
                borderRadius: '1.25rem',
                p: { xs: 2, sm: 3 },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: colors.primary.main,
                  '& .qnav-icon': { color: '#ffffff' },
                  '& .qnav-label': { color: '#ffffff' },
                },
              }}
            >
              <Icon className="qnav-icon" sx={{ fontSize: 32, color: colors.primary.main, transition: 'color 0.3s' }} />
              <Typography
                className="qnav-label"
                sx={{ fontWeight: 700, fontSize: '0.875rem', color: colors.text.primary, fontFamily: 'Manrope, sans-serif', transition: 'color 0.3s', textAlign: 'center' }}
              >
                {label}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>
    )
  }

  return (
    <>
    <Box
      component="main"
      sx={{
        minWidth: 0,
        overflow: 'hidden',
        p: { xs: 2, md: 4 },
        backgroundColor: colors.background.default,
      }}
    >
        {section !== 0 && (
          <Stack direction="row" alignItems="center" spacing={2} mb={4}>
            <Box sx={{ flex: 1 }}>
              <Typography
                variant="overline"
                sx={{ color: colors.primary.main, letterSpacing: '0.1em', display: 'block', mb: 0.25 }}
              >
                Admin
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700, color: colors.text.primary }}>
                {sectionTitles[section] || 'Admin Dashboard'}
              </Typography>
            </Box>
            <Tooltip title="Refresh">
              <span>
                <IconButton
                  onClick={() => {
                    getAllUsers()
                    getAllEvents()
                    getAllProjects()
                  }}
                  disabled={loading}
                  sx={{
                    backgroundColor: colors.background.paper,
                    borderRadius: '0.75rem',
                    '&:hover': { backgroundColor: colors.background.section },
                  }}
                >
                  <RefreshIcon />
                </IconButton>
              </span>
            </Tooltip>
          </Stack>
        )}

        <Container
          maxWidth="xl"
          disableGutters
          sx={{ width: '100%', maxWidth: 1400, mx: 'auto' }}
        >
          {(error || success) && (
            <Box my={2}>
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}
            </Box>
          )}

          {/* Quick nav shown on all non-overview sections */}
          {section !== 0 && (
            <Box mb={3}>
              {renderQuickNavigation()}
            </Box>
          )}

          {/* Overview */}
          {section === 0 && (
            <Box>
              {/* Welcome */}
              <Box sx={{ mb: 5 }}>
                <Typography
                  sx={{ fontFamily: '"Plus Jakarta Sans", sans-serif', fontSize: { xs: '1.75rem', md: '2.25rem' }, fontWeight: 800, color: colors.primary.main, lineHeight: 1.2 }}
                >
                  Welcome back, {authUser?.firstName || 'Admin'}!
                </Typography>
                <Typography sx={{ color: colors.text.secondary, fontFamily: 'Manrope, sans-serif', fontWeight: 500, mt: 0.75 }}>
                  Here's what's happening at Mill Creek Urban Farm today.
                </Typography>
              </Box>

              {/* Bento stat cards */}
              {renderStatsCards()}

              {/* Quick Nav + Events side by side */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
                  gap: 4,
                  mb: 5,
                }}
              >
                {/* Quick nav */}
                <Paper
                  elevation={0}
                  sx={{ p: 3, borderRadius: '1.5rem', backgroundColor: colors.background.paper, boxShadow: '0px 12px 32px rgba(24, 29, 27, 0.06)' }}
                >
                  {renderQuickNavigation()}
                </Paper>

                {/* Upcoming events */}
                {renderUpcomingEvents()}
              </Box>

            </Box>
          )}

          {/* Users */}
          {section === 1 && (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: 'none',
                  background: colors.background.paper,
                  overflow: 'hidden',
                }}
              >
                {/* Tabs header */}
                <Tabs
                  value={userTab}
                  onChange={(_, v) => setUserTab(v)}
                  sx={{
                    px: 3,
                    pt: 1,
                    borderBottom: 'none',
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                    '& .Mui-selected': { color: colors.primary.main },
                    '& .MuiTabs-indicator': { backgroundColor: colors.primary.main },
                  }}
                >
                  {!isStaff && <Tab label="Create & Edit Users" />}
                  <Tab label="User List" />
                </Tabs>

                {/* Tab 0 — Create & Edit (admin only) */}
                {!isStaff && userTab === 0 && (
                  <Stack spacing={3} sx={{ p: 3 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
                        Manage Users
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                        Create, update, or delete user accounts.
                      </Typography>
                    </Box>

                    <ManageUsersForms
                      loading={loading}
                      deleteUserId={deleteUserId}
                      onDeleteUserIdChange={setDeleteUserId}
                      onCreateUser={onCreateUser}
                      onUpdateUser={onUpdateUser}
                      onDeleteUser={onUserDelete}
                    />

                    <Divider />

                    <UserLookup
                      userId={userId}
                      userEmail={userEmail}
                      loading={loading}
                      onUserIdChange={setUserId}
                      onUserEmailChange={setUserEmail}
                      onFindById={onUserFind}
                      onFindByEmail={onUserFindByEmail}
                    />
                  </Stack>
                )}

                {/* Tab 1 — User List (for admin: index 1; for staff: index 0) */}
                {(isStaff ? userTab === 0 : userTab === 1) && (
                  <Stack spacing={3} sx={{ p: 3 }}>
                    <UserFilters
                      filterRole={filterRole}
                      filterEmail={filterEmail}
                      filterWaiver={filterWaiver}
                      loading={loading}
                      onRoleChange={setFilterRole}
                      onEmailChange={setFilterEmail}
                      onWaiverChange={setFilterWaiver}
                      onApplyFilters={onFilterUsers}
                      onResetFilters={resetUserFilters}
                    />

                    <Divider />

                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                      <UsersTable
                        users={users}
                        selectedUser={user}
                        loading={loading}
                        onRefresh={() => getAllUsers()}
                        onDeleteUser={isStaff ? undefined : onDeleteUserQuick}
                        onResendWaiver={isStaff ? undefined : onResendWaiver}
                        onOverrideWaiver={isStaff ? undefined : onOverrideWaiver}
                      />
                    </Box>

                    <Divider />

                    <FeedbackToUserSection
                      users={users}
                      loading={loading}
                      onSend={async ({ userId, category, message }) => {
                        await sendFeedback({ recipientUserId: userId, category, message })
                      }}
                    />
                  </Stack>
                )}
              </Paper>
            </Box>
          )}

          {/* Events */}
          {section === 2 && (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: 'none',
                  background: colors.background.paper,
                  overflow: 'hidden',
                }}
              >
                <Tabs
                  value={eventTab}
                  onChange={(_, v) => setEventTab(v)}
                  sx={{
                    px: 3,
                    pt: 1,
                    borderBottom: 'none',
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                    '& .Mui-selected': { color: colors.primary.main },
                    '& .MuiTabs-indicator': { backgroundColor: colors.primary.main },
                  }}
                >
                  {!isStaff && <Tab label="Create Event" />}
                  <Tab label="Event List" />
                </Tabs>

                {/* Tab 0 — Create Event (admin only) */}
                {!isStaff && eventTab === 0 && (
                  <Box sx={{ p: 3 }}>
                    <CreateEventForm
                      loading={loading}
                      onCreateEvent={onCreateEvent}
                    />
                  </Box>
                )}

                {/* Tab 1 — Event List (for admin: index 1; for staff: index 0) */}
                {(isStaff ? eventTab === 0 : eventTab === 1) && (
                  <Stack spacing={3} sx={{ p: 3 }}>
                    <EventFilters
                      filterStatus={filterStatus}
                      filterStartDate={filterStartDate}
                      filterEndDate={filterEndDate}
                      loading={loading}
                      onStatusChange={setFilterStatus}
                      onStartDateChange={setFilterStartDate}
                      onEndDateChange={setFilterEndDate}
                      onApplyFilters={onFilterEvents}
                      onResetFilters={() => getAllEvents()}
                    />

                    <Divider />

                    <Box sx={{ width: '100%', overflowX: 'auto' }}>
                      <EventsTable
                        events={events}
                        loading={loading}
                        onRefresh={() => getAllEvents()}
                        onDeleteEvent={isStaff ? undefined : onDeleteEvent}
                        onViewEvent={isStaff ? undefined : onViewEvent}
                        onViewAttendance={onViewAttendance}
                        onViewAttendanceQr={isStaff ? undefined : onOpenAttendanceQr}
                      />
                    </Box>
                  </Stack>
                )}
              </Paper>

              {/* Modal lives outside tabs — triggered from the table */}
              <EventModal
                open={eventModalOpen}
                onClose={onCloseEventModal}
                event={editingEvent}
                loading={loading}
                onSubmit={onUpdateEvent}
              />

              <Dialog open={attendanceDialogOpen} onClose={onCloseAttendanceDialog} maxWidth="lg" fullWidth>
                <DialogTitle>
                  Volunteer sign-ups
                  {attendancePayload?.event?.name ? ` — ${attendancePayload.event.name}` : ''}
                </DialogTitle>
                <DialogContent dividers>
                  {attendanceLoadingId && !attendancePayload ? (
                    <Stack alignItems="center" py={4} spacing={2}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary">
                        Loading roster…
                      </Typography>
                    </Stack>
                  ) : (
                    <Stack spacing={1.5}>
                      <Typography variant="body2" color="text.secondary">
                        {(attendancePayload?.attendance || []).length}{' '}
                        {(attendancePayload?.attendance || []).length === 1
                          ? 'person has'
                          : 'people have'}{' '}
                        registered. Self-service sign-in and sign-out times appear when volunteers use the
                        volunteer dashboard.
                      </Typography>
                      <TableContainer sx={{ maxHeight: 420 }}>
                        <Table size="small" stickyHeader>
                          <TableHead>
                            <TableRow>
                              <TableCell>Volunteer</TableCell>
                              <TableCell>Email</TableCell>
                              <TableCell>Registered</TableCell>
                              <TableCell sx={{ maxWidth: 160 }}>Note (at sign-up)</TableCell>
                              <TableCell>Signed in</TableCell>
                              <TableCell>Signed out</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {(attendancePayload?.attendance || []).length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7}>
                                  <Typography variant="body2" color="text.secondary">
                                    No one has registered for this event yet.
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ) : (
                              attendancePayload.attendance.map((row) => {
                                const rosterStatus = row.signedOutAt
                                  ? 'Completed'
                                  : row.signedInAt
                                    ? 'On site'
                                    : 'Registered'
                                const regNote = row.notes?.trim()
                                  ? row.notes.trim().length > 80
                                    ? `${row.notes.trim().slice(0, 80)}…`
                                    : row.notes.trim()
                                  : '—'
                                const showWaiverFlag =
                                  Boolean(attendancePayload.event?.waiverRequired) && row.waiverSigned === false
                                return (
                                  <TableRow key={row._id} hover>
                                    <TableCell>
                                      <Stack spacing={0.25}>
                                        <Typography variant="body2" fontWeight={500}>
                                          {[row.firstName, row.lastName].filter(Boolean).join(' ') || '—'}
                                        </Typography>
                                        {showWaiverFlag && (
                                          <Typography variant="caption" color="warning.main">
                                            Waiver flag not set on this registration
                                          </Typography>
                                        )}
                                      </Stack>
                                    </TableCell>
                                    <TableCell sx={{ wordBreak: 'break-all' }}>{row.email || '—'}</TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                      {row.registeredAt
                                        ? new Date(row.registeredAt).toLocaleString()
                                        : '—'}
                                    </TableCell>
                                    <TableCell sx={{ maxWidth: 200 }}>
                                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                                        {regNote}
                                      </Typography>
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                      {row.signedInAt ? new Date(row.signedInAt).toLocaleString() : '—'}
                                    </TableCell>
                                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                                      {row.signedOutAt ? new Date(row.signedOutAt).toLocaleString() : '—'}
                                    </TableCell>
                                    <TableCell>{rosterStatus}</TableCell>
                                  </TableRow>
                                )
                              })
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Stack>
                  )}
                </DialogContent>
                <DialogActions>
                  <Button onClick={onCloseAttendanceDialog}>Close</Button>
                </DialogActions>
              </Dialog>

              <Dialog open={attendanceQrDialogOpen} onClose={onCloseAttendanceQrDialog} maxWidth="sm" fullWidth>
                <DialogTitle>
                  Attendance QR
                  {attendanceQrEventName ? ` — ${attendanceQrEventName}` : ''}
                </DialogTitle>
                <DialogContent dividers>
                  {attendanceQrLoading ? (
                    <Stack alignItems="center" py={4} spacing={2}>
                      <CircularProgress size={32} />
                      <Typography variant="body2" color="text.secondary">
                        Loading link…
                      </Typography>
                    </Stack>
                  ) : attendanceQrUrl ? (
                    <Stack alignItems="center" spacing={2} py={1}>
                      <Typography variant="body2" color="text.secondary" textAlign="center">
                        Volunteers scan this code during the event to open the volunteer dashboard with a
                        valid link. Sign-in and sign-out work only during the scheduled event window.
                      </Typography>
                      <Box
                        sx={{
                          p: 2,
                          bgcolor: 'background.default',
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                        }}
                      >
                        <QRCodeSVG value={attendanceQrUrl} size={220} level="M" />
                      </Box>
                      <TextField
                        fullWidth
                        size="small"
                        label="Link"
                        value={attendanceQrUrl}
                        InputProps={{ readOnly: true }}
                      />
                      <Button
                        onClick={() => {
                          navigator.clipboard.writeText(attendanceQrUrl).then(
                            () => showSuccess('Link copied'),
                            () => showError('Could not copy link')
                          )
                        }}
                      >
                        Copy link
                      </Button>
                    </Stack>
                  ) : null}
                </DialogContent>
                <DialogActions>
                  <Button onClick={onCloseAttendanceQrDialog}>Close</Button>
                </DialogActions>
              </Dialog>
            </Box>
          )}

          {/* Fundraising */}
          {section === 3 && (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: 'none',
                  background: colors.background.paper,
                  overflow: 'hidden',
                }}
              >
                <Tabs
                  value={fundraisingTab}
                  onChange={(_, v) => {
                    setFundraisingTab(v)
                    // Payments tab index shifts when staff (no Create Campaign tab)
                    const paymentsIdx = isStaff ? 3 : 4
                    if (v === paymentsIdx) {
                      loadDonationPayments()
                    }
                  }}
                  sx={{
                    px: 3,
                    pt: 1,
                    borderBottom: 'none',
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                    '& .Mui-selected': { color: colors.primary.main },
                    '& .MuiTabs-indicator': { backgroundColor: colors.primary.main },
                  }}
                >
                  {!isStaff && <Tab label="Create Campaign" />}
                  <Tab label="Wishlist" />
                  <Tab label="Current Campaigns" />
                  <Tab label="Past Campaigns" />
                  <Tab label="Payments" />
                </Tabs>

                {/* Tab 0 — Create Campaign (admin only) */}
                {!isStaff && fundraisingTab === 0 && (
                  <Box sx={{ p: 3 }}>
                    <CreateProjectForm
                      loading={loading}
                      onCreateProject={onCreateProject}
                    />
                  </Box>
                )}

                {/* Tab 1 — Wishlist (for admin: index 1; for staff: index 0) */}
                {(isStaff ? fundraisingTab === 0 : fundraisingTab === 1) && (
                  <Box sx={{ p: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
                      Wishlist
                    </Typography>
                    <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
                      Track items the farm needs. Mark them as acquired when received.
                    </Typography>

                    {/* Add item form (admin only) */}
                    {!isStaff && (
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 3 }}>
                        <TextField
                          label="Item name"
                          size="small"
                          value={newWishlistName}
                          onChange={(e) => setNewWishlistName(e.target.value)}
                          sx={{ flex: 1 }}
                          onKeyDown={async (e) => {
                            if (e.key === 'Enter' && newWishlistName.trim()) {
                              try {
                                const res = await createWishlistItem({ name: newWishlistName.trim(), priority: newWishlistPriority, price: newWishlistPrice })
                                setWishlistItems((prev) => [...prev, res.data.item])
                                setNewWishlistName('')
                                setNewWishlistPrice('')
                              } catch (err) { console.error('Failed to add wishlist item', err) }
                            }
                          }}
                        />
                        <TextField
                          label="Price ($)"
                          size="small"
                          type="number"
                          value={newWishlistPrice}
                          onChange={(e) => setNewWishlistPrice(e.target.value)}
                          sx={{ width: 110 }}
                          inputProps={{ min: 0, step: 0.01 }}
                          placeholder="Optional"
                        />
                        <FormControl size="small" sx={{ minWidth: 130 }}>
                          <InputLabel>Priority</InputLabel>
                          <Select
                            value={newWishlistPriority}
                            label="Priority"
                            onChange={(e) => setNewWishlistPriority(e.target.value)}
                          >
                            <MenuItem value="high">High</MenuItem>
                            <MenuItem value="medium">Medium</MenuItem>
                            <MenuItem value="low">Low</MenuItem>
                          </Select>
                        </FormControl>
                        <button
                          disabled={!newWishlistName.trim() || wishlistLoading}
                          onClick={async () => {
                            if (!newWishlistName.trim()) return
                            try {
                              const res = await createWishlistItem({ name: newWishlistName.trim(), priority: newWishlistPriority, price: newWishlistPrice })
                              setWishlistItems((prev) => [...prev, res.data.item])
                              setNewWishlistName('')
                              setNewWishlistPrice('')
                            } catch (err) { console.error('Failed to add wishlist item', err) }
                          }}
                          style={{
                            padding: '8px 20px',
                            backgroundColor: newWishlistName.trim() ? colors.primary.main : colors.text.disabled,
                            color: '#fff',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: newWishlistName.trim() ? 'pointer' : 'not-allowed',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Add Item
                        </button>
                      </Stack>
                    )}

                    {/* Wishlist items */}
                    {wishlistLoading && (
                      <Typography variant="body2" sx={{ color: colors.text.secondary }}>Loading wishlist…</Typography>
                    )}
                    <Stack spacing={1.5}>
                      {wishlistItems.map((item) => {
                        const priorityColors = {
                          high: { bg: '#FEF2F2', text: colors.error.main },
                          medium: { bg: '#FDF3CC', text: colors.accent.dark },
                          low: { bg: colors.background.section, text: colors.text.secondary },
                        }
                        const pc = priorityColors[item.priority] || priorityColors.medium
                        return (
                          <Box
                            key={item._id}
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              p: 1.5,
                              borderRadius: 2,
                              border: 'none',
                              backgroundColor: item.acquired ? '#f5f5f5' : colors.background.paper,
                              opacity: item.acquired ? 0.6 : 1,
                              gap: 1,
                              flexWrap: 'wrap',
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <input
                                type="checkbox"
                                checked={item.acquired}
                                onChange={async () => {
                                  try {
                                    const res = await updateWishlistItem({ id: item._id, acquired: !item.acquired })
                                    setWishlistItems((prev) =>
                                      prev.map((w) => w._id === item._id ? res.data.item : w)
                                    )
                                  } catch (err) { console.error('Failed to update wishlist item', err) }
                                }}
                                style={{ width: 16, height: 16, cursor: 'pointer' }}
                              />
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  color: colors.text.primary,
                                  textDecoration: item.acquired ? 'line-through' : 'none',
                                }}
                              >
                                {item.name}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {item.price != null && (
                                <Typography variant="caption" sx={{ fontWeight: 700, color: colors.primary.main, whiteSpace: 'nowrap' }}>
                                  ${item.price.toLocaleString()}
                                </Typography>
                              )}
                              <Chip
                                label={item.priority}
                                size="small"
                                sx={{
                                  backgroundColor: pc.bg,
                                  color: pc.text,
                                  fontWeight: 600,
                                  fontSize: '11px',
                                  textTransform: 'capitalize',
                                }}
                              />
                              {!isStaff && (
                                <button
                                  onClick={async () => {
                                    try {
                                      await deleteWishlistItem({ id: item._id })
                                      setWishlistItems((prev) => prev.filter((w) => w._id !== item._id))
                                    } catch (err) { console.error('Failed to delete wishlist item', err) }
                                  }}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: colors.error.main,
                                    fontWeight: 700,
                                    fontSize: 16,
                                    lineHeight: 1,
                                    padding: '0 4px',
                                  }}
                                  title="Remove item"
                                >
                                  ×
                                </button>
                              )}
                            </Box>
                          </Box>
                        )
                      })}
                      {wishlistItems.length === 0 && (
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          No wishlist items yet. Add one above.
                        </Typography>
                      )}
                    </Stack>

                    {wishlistItems.some((i) => i.acquired) && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                          {wishlistItems.filter((i) => i.acquired).length} of {wishlistItems.length} items acquired
                        </Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Tab 2 — Current Campaigns (for admin: index 2; for staff: index 1) */}
                {(isStaff ? fundraisingTab === 1 : fundraisingTab === 2) && (() => {
                  const current = projects.filter(
                    (p) => p.status !== 'completed' && p.status !== 'cancelled'
                  )
                  return (
                    <Box sx={{ p: 3 }}>
                      {current.length === 0 ? (
                        <Typography color="textSecondary">
                          No active projects. Create one to get started!
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            gap: 2,
                          }}
                        >
                          {current.map((project) => (
                            <ProjectCard
                              key={project._id}
                              project={project}
                              formatDate={formatDate}
                              colors={colors}
                              onEdit={isStaff ? undefined : () => onStartEditProject(project)}
                              onDelete={isStaff ? undefined : () => setDeleteProjectId(project._id)}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  )
                })()}

                {/* Tab 3 — Past Campaigns (for admin: index 3; for staff: index 2) */}
                {(isStaff ? fundraisingTab === 2 : fundraisingTab === 3) && (() => {
                  const past = projects.filter(
                    (p) => p.status === 'completed' || p.status === 'cancelled'
                  )
                  return (
                    <Box sx={{ p: 3 }}>
                      {past.length === 0 ? (
                        <Typography color="textSecondary">
                          No past projects yet.
                        </Typography>
                      ) : (
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                            gap: 2,
                          }}
                        >
                          {past.map((project) => (
                            <ProjectCard
                              key={project._id}
                              project={project}
                              formatDate={formatDate}
                              colors={colors}
                              isPast
                              onEdit={isStaff ? undefined : () => onStartEditProject(project)}
                              onDelete={isStaff ? undefined : () => setDeleteProjectId(project._id)}
                            />
                          ))}
                        </Box>
                      )}
                    </Box>
                  )
                })()}

                {/* Tab 4 — Payments (for admin: index 4; for staff: index 3) */}
                {(isStaff ? fundraisingTab === 3 : fundraisingTab === 4) && (
                  <Box sx={{ p: 3 }}>
                    <Stack spacing={3}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
                          Donation Payments
                        </Typography>
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          Search by reference ID, PayPal transaction ID, PayPal order ID, or donor email.
                        </Typography>
                      </Box>

                      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ xs: 'stretch', md: 'center' }}>
                        <TextField
                          label="Reference / transaction / order / email"
                          value={paymentLookupQuery}
                          onChange={(e) => setPaymentLookupQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') onSearchPayments()
                          }}
                          sx={{ flex: 1, minWidth: 280 }}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <SearchIcon fontSize="small" />
                              </InputAdornment>
                            ),
                          }}
                        />
                        <FormControl size="small" sx={{ minWidth: 180 }}>
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={paymentStatusFilter}
                            label="Status"
                            onChange={(e) => setPaymentStatusFilter(e.target.value)}
                          >
                            <MenuItem value="">All statuses</MenuItem>
                            <MenuItem value="completed">Completed</MenuItem>
                            <MenuItem value="pending">Pending</MenuItem>
                            <MenuItem value="failed">Failed</MenuItem>
                            <MenuItem value="refunded">Refunded</MenuItem>
                          </Select>
                        </FormControl>
                        <FormControl size="small" sx={{ minWidth: 220 }}>
                          <InputLabel>Campaign</InputLabel>
                          <Select
                            value={paymentProjectFilter}
                            label="Campaign"
                            onChange={(e) => setPaymentProjectFilter(e.target.value)}
                          >
                            <MenuItem value="">All campaigns</MenuItem>
                            {projects.map((project) => (
                              <MenuItem key={project._id} value={project._id}>
                                {project.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                        <Button onClick={onSearchPayments} disabled={paymentLoading}>
                          Search
                        </Button>
                        <Button
                          onClick={resetPaymentFilters}
                          disabled={paymentLoading}
                          sx={{
                            backgroundColor: '#fff',
                            color: colors.text.primary,
                            boxShadow: 'none',
                            border: `1px solid ${colors.background.section}`,
                            '&:hover': {
                              backgroundColor: colors.background.section,
                              boxShadow: 'none',
                            },
                          }}
                        >
                          Reset
                        </Button>
                      </Stack>

                      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                        <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                          {paymentLoading ? 'Loading payments…' : `${paymentTotal} payment${paymentTotal === 1 ? '' : 's'} found`}
                        </Typography>
                        <Button
                          onClick={() => loadDonationPayments()}
                          disabled={paymentLoading}
                          sx={{
                            px: 0,
                            py: 0,
                            backgroundColor: 'transparent',
                            color: colors.primary.main,
                            boxShadow: 'none',
                            '&:hover': {
                              backgroundColor: 'transparent',
                              color: colors.primary.dark,
                              boxShadow: 'none',
                              transform: 'none',
                            },
                          }}
                        >
                          Refresh
                        </Button>
                      </Stack>

                      <TableContainer component={Paper} sx={{ borderRadius: '1rem', overflowX: 'auto' }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>Date</TableCell>
                              <TableCell>Reference ID</TableCell>
                              <TableCell>Transaction ID</TableCell>
                              <TableCell>Donor</TableCell>
                              <TableCell>Campaign</TableCell>
                              <TableCell align="right">Amount</TableCell>
                              <TableCell>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paymentLoading ? (
                              <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                  <CircularProgress size={24} />
                                </TableCell>
                              </TableRow>
                            ) : paymentResults.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} align="center" sx={{ py: 4, color: colors.text.secondary }}>
                                  No payments matched those filters.
                                </TableCell>
                              </TableRow>
                            ) : (
                              paymentResults.map((payment) => (
                                <TableRow key={payment._id} hover>
                                  <TableCell>
                                    {payment.donatedAt ? formatDate(payment.donatedAt) : '—'}
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                                    {payment.referenceId}
                                  </TableCell>
                                  <TableCell sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                                    {payment.providerTxnId || '—'}
                                  </TableCell>
                                  <TableCell>
                                    <Stack spacing={0.25}>
                                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                        {payment.donorName || 'Guest donor'}
                                      </Typography>
                                      <Typography variant="caption" sx={{ color: colors.text.secondary }}>
                                        {payment.donorEmail || 'No email on file'}
                                      </Typography>
                                    </Stack>
                                  </TableCell>
                                  <TableCell>{payment.project?.name || '—'}</TableCell>
                                  <TableCell align="right">
                                    {new Intl.NumberFormat('en-US', {
                                      style: 'currency',
                                      currency: payment.currency || 'USD',
                                    }).format(payment.amount || 0)}
                                  </TableCell>
                                  <TableCell>
                                    <Chip
                                      size="small"
                                      label={payment.paymentStatus}
                                      sx={{
                                        textTransform: 'capitalize',
                                        fontWeight: 600,
                                        backgroundColor:
                                          payment.paymentStatus === 'completed'
                                            ? '#E8F5E9'
                                            : payment.paymentStatus === 'pending'
                                              ? '#FFF7E0'
                                              : payment.paymentStatus === 'refunded'
                                                ? '#E3F2FD'
                                                : '#FDECEC',
                                        color:
                                          payment.paymentStatus === 'completed'
                                            ? '#1B5E20'
                                            : payment.paymentStatus === 'pending'
                                              ? '#8A6D1D'
                                              : payment.paymentStatus === 'refunded'
                                                ? '#0D47A1'
                                                : '#B71C1C',
                                      }}
                                    />
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </Stack>
                  </Box>
                )}
              </Paper>
            </Box>
          )}

          {/* Content Management */}
          {section === 4 && (
            <Box>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: 'none',
                  background: colors.background.paper,
                  overflow: 'hidden',
                }}
              >
                <Tabs
                  value={contentTab}
                  onChange={(_, v) => setContentTab(v)}
                  sx={{
                    px: 3,
                    pt: 1,
                    borderBottom: 'none',
                    '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
                    '& .Mui-selected': { color: colors.primary.main },
                    '& .MuiTabs-indicator': { backgroundColor: colors.primary.main },
                  }}
                >
                  <Tab label="General Text" />
                  <Tab label="Happening Now" />
                </Tabs>

                {/* Tab 0 — General Text */}
                {contentTab === 0 && (
                  <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text.primary }}>
                        Landing Page Text
                      </Typography>
                      {saving && (
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CircularProgress size={10} /> Saving...
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
                      Edit the text shown on the public home page.
                    </Typography>

                    {isStaff && (
                      <Alert severity="info" sx={{ mb: 2 }}>
                        You are viewing content in read-only mode. Contact an admin to make changes.
                      </Alert>
                    )}
                    <Stack spacing={3} sx={isStaff ? { pointerEvents: 'none', opacity: 0.7 } : {}}>
                      {/* Hero */}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1.5 }}>
                          Hero Section
                        </Typography>
                        <Stack spacing={2}>
                          <TextField
                            label="Hero Title"
                            size="small"
                            fullWidth
                            value={content.hero.title}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                hero: { ...prev.hero, title: e.target.value },
                              }))
                            }
                          />
                          <TextField
                            label="Hero Subtitle"
                            size="small"
                            fullWidth
                            multiline
                            rows={2}
                            value={content.hero.subtitle}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                hero: { ...prev.hero, subtitle: e.target.value },
                              }))
                            }
                          />
                          <TextField
                            label="Hero Image URL (leave blank to use default farm photo)"
                            size="small"
                            fullWidth
                            value={content.hero.image || ''}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                hero: { ...prev.hero, image: e.target.value },
                              }))
                            }
                          />
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Impact Stats */}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1.5 }}>
                          Impact Stats
                        </Typography>
                        <Stack spacing={2}>
                          {content.stats.map((stat, i) => (
                            <Stack key={i} direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                              <TextField
                                label={`Stat ${i + 1} Value`}
                                size="small"
                                sx={{ flex: 1 }}
                                value={stat.value}
                                onChange={(e) => {
                                  const updated = [...content.stats]
                                  updated[i] = { ...updated[i], value: e.target.value }
                                  updateContent((prev) => ({ ...prev, stats: updated }))
                                }}
                              />
                              <TextField
                                label={`Stat ${i + 1} Label`}
                                size="small"
                                sx={{ flex: 2 }}
                                value={stat.label}
                                onChange={(e) => {
                                  const updated = [...content.stats]
                                  updated[i] = { ...updated[i], label: e.target.value }
                                  updateContent((prev) => ({ ...prev, stats: updated }))
                                }}
                              />
                            </Stack>
                          ))}
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Farm Location */}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1.5 }}>
                          Farm Location
                        </Typography>
                        <Stack spacing={2}>
                          <TextField
                            label="Address"
                            size="small"
                            fullWidth
                            value={content.location?.address || ''}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                location: { ...prev.location, address: e.target.value },
                              }))
                            }
                          />
                          <TextField
                            label="Hours / Visitor Info"
                            size="small"
                            fullWidth
                            value={content.location?.hours || ''}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                location: { ...prev.location, hours: e.target.value },
                              }))
                            }
                          />
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Campaign Impact Stats */}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1.5 }}>
                          Campaign Impact Stats
                        </Typography>
                        <Stack spacing={2}>
                          <TextField
                            label="Annual Sustainability Target ($)"
                            size="small"
                            type="number"
                            fullWidth
                            helperText="Displayed as the Overall Goal on the Donation Campaigns page"
                            value={content.impactStats?.annualSustainabilityTarget ?? 90000}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                impactStats: { ...prev.impactStats, annualSustainabilityTarget: Number(e.target.value) },
                              }))
                            }
                          />
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                            <TextField
                              label="Lbs Organic Waste Composted"
                              size="small"
                              type="number"
                              sx={{ flex: 1 }}
                              value={content.impactStats?.compostLbs ?? 1200}
                              onChange={(e) =>
                                updateContent((prev) => ({
                                  ...prev,
                                  impactStats: { ...prev.impactStats, compostLbs: Number(e.target.value) },
                                }))
                              }
                            />
                            <TextField
                              label="Community Food Baskets Provided"
                              size="small"
                              type="number"
                              sx={{ flex: 1 }}
                              value={content.impactStats?.basketsProvided ?? 540}
                              onChange={(e) =>
                                updateContent((prev) => ({
                                  ...prev,
                                  impactStats: { ...prev.impactStats, basketsProvided: Number(e.target.value) },
                                }))
                              }
                            />
                          </Stack>
                        </Stack>
                      </Box>

                      <Divider />

                      {/* Footer */}
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1.5 }}>
                          Footer
                        </Typography>
                        <Stack spacing={2}>
                          <TextField
                            label="Contact Email"
                            size="small"
                            fullWidth
                            value={content.footer.email || ''}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                footer: { ...prev.footer, email: e.target.value },
                              }))
                            }
                          />
                          <TextField
                            label="Phone / Additional Contact Info"
                            size="small"
                            fullWidth
                            value={content.footer.contact || ''}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                footer: { ...prev.footer, contact: e.target.value },
                              }))
                            }
                          />
                          <TextField
                            label="Social Links"
                            size="small"
                            fullWidth
                            value={content.footer.social || ''}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                footer: { ...prev.footer, social: e.target.value },
                              }))
                            }
                          />
                          <TextField
                            label="Nonprofit Status / Copyright"
                            size="small"
                            fullWidth
                            value={content.footer.nonprofit || ''}
                            onChange={(e) =>
                              updateContent((prev) => ({
                                ...prev,
                                footer: { ...prev.footer, nonprofit: e.target.value },
                              }))
                            }
                          />
                        </Stack>
                      </Box>

                      <Divider />

                      {!isStaff && (
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button
                            onClick={resetContent}
                            style={{
                              padding: '8px 20px',
                              backgroundColor: 'transparent',
                              color: colors.error.main,
                              border: `1px solid ${colors.error.main}`,
                              borderRadius: 8,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Reset to Defaults
                          </button>
                        </Box>
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Tab 1 — Happening Now */}
                {contentTab === 1 && (() => {
                  const selectedEventIds = new Set(
                    content.happeningNow.volunteerOpportunities
                      .filter((op) => op.id)
                      .map((op) => op.id)
                  )
                  const selectedCampaignIds = new Set(
                    content.happeningNow.campaigns
                      .filter((c) => c.id)
                      .map((c) => c.id)
                  )

                  const toggleEvent = (event) => {
                    if (selectedEventIds.has(event._id)) {
                      updateContent((prev) => ({
                        ...prev,
                        happeningNow: {
                          ...prev.happeningNow,
                          volunteerOpportunities: prev.happeningNow.volunteerOpportunities.filter(
                            (op) => op.id !== event._id
                          ),
                        },
                      }))
                    } else {
                      const dateStr = event.date
                        ? new Date(event.date).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'TBD'
                      updateContent((prev) => ({
                        ...prev,
                        happeningNow: {
                          ...prev.happeningNow,
                          volunteerOpportunities: [
                            ...prev.happeningNow.volunteerOpportunities,
                            {
                              id: event._id,
                              title: event.name,
                              description: event.description || '',
                              date: dateStr,
                              visible: true,
                            },
                          ],
                        },
                      }))
                    }
                  }

                  const toggleCampaign = (project) => {
                    if (selectedCampaignIds.has(project._id)) {
                      updateContent((prev) => ({
                        ...prev,
                        happeningNow: {
                          ...prev.happeningNow,
                          campaigns: prev.happeningNow.campaigns.filter(
                            (c) => c.id !== project._id
                          ),
                        },
                      }))
                    } else {
                      const progress = project.goalAmount
                        ? Math.min(
                            100,
                            Math.round(((project.currentAmount || 0) / project.goalAmount) * 100)
                          )
                        : 0
                      updateContent((prev) => ({
                        ...prev,
                        happeningNow: {
                          ...prev.happeningNow,
                          campaigns: [
                            ...prev.happeningNow.campaigns,
                            {
                              id: project._id,
                              title: project.name,
                              description: project.description || '',
                              progress,
                              visible: true,
                            },
                          ],
                        },
                      }))
                    }
                  }

                  const upcomingEvents = events.filter(
                    (e) => e.status !== 'completed' && e.status !== 'cancelled'
                  ).sort((a, b) => new Date(a.date) - new Date(b.date))

                  const activeProjects = projects.filter(
                    (p) => p.status !== 'completed' && p.status !== 'cancelled'
                  )

                  return (
                    <Box sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: colors.text.primary, mb: 0.5 }}>
                        Happening Now Cards
                      </Typography>
                      <Typography variant="body2" sx={{ color: colors.text.secondary, mb: 3 }}>
                        Select which events and campaigns appear in the "Happening Now" section on the home page.
                      </Typography>

                      {isStaff && (
                        <Alert severity="info" sx={{ mb: 2 }}>
                          You are viewing content in read-only mode. Contact an admin to make changes.
                        </Alert>
                      )}

                      <Stack spacing={4} sx={isStaff ? { pointerEvents: 'none', opacity: 0.7 } : {}}>
                        {/* Volunteer Opportunities */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.text.primary }}>
                              Volunteer Opportunities
                            </Typography>
                            <Chip
                              label={`${selectedEventIds.size} selected`}
                              size="small"
                              sx={{ backgroundColor: '#c8e6c9', color: colors.primary.dark, fontWeight: 600 }}
                            />
                          </Box>

                          {upcomingEvents.length === 0 ? (
                            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                              No upcoming events found. Create events in the Events section first.
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                              {upcomingEvents.map((event) => {
                                const checked = selectedEventIds.has(event._id)
                                return (
                                  <Box
                                    key={event._id}
                                    onClick={() => toggleEvent(event)}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      p: 1.5,
                                      borderRadius: 2,
                                      border: checked ? `1.5px solid ${colors.primary.main}` : 'none',
                                      backgroundColor: checked ? 'rgba(27, 94, 32, 0.07)' : colors.background.section,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      '&:hover': {
                                        backgroundColor: checked ? '#D6EDE1' : colors.background.section,
                                      },
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleEvent(event)}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: colors.primary.main }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary }}>
                                        {event.name}
                                      </Typography>
                                      {event.description && (
                                        <Typography
                                          variant="caption"
                                          sx={{ color: colors.text.secondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        >
                                          {event.description}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                                      {event.date && (
                                        <Typography variant="caption" sx={{ color: colors.text.secondary, whiteSpace: 'nowrap' }}>
                                          {new Date(event.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </Typography>
                                      )}
                                      <Chip
                                        label={event.eventType || event.status}
                                        size="small"
                                        sx={{ fontSize: '11px', textTransform: 'capitalize', backgroundColor: colors.background.section, color: colors.text.secondary }}
                                      />
                                    </Stack>
                                  </Box>
                                )
                              })}
                            </Stack>
                          )}
                        </Box>

                        <Divider />

                        {/* Donation Campaigns */}
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: colors.text.primary }}>
                              Donation Campaigns
                            </Typography>
                            <Chip
                              label={`${selectedCampaignIds.size} selected`}
                              size="small"
                              sx={{ backgroundColor: '#FDF3CC', color: colors.accent.dark, fontWeight: 600 }}
                            />
                          </Box>

                          {activeProjects.length === 0 ? (
                            <Typography variant="body2" sx={{ color: colors.text.secondary }}>
                              No active campaigns found. Create campaigns in the Fundraising section first.
                            </Typography>
                          ) : (
                            <Stack spacing={1}>
                              {activeProjects.map((project) => {
                                const checked = selectedCampaignIds.has(project._id)
                                const progress = project.goalAmount
                                  ? Math.min(100, Math.round(((project.currentAmount || 0) / project.goalAmount) * 100))
                                  : 0
                                return (
                                  <Box
                                    key={project._id}
                                    onClick={() => toggleCampaign(project)}
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 2,
                                      p: 1.5,
                                      borderRadius: 2,
                                      border: checked ? `1.5px solid ${colors.accent.main}` : 'none',
                                      backgroundColor: checked ? '#FDF3CC' : colors.background.section,
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      '&:hover': {
                                        backgroundColor: checked ? '#FAE89A' : colors.background.section,
                                      },
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleCampaign(project)}
                                      onClick={(e) => e.stopPropagation()}
                                      style={{ width: 16, height: 16, cursor: 'pointer', accentColor: colors.accent.dark }}
                                    />
                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 600, color: colors.text.primary }}>
                                        {project.name}
                                      </Typography>
                                      {project.description && (
                                        <Typography
                                          variant="caption"
                                          sx={{ color: colors.text.secondary, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                                        >
                                          {project.description}
                                        </Typography>
                                      )}
                                    </Box>
                                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
                                      <Typography variant="caption" sx={{ color: colors.text.secondary, whiteSpace: 'nowrap' }}>
                                        {progress}% funded
                                      </Typography>
                                      <Chip
                                        label={project.status}
                                        size="small"
                                        sx={{ fontSize: '11px', textTransform: 'capitalize', backgroundColor: colors.background.section, color: colors.text.secondary }}
                                      />
                                    </Stack>
                                  </Box>
                                )
                              })}
                            </Stack>
                          )}
                        </Box>
                      </Stack>
                    </Box>
                  )
                })()}
              </Paper>
            </Box>
          )}

          {/* Statistics */}
          {section === 5 && (
            <Box>
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Statistics & Analytics
                </Typography>
                <Button onClick={loadAnalytics} disabled={analyticsLoading} size="small" sx={{ borderRadius: '8px', textTransform: 'none' }}>
                  {analyticsLoading ? 'Loading…' : donationStats ? 'Refresh' : 'Load Data'}
                </Button>
              </Stack>

              {!donationStats && !eventStats && !analyticsLoading && (
                <Alert severity="info" sx={{ mb: 3 }}>Click "Load Data" to fetch the latest analytics.</Alert>
              )}

              {analyticsLoading && (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography color="text.secondary">Loading analytics…</Typography>
                </Box>
              )}

              {donationStats && (
                <Stack spacing={4}>
                  {/* Monthly donations */}
                  <Paper sx={{ p: 3, borderRadius: '1rem' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Monthly Donations (last 12 months)
                    </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={donationStats.monthlyTotals} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                        <RechartsTooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Total']} />
                        <Bar dataKey="total" fill={colors.primary.main} radius={[4, 4, 0, 0]} name="Donations ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>

                  {/* Top campaigns */}
                  <Paper sx={{ p: 3, borderRadius: '1rem' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Top Campaigns by Total Raised
                    </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={donationStats.byCampaign} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                        <RechartsTooltip formatter={(v) => [`$${v.toFixed(2)}`, 'Raised']} />
                        <Bar dataKey="total" fill={colors.secondary?.main || '#7c5c3a'} radius={[0, 4, 4, 0]} name="Raised ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>
                </Stack>
              )}

              {eventStats && (
                <Stack spacing={4} sx={{ mt: donationStats ? 4 : 0 }}>
                  {/* Monthly volunteer hours */}
                  <Paper sx={{ p: 3, borderRadius: '1rem' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                      Monthly Volunteer Activity (last 12 months)
                    </Typography>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={eventStats.monthlyHours} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                        <RechartsTooltip />
                        <Legend />
                        <Bar yAxisId="left" dataKey="hours" fill={colors.primary.main} radius={[4, 4, 0, 0]} name="Hours Credited" />
                        <Bar yAxisId="right" dataKey="registrations" fill="#acf4a4" radius={[4, 4, 0, 0]} name="Registrations" />
                      </BarChart>
                    </ResponsiveContainer>
                  </Paper>

                  {/* Top events by hours */}
                  {eventStats.topEvents.length > 0 && (
                    <Paper sx={{ p: 3, borderRadius: '1rem' }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Top Events by Volunteer Hours
                      </Typography>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={eventStats.topEvents} layout="vertical" margin={{ top: 4, right: 40, left: 8, bottom: 4 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis type="number" tick={{ fontSize: 12 }} />
                          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                          <RechartsTooltip />
                          <Bar dataKey="totalHours" fill={colors.primary.main} radius={[0, 4, 4, 0]} name="Total Hours" />
                        </BarChart>
                      </ResponsiveContainer>
                    </Paper>
                  )}
                </Stack>
              )}
            </Box>
          )}

        </Container>
    </Box>
      {/* Edit Campaign Modal */}
      <Dialog open={Boolean(editingProject)} onClose={() => setEditingProject(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Edit Campaign</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Name"
              size="small"
              fullWidth
              required
              value={editFormData.name || ''}
              onChange={(e) => setEditFormData((p) => ({ ...p, name: e.target.value }))}
            />
            <TextField
              label="Description"
              size="small"
              fullWidth
              required
              multiline
              rows={3}
              value={editFormData.description || ''}
              onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))}
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Goal Amount ($)"
                size="small"
                type="number"
                required
                sx={{ flex: 1 }}
                value={editFormData.goalAmount ?? ''}
                onChange={(e) => setEditFormData((p) => ({ ...p, goalAmount: e.target.value }))}
              />
              <TextField
                label="Priority"
                size="small"
                type="number"
                required
                sx={{ width: 100 }}
                value={editFormData.priority ?? ''}
                onChange={(e) => setEditFormData((p) => ({ ...p, priority: e.target.value }))}
              />
            </Stack>
            <FormControl size="small" fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={editFormData.status || 'active'}
                label="Status"
                onChange={(e) => setEditFormData((p) => ({ ...p, status: e.target.value }))}
              >
                <MenuItem value="proposed">Proposed</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <TextField
                label="Start Date"
                size="small"
                type="date"
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
                value={editFormData.startDate || ''}
                onChange={(e) => setEditFormData((p) => ({ ...p, startDate: e.target.value }))}
              />
              <TextField
                label="End Date"
                size="small"
                type="date"
                sx={{ flex: 1 }}
                InputLabelProps={{ shrink: true }}
                value={editFormData.targetEndDate || ''}
                onChange={(e) => setEditFormData((p) => ({ ...p, targetEndDate: e.target.value }))}
              />
            </Stack>

            {/* Gallery Images */}
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, color: colors.text.primary, mb: 1 }}>
                Gallery Images
              </Typography>
              <Stack spacing={1} sx={{ mb: 1.5 }}>
                {editImages.map((img, i) => (
                  <Stack key={i} direction="row" alignItems="center" spacing={1}>
                    <Box
                      component="img"
                      src={img.url}
                      alt={img.caption || ''}
                      sx={{ width: 48, height: 36, objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }}
                      onError={(e) => { e.target.style.display = 'none' }}
                    />
                    <Typography variant="caption" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: colors.text.secondary }}>
                      {img.caption || img.url}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setEditImages((prev) => prev.filter((_, idx) => idx !== i))}
                      sx={{ color: colors.error?.main || '#d32f2f' }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <TextField
                  label="Image URL"
                  size="small"
                  sx={{ flex: 2 }}
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://..."
                />
                <TextField
                  label="Caption (optional)"
                  size="small"
                  sx={{ flex: 1 }}
                  value={newImageCaption}
                  onChange={(e) => setNewImageCaption(e.target.value)}
                />
                <Button
                  size="small"
                  variant="outlined"
                  disabled={!newImageUrl.trim()}
                  onClick={() => {
                    if (!newImageUrl.trim()) return
                    setEditImages((prev) => [...prev, { url: newImageUrl.trim(), caption: newImageCaption.trim() }])
                    setNewImageUrl('')
                    setNewImageCaption('')
                  }}
                  sx={{ whiteSpace: 'nowrap', borderRadius: '8px', textTransform: 'none', mt: 0.25 }}
                >
                  Add
                </Button>
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditingProject(null)} variant="secondary">Cancel</Button>
          <Button onClick={onUpdateProject} loading={loading} disabled={loading}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Campaign Confirmation */}
      <Dialog open={Boolean(deleteProjectId)} onClose={() => setDeleteProjectId(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Campaign?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary">
            This will permanently delete the campaign. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteProjectId(null)} variant="secondary">Cancel</Button>
          <Button
            onClick={onConfirmDeleteProject}
            loading={loading}
            disabled={loading}
            sx={{ backgroundColor: '#d32f2f', '&:hover': { backgroundColor: '#b71c1c' } }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
