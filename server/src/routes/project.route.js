import { Router } from 'express'
import { getProjects, getProject, createProject, updateProject, deleteProject, updateProjectImages } from 'controllers/project.controller'
import { authenticate, isAdmin } from 'middleware/auth.middleware'

const projectRouter = Router()

// Public endpoints
projectRouter.get('/', getProjects)
projectRouter.get('/:id', getProject)

// Admin-only endpoints
projectRouter.post('/', authenticate, isAdmin, createProject)
projectRouter.put('/:id', authenticate, isAdmin, updateProject)
projectRouter.patch('/:id/images', authenticate, isAdmin, updateProjectImages)
projectRouter.delete('/:id', authenticate, isAdmin, deleteProject)

export default projectRouter
