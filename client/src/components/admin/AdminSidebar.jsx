import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/Dashboard'
import PeopleIcon from '@mui/icons-material/People'
import EventIcon from '@mui/icons-material/Event'
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn'
import SettingsIcon from '@mui/icons-material/Settings'
import AnalyticsIcon from '@mui/icons-material/Analytics'

const DRAWER_WIDTH = 240

const menuItems = [
  { id: 0, label: 'Overview', icon: <DashboardIcon /> },
  { id: 1, label: 'Users', icon: <PeopleIcon /> },
  { id: 2, label: 'Events', icon: <EventIcon /> },
  { id: 3, label: 'Fundraising', icon: <MonetizationOnIcon /> },
  { id: 5, label: 'Statistics', icon: <AnalyticsIcon /> },
  { id: 6, label: 'Manage', icon: <SettingsIcon /> },
]

export default function AdminSidebar({ selectedSection, onSectionChange }) {
  return (
    <Paper
      elevation={2}
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        height: 'fit-content',
        position: 'sticky',
        top: 0,
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={selectedSection === item.id}
                onClick={() => onSectionChange(item.id)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Box>
    </Paper>
  )
}
