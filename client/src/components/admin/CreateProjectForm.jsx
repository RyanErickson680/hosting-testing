import {
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import Button from '../Button'
import AddCircleIcon from '@mui/icons-material/AddCircle'

export default function CreateProjectForm({ loading, onCreateProject }) {
  const handleSubmit = (e) => {
    e.preventDefault() // Prevent default form submission
    
    if (!onCreateProject) return

    // Extract form data
    const formData = new FormData(e.target)
    const data = {}

    // Get all form values
    for (let [key, value] of formData.entries()) {
      data[key] = value
    }

    // Process specific fields
    const processedData = {
      ...data,
      // Convert number fields to numbers
      goalAmount: data.goalAmount ? Number(data.goalAmount) : undefined,
      currentAmount: data.currentAmount ? Number(data.currentAmount) : 0,
      priority: data.priority ? Number(data.priority) : undefined,
      
      // Convert dates to ISO strings
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      targetEndDate: data.targetEndDate ? new Date(data.targetEndDate).toISOString() : undefined,
      
      // Parse JSON for currentNeeds
      currentNeeds: data.currentNeeds ? (() => {
        try {
          return JSON.parse(data.currentNeeds)
        } catch {
          return []
        }
      })() : [],
    }

    // Remove empty/undefined values
    const cleanData = Object.fromEntries(
      Object.entries(processedData).filter(([_, value]) => 
        value !== undefined && value !== '' && value !== null
      )
    )

    // Call the parent's handler with processed data
    onCreateProject(cleanData)
  }

  return (
    <Card>
      <CardContent>
        <Stack direction="row" spacing={1} alignItems="center" mb={2}>
          <AddCircleIcon />
          <Typography variant="h6">Create Project</Typography>
        </Stack>
        <form onSubmit={handleSubmit}> {/* Changed to handleSubmit */}
          <Stack spacing={3}>
            <Grid container spacing={2}>
              <Grid size={12}>
                <TextField
                  label="Project Name *"
                  name="name"
                  required
                  fullWidth
                  placeholder="Community Garden Expansion"
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Description *"
                  name="description"
                  required
                  multiline
                  rows={3}
                  fullWidth
                  placeholder="Expanding our community garden to serve more families"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Goal Amount (USD) *"
                  name="goalAmount"
                  type="number"
                  required
                  fullWidth
                  placeholder="50000"
                  slotProps={{ htmlInput: { step: '100', min: '0' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Current Amount (USD)"
                  name="currentAmount"
                  type="number"
                  fullWidth
                  placeholder="0"
                  defaultValue={0}
                  slotProps={{ htmlInput: { step: '100', min: '0' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth required>
                  <InputLabel>Status *</InputLabel>
                  <Select
                    name="status"
                    label="Status *"
                    defaultValue="proposed"
                  >
                    <MenuItem value="proposed">Proposed</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="completed">Completed</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Priority (1 = highest) *"
                  name="priority"
                  type="number"
                  required
                  fullWidth
                  placeholder="1"
                  slotProps={{ htmlInput: { step: '1', min: '0' } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Start Date"
                  name="startDate"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Target End Date"
                  name="targetEndDate"
                  type="date"
                  fullWidth
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  label="Current Needs (JSON format)"
                  name="currentNeeds"
                  multiline
                  rows={3}
                  fullWidth
                  placeholder='[{"item": "Seeds", "quantity": "100 packets", "priority": 1}]'
                  helperText="Optional: Array of items needed for the project"
                />
              </Grid>
            </Grid>
            <Button type="submit" disabled={loading}>
              Create Project
            </Button>
          </Stack>
        </form>
      </CardContent>
    </Card>
  )
}