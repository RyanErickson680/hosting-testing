import { Router } from 'express'
import userRouter from 'routes/user.route'
import authRouter from 'routes/auth.route'
import donationRouter from 'routes/donation.route'
import projectRouter from 'routes/project.route'
import produceRouter from 'routes/produce.route'
import produceRequestRouter from 'routes/inventoryRequest.route'
import seedRouter from 'routes/seedLog.route'
import inventoryRouter from 'routes/inventory.route'
import homeContentRouter from 'routes/homeContent.route'

const rootRouter = Router()

rootRouter.use('/auth', authRouter)
rootRouter.use('/user', userRouter)
rootRouter.use('/donations', donationRouter)
rootRouter.use('/projects', projectRouter)
rootRouter.use('/produce', produceRouter)
rootRouter.use('/produce-requests', produceRequestRouter)
rootRouter.use('/produce/seeds', seedRouter)
rootRouter.use('/inventory', inventoryRouter)
rootRouter.use('/home-content', homeContentRouter)

export default rootRouter
