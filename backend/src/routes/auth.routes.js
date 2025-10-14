// src/routes/auth.routes.js

import express from 'express'
import { authenticate } from '../middleware/auth.js'
import * as authController from '../controllers/auth.controller.js'

const router = express.Router()
router.use(authenticate)

router.put('/profile', authController.updateProfile)

export default router
