import axios from 'axios'

const ProjectClient = axios.create({
  baseURL: `${import.meta.env.VITE_SERVER_URL || 'http://localhost:8080'}/api/projects`,
  timeout: 10000,
  withCredentials: true, // Send cookies with requests for authenticated endpoints
})

// Get single project by ID
export const getProject = ({ id }) => ProjectClient.get(`/${id}`)

// Get all projects with optional query parameters
export const getProjects = (params = {}) => {
  const queryParams = new URLSearchParams()
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== '') {
      queryParams.append(key, params[key])
    }
  })
  const queryString = queryParams.toString()
  return ProjectClient.get(queryString ? `/?${queryString}` : '/')
}

// Create a new project
export const createProject = (data) => ProjectClient.post('/', data)

// Update an existing project
export const updateProject = ({ id, ...data }) => ProjectClient.put(`/${id}`, data)

// Delete a project
export const deleteProject = ({ id }) => ProjectClient.delete(`/${id}`)

// Update project images (admin only): replaces the full images array
export const updateProjectImages = ({ id, images }) => ProjectClient.patch(`/${id}/images`, { images })
