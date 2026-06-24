import { useState, useEffect, useCallback } from 'react'
import { Navigate } from 'react-router-dom'
import {
  Box,
  Typography,
  Stack,
  Alert,
  Tabs,
  Tab,
  Paper,
  Button,
  Collapse,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material'
import StorageIcon from '@mui/icons-material/Storage'
import DownloadIcon from '@mui/icons-material/Download'
import GrassIcon from '@mui/icons-material/Grass'
import LocalShippingIcon from '@mui/icons-material/LocalShipping'
import ListAltIcon from '@mui/icons-material/ListAlt'
import RecyclingIcon from '@mui/icons-material/Recycling'
import InventoryIcon from '@mui/icons-material/Inventory'
import SpaIcon from '@mui/icons-material/Spa'
import AssignmentIcon from '@mui/icons-material/Assignment'
import NoteAddIcon from '@mui/icons-material/NoteAdd'
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown'
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp'
import DeleteIcon from '@mui/icons-material/Delete'
import to from 'await-to-js'
import { useAuth } from '../context/AuthContext'
import { colors } from '../theme/colors'
import {
  createInventoryLog,
  getInventoryLogs,
  deleteInventoryLog,
  createInventoryRequest,
  getInventoryRequests,
  approveInventoryRequest,
  rejectInventoryRequest,
  exportProduceCsv,
  getNetTotals,
} from '../api/inventory'
import HarvestLogForm from '../components/inventory/HarvestLogForm'
import DistributionLogForm from '../components/inventory/DistributionLogForm'
import CompostLogForm from '../components/inventory/CompostLogForm'
import InventoryLogsTable from '../components/inventory/InventoryLogsTable'
import InventoryFilters from '../components/inventory/InventoryFilters'
import InventoryStats from '../components/inventory/InventoryStats'
import SuppliesLogForm from '../components/inventory/SuppliesLogForm'
import SeedLogForm from '../components/inventory/SeedLogForm'
import ApprovalQueue from '../components/inventory/ApprovalQueue'

// Collapsible section used in View Logs tab
function CollapsibleSection({ icon, title, count, open, onToggle, children }) {
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        onClick={onToggle}
        sx={{
          pb: 1.5,
          cursor: 'pointer',
          userSelect: 'none',
          borderBottom: `2px solid ${open ? colors.primary.main : colors.background.section}`,
          transition: 'border-color 0.2s',
          '&:hover .section-title': { color: colors.primary.main },
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ color: colors.primary.main, display: 'flex', alignItems: 'center' }}>
            {icon}
          </Box>
          <Typography
            className="section-title"
            variant="h6"
            sx={{ fontWeight: 700, color: colors.text.primary, transition: 'color 0.15s' }}
          >
            {title}
          </Typography>
          {count !== undefined && (
            <Chip
              label={`${count} logs`}
              size="small"
              sx={{ backgroundColor: colors.background.section, fontWeight: 500 }}
            />
          )}
        </Stack>
        <IconButton size="small" sx={{ pointerEvents: 'none', color: colors.text.secondary }}>
          {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        </IconButton>
      </Stack>
      <Collapse in={open} timeout="auto">
        <Stack spacing={3} mt={2}>
          {children}
        </Stack>
      </Collapse>
    </Box>
  )
}

// Log type options for the Logger tab card selector
const LOG_TYPE_OPTIONS = [
  { value: 'harvest', icon: <GrassIcon />, label: 'Harvest', desc: 'Crops picked today' },
  { value: 'compost', icon: <RecyclingIcon />, label: 'Compost', desc: 'Composted materials' },
  { value: 'seed', icon: <SpaIcon />, label: 'Seeds', desc: 'Seeds received or saved' },
  { value: 'supplies', icon: <InventoryIcon />, label: 'Supplies', desc: 'Tools & equipment' },
]

export default function Inventory() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isStaff = user?.role === 'staff'

  // Tab + logger state
  const [activeTab, setActiveTab] = useState(0)
  const [logType, setLogType] = useState('harvest')

  // Alerts
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // ── Harvest & Compost section ──────────────────────────────────────────────
  const [logs, setLogs] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [filterType, setFilterType] = useState('')
  const [filterCropType, setFilterCropType] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)

  // ── Seed section ───────────────────────────────────────────────────────────
  const [seedLogs, setSeedLogs] = useState([])
  const [seedTotal, setSeedTotal] = useState(0)
  const [seedLoading, setSeedLoading] = useState(false)
  const [seedPage, setSeedPage] = useState(0)
  const [seedRowsPerPage, setSeedRowsPerPage] = useState(10)
  const [filterSeedCropType, setFilterSeedCropType] = useState('')
  const [filterSeedStartDate, setFilterSeedStartDate] = useState('')
  const [filterSeedEndDate, setFilterSeedEndDate] = useState('')

  // ── Distribution section (admin only) ─────────────────────────────────────
  const [distLogs, setDistLogs] = useState([])
  const [distTotal, setDistTotal] = useState(0)
  const [distLoading, setDistLoading] = useState(false)
  const [distPage, setDistPage] = useState(0)
  const [distRowsPerPage, setDistRowsPerPage] = useState(10)
  const [filterDistCropType, setFilterDistCropType] = useState('')
  const [filterDistStartDate, setFilterDistStartDate] = useState('')
  const [filterDistEndDate, setFilterDistEndDate] = useState('')

  // ── Supplies section ───────────────────────────────────────────────────────
  const [suppliesLogs, setSuppliesLogs] = useState([])
  const [suppliesTotal, setSuppliesTotal] = useState(0)
  const [suppliesLoading, setSuppliesLoading] = useState(false)
  const [suppliesPage, setSuppliesPage] = useState(0)
  const [suppliesRowsPerPage, setSuppliesRowsPerPage] = useState(10)
  const [filterSupplyItem, setFilterSupplyItem] = useState('')
  const [filterSupplyStartDate, setFilterSupplyStartDate] = useState('')
  const [filterSupplyEndDate, setFilterSupplyEndDate] = useState('')

  // ── Approval queue ─────────────────────────────────────────────────────────
  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(false)

  // ── Net totals ─────────────────────────────────────────────────────────────
  const [netTotals, setNetTotals] = useState([])

  // ── Section collapse state ─────────────────────────────────────────────────
  const [sectionOpen, setSectionOpen] = useState({
    harvest: true,
    seed: true,
    distribution: true,
    supplies: true,
  })
  const toggleSection = (key) =>
    setSectionOpen((prev) => ({ ...prev, [key]: !prev[key] }))

  // ── Crop logs dialog ───────────────────────────────────────────────────────
  const [cropDialog, setCropDialog] = useState({ open: false, cropType: '', logs: [], loading: false })

  const handleOpenCropLogs = async (cropType) => {
    setCropDialog({ open: true, cropType, logs: [], loading: true })
    const [err, res] = await to(
      getInventoryLogs({ cropType, type: 'harvest,compost,distribution', limit: 50, skip: 0 })
    )
    setCropDialog((prev) => ({
      ...prev,
      loading: false,
      logs: err ? [] : (res.data.produce || []),
    }))
  }

  const handleDeleteFromCropDialog = async (id) => {
    const [err] = await to(deleteInventoryLog({ id }))
    if (err) { showError('Failed to delete log'); return }
    setCropDialog((prev) => ({ ...prev, logs: prev.logs.filter((l) => l._id !== id) }))
    fetchLogs()
    fetchDistLogs()
    fetchNetTotalsData()
  }

  const handleCloseCropDialog = () =>
    setCropDialog({ open: false, cropType: '', logs: [], loading: false })

  // Auto-clear alerts
  useEffect(() => {
    if (!error) return
    const timer = setTimeout(() => setError(null), 5000)
    return () => clearTimeout(timer)
  }, [error])

  useEffect(() => {
    if (!success) return
    const timer = setTimeout(() => setSuccess(null), 4000)
    return () => clearTimeout(timer)
  }, [success])

  const showError = (msg) => { setError(msg); setSuccess(null) }
  const showSuccess = (msg) => { setSuccess(msg); setError(null) }

  // ── Fetch functions ────────────────────────────────────────────────────────

  const fetchLogs = useCallback(async (filters = {}) => {
    setLoading(true)
    const params = {
      type: 'harvest,compost',
      limit: filters.limit ?? rowsPerPage,
      skip: filters.skip ?? page * rowsPerPage,
    }
    if (filters.type !== undefined ? filters.type : filterType)
      params.type = filters.type !== undefined ? filters.type : filterType
    if (filters.cropType !== undefined ? filters.cropType : filterCropType)
      params.cropType = filters.cropType !== undefined ? filters.cropType : filterCropType
    if (filters.startDate !== undefined ? filters.startDate : filterStartDate)
      params.startDate = filters.startDate !== undefined ? filters.startDate : filterStartDate
    if (filters.endDate !== undefined ? filters.endDate : filterEndDate)
      params.endDate = filters.endDate !== undefined ? filters.endDate : filterEndDate
    // If type filter is set but not in harvest/compost, fall back to allowed range
    if (!params.type) params.type = 'harvest,compost'

    const [err, res] = await to(getInventoryLogs(params))
    setLoading(false)
    if (err) { showError(err.response?.data?.error || 'Failed to fetch produce logs'); return }
    setLogs(res.data.produce || [])
    setTotal(res.data.total || 0)
  }, [filterType, filterCropType, filterStartDate, filterEndDate, page, rowsPerPage])

  const fetchSeedLogs = useCallback(async (filters = {}) => {
    setSeedLoading(true)
    const params = {
      type: 'seed',
      limit: filters.limit ?? seedRowsPerPage,
      skip: filters.skip ?? seedPage * seedRowsPerPage,
    }
    if (filters.cropType !== undefined ? filters.cropType : filterSeedCropType)
      params.cropType = filters.cropType !== undefined ? filters.cropType : filterSeedCropType
    if (filters.startDate !== undefined ? filters.startDate : filterSeedStartDate)
      params.startDate = filters.startDate !== undefined ? filters.startDate : filterSeedStartDate
    if (filters.endDate !== undefined ? filters.endDate : filterSeedEndDate)
      params.endDate = filters.endDate !== undefined ? filters.endDate : filterSeedEndDate

    const [err, res] = await to(getInventoryLogs(params))
    setSeedLoading(false)
    if (err) { showError(err.response?.data?.error || 'Failed to fetch seed logs'); return }
    setSeedLogs(res.data.produce || [])
    setSeedTotal(res.data.total || 0)
  }, [seedPage, seedRowsPerPage, filterSeedCropType, filterSeedStartDate, filterSeedEndDate])

  const fetchDistLogs = useCallback(async (filters = {}) => {
    if (!isAdmin) return
    setDistLoading(true)
    const params = {
      type: 'distribution',
      limit: filters.limit ?? distRowsPerPage,
      skip: filters.skip ?? distPage * distRowsPerPage,
    }
    if (filters.cropType !== undefined ? filters.cropType : filterDistCropType)
      params.cropType = filters.cropType !== undefined ? filters.cropType : filterDistCropType
    if (filters.startDate !== undefined ? filters.startDate : filterDistStartDate)
      params.startDate = filters.startDate !== undefined ? filters.startDate : filterDistStartDate
    if (filters.endDate !== undefined ? filters.endDate : filterDistEndDate)
      params.endDate = filters.endDate !== undefined ? filters.endDate : filterDistEndDate

    const [err, res] = await to(getInventoryLogs(params))
    setDistLoading(false)
    if (err) { showError(err.response?.data?.error || 'Failed to fetch distribution logs'); return }
    setDistLogs(res.data.produce || [])
    setDistTotal(res.data.total || 0)
  }, [isAdmin, distPage, distRowsPerPage, filterDistCropType, filterDistStartDate, filterDistEndDate])

  const fetchSupplies = useCallback(async (filters = {}) => {
    setSuppliesLoading(true)
    const params = {
      type: 'supplies',
      limit: filters.limit ?? suppliesRowsPerPage,
      skip: filters.skip ?? suppliesPage * suppliesRowsPerPage,
    }
    if (filters.cropType !== undefined ? filters.cropType : filterSupplyItem)
      params.cropType = filters.cropType !== undefined ? filters.cropType : filterSupplyItem
    if (filters.startDate !== undefined ? filters.startDate : filterSupplyStartDate)
      params.startDate = filters.startDate !== undefined ? filters.startDate : filterSupplyStartDate
    if (filters.endDate !== undefined ? filters.endDate : filterSupplyEndDate)
      params.endDate = filters.endDate !== undefined ? filters.endDate : filterSupplyEndDate

    const [err, res] = await to(getInventoryLogs(params))
    setSuppliesLoading(false)
    if (err) { showError(err.response?.data?.error || 'Failed to fetch supplies logs'); return }
    setSuppliesLogs(res.data.produce || [])
    setSuppliesTotal(res.data.total || 0)
  }, [suppliesPage, suppliesRowsPerPage, filterSupplyItem, filterSupplyStartDate, filterSupplyEndDate])

  const fetchNetTotalsData = useCallback(async (cropType = '') => {
    const params = cropType ? { cropType } : {}
    const [err, res] = await to(getNetTotals(params))
    if (!err) setNetTotals(res.data.totals || [])
  }, [])

  const fetchRequests = useCallback(async () => {
    setRequestsLoading(true)
    const [err, res] = await to(getInventoryRequests({ status: 'pending' }))
    setRequestsLoading(false)
    if (err) { showError(err.response?.data?.error || 'Failed to fetch approval requests'); return }
    setRequests(res.data.requests || [])
  }, [])

  // Initial load + pagination side effects
  useEffect(() => {
    if (isAuthenticated) {
      fetchLogs()
      fetchSeedLogs()
      fetchDistLogs()
      fetchSupplies()
      fetchNetTotalsData()
      if (isAdmin) fetchRequests()
    }
  }, [isAuthenticated, page, rowsPerPage])

  useEffect(() => {
    if (isAuthenticated) fetchSeedLogs()
  }, [seedPage, seedRowsPerPage])

  useEffect(() => {
    if (isAuthenticated) fetchDistLogs()
  }, [distPage, distRowsPerPage])

  useEffect(() => {
    if (isAuthenticated) fetchSupplies()
  }, [suppliesPage, suppliesRowsPerPage])

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleCreateLog = async (logData) => {
    setLoading(true)
    const [err] = await to(createInventoryLog(logData))
    setLoading(false)
    if (err) { showError(err.response?.data?.error || 'Failed to create inventory log'); return }

    const typeLabels = { harvest: 'Harvest', distribution: 'Distribution', compost: 'Compost', supplies: 'Supplies', seed: 'Seed' }
    showSuccess(`${typeLabels[logData.type] || logData.type} log created successfully!`)

    if (logData.type === 'supplies') {
      setSuppliesPage(0); fetchSupplies({ skip: 0 })
    } else if (logData.type === 'seed') {
      setSeedPage(0); fetchSeedLogs({ skip: 0 })
    } else if (logData.type === 'distribution') {
      setDistPage(0); fetchDistLogs({ skip: 0 })
    } else {
      setPage(0); fetchLogs({ skip: 0 })
    }
    fetchNetTotalsData()
  }

  const handleSubmitLog = async (logData) => {
    if (isAdmin) return handleCreateLog(logData)
    setLoading(true)
    const [err] = await to(createInventoryRequest({ action: 'create', payload: logData }))
    setLoading(false)
    if (err) { showError(err.response?.data?.error || 'Failed to submit request'); return }
    showSuccess('Request submitted for admin approval!')
  }

  const handleApproveRequest = async (id) => {
    const [err] = await to(approveInventoryRequest(id))
    if (err) { showError(err.response?.data?.error || 'Failed to approve request'); return }
    showSuccess('Request approved and log created!')
    fetchRequests()
    fetchLogs()
    fetchSeedLogs()
    fetchDistLogs()
    fetchSupplies()
    fetchNetTotalsData()
  }

  const handleRejectRequest = async (id, notes) => {
    const [err] = await to(rejectInventoryRequest(id, { notes }))
    if (err) { showError(err.response?.data?.error || 'Failed to reject request'); return }
    showSuccess('Request rejected.')
    fetchRequests()
  }

  const handleDeleteLog = async (id) => {
    const [err] = await to(deleteInventoryLog({ id }))
    if (err) { showError(err.response?.data?.error || 'Failed to delete log'); return }
    showSuccess('Log deleted.')
    fetchLogs()
    fetchNetTotalsData()
  }

  const handleDeleteSeedLog = async (id) => {
    const [err] = await to(deleteInventoryLog({ id }))
    if (err) { showError(err.response?.data?.error || 'Failed to delete seed log'); return }
    showSuccess('Seed log deleted.')
    fetchSeedLogs()
  }

  const handleDeleteDistLog = async (id) => {
    const [err] = await to(deleteInventoryLog({ id }))
    if (err) { showError(err.response?.data?.error || 'Failed to delete distribution log'); return }
    showSuccess('Distribution log deleted.')
    fetchDistLogs()
    fetchNetTotalsData()
  }

  const handleDeleteSupplyLog = async (id) => {
    const [err] = await to(deleteInventoryLog({ id }))
    if (err) { showError(err.response?.data?.error || 'Failed to delete supply log'); return }
    showSuccess('Supply log deleted.')
    fetchSupplies()
  }

  // ── Filter handlers ────────────────────────────────────────────────────────

  const handleApplyFilters = () => {
    setPage(0)
    const type = filterType || 'harvest,compost'
    fetchLogs({ type, cropType: filterCropType, startDate: filterStartDate, endDate: filterEndDate, skip: 0 })
    fetchNetTotalsData(filterCropType)
  }

  const handleResetFilters = () => {
    setFilterType(''); setFilterCropType(''); setFilterStartDate(''); setFilterEndDate(''); setPage(0)
    fetchLogs({ type: 'harvest,compost', cropType: '', startDate: '', endDate: '', skip: 0 })
    fetchNetTotalsData()
  }

  const handleApplySeedFilters = () => {
    setSeedPage(0)
    fetchSeedLogs({ cropType: filterSeedCropType, startDate: filterSeedStartDate, endDate: filterSeedEndDate, skip: 0 })
  }

  const handleResetSeedFilters = () => {
    setFilterSeedCropType(''); setFilterSeedStartDate(''); setFilterSeedEndDate(''); setSeedPage(0)
    fetchSeedLogs({ cropType: '', startDate: '', endDate: '', skip: 0 })
  }

  const handleApplyDistFilters = () => {
    setDistPage(0)
    fetchDistLogs({ cropType: filterDistCropType, startDate: filterDistStartDate, endDate: filterDistEndDate, skip: 0 })
  }

  const handleResetDistFilters = () => {
    setFilterDistCropType(''); setFilterDistStartDate(''); setFilterDistEndDate(''); setDistPage(0)
    fetchDistLogs({ cropType: '', startDate: '', endDate: '', skip: 0 })
  }

  const handleApplySuppliesFilters = () => {
    setSuppliesPage(0)
    fetchSupplies({ cropType: filterSupplyItem, startDate: filterSupplyStartDate, endDate: filterSupplyEndDate, skip: 0 })
  }

  const handleResetSuppliesFilters = () => {
    setFilterSupplyItem(''); setFilterSupplyStartDate(''); setFilterSupplyEndDate(''); setSuppliesPage(0)
    fetchSupplies({ cropType: '', startDate: '', endDate: '', skip: 0 })
  }

  const handleExportCsv = async () => {
    const [err, res] = await to(exportProduceCsv())
    if (err) { setError('Failed to export CSV'); return }
    const url = window.URL.createObjectURL(new Blob([res.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'produce-logs.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }

  // ── Guards ─────────────────────────────────────────────────────────────────

  if (authLoading) return null
  if (!isAuthenticated || !(isAdmin || isStaff)) return <Navigate to="/" replace />

  // All log type options for Logger tab (distribution admin-only)
  const logTypeOptions = [
    ...LOG_TYPE_OPTIONS,
    ...(isAdmin ? [{ value: 'distribution', icon: <LocalShippingIcon />, label: 'Distribution', desc: 'Community distribution' }] : []),
  ]

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={2} mb={1}>
        <StorageIcon sx={{ fontSize: 32, color: colors.primary.main }} />
        <Box flex={1}>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Inventory Tracking
          </Typography>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Log and track produce, seeds, supplies, and distributions.
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="outlined"
            size="small"
            startIcon={<DownloadIcon />}
            onClick={handleExportCsv}
            sx={{ textTransform: 'none' }}
          >
            Export CSV
          </Button>
        )}
      </Stack>

      {/* Staff info banner */}
      {isStaff && (
        <Box my={2}>
          <Alert severity="info">
            Your submissions will be sent as requests for admin approval.
          </Alert>
        </Box>
      )}

      {/* Alerts */}
      {(error || success) && (
        <Box my={2}>
          {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
          {success && <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>}
        </Box>
      )}

      {/* Stats */}
      <Box my={3}>
        <InventoryStats
          logs={[...logs, ...seedLogs, ...distLogs]}
          isAdmin={isAdmin}
          netTotals={netTotals}
          onViewCropLogs={handleOpenCropLogs}
        />
      </Box>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onChange={(e, v) => setActiveTab(v)}
        sx={{
          mb: 3,
          '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.95rem' },
        }}
      >
        <Tab icon={<ListAltIcon />} iconPosition="start" label="View Logs" />
        <Tab icon={<NoteAddIcon />} iconPosition="start" label="Logger" />
        {isAdmin && (
          <Tab
            icon={<AssignmentIcon />}
            iconPosition="start"
            label={`Approval Queue${requests.length ? ` (${requests.length})` : ''}`}
          />
        )}
      </Tabs>

      {/* ── View Logs Tab ─────────────────────────────────────────────────── */}
      {activeTab === 0 && (
        <Stack spacing={6}>

          {/* 1 — Harvest & Compost */}
          <CollapsibleSection
            icon={<GrassIcon />}
            title="Harvest & Compost"
            count={total}
            open={sectionOpen.harvest}
            onToggle={() => toggleSection('harvest')}
          >
            <InventoryFilters
              title="Filter Harvest & Compost Logs"
              allowedTypes={['harvest', 'compost']}
              filterType={filterType}
              filterCropType={filterCropType}
              filterStartDate={filterStartDate}
              filterEndDate={filterEndDate}
              loading={loading}
              isAdmin={isAdmin}
              onTypeChange={setFilterType}
              onCropTypeChange={setFilterCropType}
              onStartDateChange={setFilterStartDate}
              onEndDateChange={setFilterEndDate}
              onApplyFilters={handleApplyFilters}
              onResetFilters={handleResetFilters}
              totalCount={total}
            />
            <InventoryLogsTable
              title="Harvest & Compost Logs"
              logs={logs}
              total={total}
              page={page}
              rowsPerPage={rowsPerPage}
              loading={loading}
              isAdmin={isAdmin}
              emptyMessage="No harvest or compost logs yet. Use the Logger tab to add one."
              onPageChange={(p) => setPage(p)}
              onRowsPerPageChange={(rpp) => { setRowsPerPage(rpp); setPage(0) }}
              onRefresh={() => fetchLogs()}
              onDelete={handleDeleteLog}
            />
          </CollapsibleSection>

          {/* 2 — Seed Logs */}
          <CollapsibleSection
            icon={<SpaIcon />}
            title="Seed Logs"
            count={seedTotal}
            open={sectionOpen.seed}
            onToggle={() => toggleSection('seed')}
          >
            <InventoryFilters
              title="Filter Seed Logs"
              showTypeFilter={false}
              filterCropType={filterSeedCropType}
              filterStartDate={filterSeedStartDate}
              filterEndDate={filterSeedEndDate}
              loading={seedLoading}
              isAdmin={isAdmin}
              onTypeChange={() => {}}
              onCropTypeChange={setFilterSeedCropType}
              onStartDateChange={setFilterSeedStartDate}
              onEndDateChange={setFilterSeedEndDate}
              onApplyFilters={handleApplySeedFilters}
              onResetFilters={handleResetSeedFilters}
              totalCount={seedTotal}
            />
            <InventoryLogsTable
              title="Seed Logs"
              variant="seed"
              logs={seedLogs}
              total={seedTotal}
              page={seedPage}
              rowsPerPage={seedRowsPerPage}
              loading={seedLoading}
              isAdmin={isAdmin}
              emptyMessage="No seed logs recorded yet. Use the Logger tab to add one."
              onPageChange={(p) => setSeedPage(p)}
              onRowsPerPageChange={(rpp) => { setSeedRowsPerPage(rpp); setSeedPage(0) }}
              onRefresh={() => fetchSeedLogs()}
              onDelete={handleDeleteSeedLog}
            />
          </CollapsibleSection>

          {/* 3 — Distribution (admin only) */}
          {isAdmin && (
            <CollapsibleSection
              icon={<LocalShippingIcon />}
              title="Distribution"
              count={distTotal}
              open={sectionOpen.distribution}
              onToggle={() => toggleSection('distribution')}
            >
              <InventoryFilters
                title="Filter Distribution Logs"
                showTypeFilter={false}
                filterCropType={filterDistCropType}
                filterStartDate={filterDistStartDate}
                filterEndDate={filterDistEndDate}
                loading={distLoading}
                isAdmin={isAdmin}
                onTypeChange={() => {}}
                onCropTypeChange={setFilterDistCropType}
                onStartDateChange={setFilterDistStartDate}
                onEndDateChange={setFilterDistEndDate}
                onApplyFilters={handleApplyDistFilters}
                onResetFilters={handleResetDistFilters}
                totalCount={distTotal}
              />
              <InventoryLogsTable
                title="Distribution Logs"
                logs={distLogs}
                total={distTotal}
                page={distPage}
                rowsPerPage={distRowsPerPage}
                loading={distLoading}
                isAdmin={isAdmin}
                emptyMessage="No distribution logs yet. Use the Logger tab to record a distribution."
                onPageChange={(p) => setDistPage(p)}
                onRowsPerPageChange={(rpp) => { setDistRowsPerPage(rpp); setDistPage(0) }}
                onRefresh={() => fetchDistLogs()}
                onDelete={handleDeleteDistLog}
              />
            </CollapsibleSection>
          )}

          {/* 4 — Supplies */}
          <CollapsibleSection
            icon={<InventoryIcon />}
            title="Supplies"
            count={suppliesTotal}
            open={sectionOpen.supplies}
            onToggle={() => toggleSection('supplies')}
          >
            <InventoryFilters
              title="Filter Supplies Logs"
              showTypeFilter={false}
              filterCropType={filterSupplyItem}
              filterStartDate={filterSupplyStartDate}
              filterEndDate={filterSupplyEndDate}
              loading={suppliesLoading}
              isAdmin={isAdmin}
              itemLabel="Supply Item"
              freeTextItem
              onTypeChange={() => {}}
              onCropTypeChange={setFilterSupplyItem}
              onStartDateChange={setFilterSupplyStartDate}
              onEndDateChange={setFilterSupplyEndDate}
              onApplyFilters={handleApplySuppliesFilters}
              onResetFilters={handleResetSuppliesFilters}
              totalCount={suppliesTotal}
            />
            <InventoryLogsTable
              title="Supplies Logs"
              variant="supplies"
              logs={suppliesLogs}
              total={suppliesTotal}
              page={suppliesPage}
              rowsPerPage={suppliesRowsPerPage}
              loading={suppliesLoading}
              isAdmin={isAdmin}
              emptyMessage="No supply logs recorded yet. Use the Logger tab to add one."
              onPageChange={(p) => setSuppliesPage(p)}
              onRowsPerPageChange={(rpp) => { setSuppliesRowsPerPage(rpp); setSuppliesPage(0) }}
              onRefresh={() => fetchSupplies()}
              onDelete={handleDeleteSupplyLog}
            />
          </CollapsibleSection>

        </Stack>
      )}

      {/* ── Logger Tab ───────────────────────────────────────────────────── */}
      {activeTab === 1 && (
        <Stack spacing={3}>
          <Typography variant="body2" sx={{ color: colors.text.secondary }}>
            Select the type of log to record, then fill in the details below.
          </Typography>

          {/* Card-style type selector */}
          <Stack direction="row" sx={{ flexWrap: 'wrap', gap: 1.5 }}>
            {logTypeOptions.map(({ value, icon, label, desc }) => (
              <Paper
                key={value}
                elevation={0}
                onClick={() => setLogType(value)}
                sx={{
                  p: 2,
                  borderRadius: 3,
                  cursor: 'pointer',
                  minWidth: 110,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 0.5,
                  border: logType === value
                    ? `2px solid ${colors.primary.main}`
                    : `1px solid ${colors.background.section}`,
                  backgroundColor: logType === value
                    ? colors.background.section
                    : colors.background.paper,
                  transition: 'border-color 0.15s, background-color 0.15s',
                  '&:hover': { borderColor: colors.primary.light },
                  userSelect: 'none',
                }}
              >
                <Box sx={{ color: logType === value ? colors.primary.main : colors.text.secondary, display: 'flex' }}>
                  {icon}
                </Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: logType === value ? colors.primary.dark : colors.text.primary }}
                >
                  {label}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.text.secondary, textAlign: 'center' }}>
                  {desc}
                </Typography>
              </Paper>
            ))}
          </Stack>

          {/* Active log form */}
          <Box sx={{ maxWidth: 600 }}>
            {logType === 'harvest' && <HarvestLogForm loading={loading} onSubmit={handleSubmitLog} />}
            {logType === 'compost' && <CompostLogForm loading={loading} onSubmit={handleSubmitLog} />}
            {logType === 'seed' && <SeedLogForm loading={loading} onSubmit={handleSubmitLog} />}
            {logType === 'supplies' && <SuppliesLogForm loading={loading} onSubmit={handleSubmitLog} />}
            {logType === 'distribution' && isAdmin && <DistributionLogForm loading={loading} onSubmit={handleSubmitLog} />}
          </Box>
        </Stack>
      )}

      {/* ── Approval Queue Tab ───────────────────────────────────────────── */}
      {isAdmin && activeTab === 2 && (
        <ApprovalQueue
          requests={requests}
          loading={requestsLoading}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          onRefresh={fetchRequests}
        />
      )}

      {/* ── Crop Logs Dialog ─────────────────────────────────────────────── */}
      <Dialog open={cropDialog.open} onClose={handleCloseCropDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <GrassIcon sx={{ color: colors.primary.main }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {cropDialog.cropType} — Logs
            </Typography>
          </Stack>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0 }}>
          {cropDialog.loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
              <CircularProgress size={28} sx={{ color: colors.primary.main }} />
            </Box>
          ) : cropDialog.logs.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <Typography variant="body2" sx={{ color: colors.text.disabled }}>
                No produce logs found for {cropDialog.cropType}.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={0}>
              {cropDialog.logs.map((log, i) => (
                <Stack
                  key={log._id}
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{
                    px: 2.5,
                    py: 1.5,
                    borderBottom: i < cropDialog.logs.length - 1
                      ? `1px solid ${colors.background.section}`
                      : 'none',
                    '&:hover': { backgroundColor: colors.background.section },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Chip
                      label={log.type === 'harvest' ? 'Harvest' : log.type === 'compost' ? 'Compost' : 'Distribution'}
                      size="small"
                      sx={{
                        backgroundColor:
                          log.type === 'harvest'
                            ? colors.secondary.light
                            : log.type === 'compost'
                            ? '#6B8E2330'
                            : '#50360020',
                        fontWeight: 500,
                        fontSize: '0.7rem',
                      }}
                    />
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {log.weightKg != null ? `${log.weightKg.toFixed(1)} lb` : '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ color: colors.text.disabled }}>
                        {new Date(log.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </Typography>
                    </Box>
                    {log.notes && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: colors.text.secondary,
                          maxWidth: 160,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {log.notes}
                      </Typography>
                    )}
                  </Stack>
                  {isAdmin && (
                    <IconButton
                      size="small"
                      onClick={() => handleDeleteFromCropDialog(log._id)}
                      sx={{ color: colors.error.main, '&:hover': { backgroundColor: colors.error.light + '20' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCropDialog} sx={{ textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
