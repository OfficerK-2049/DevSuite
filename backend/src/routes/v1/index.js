import express from 'express'
import urlShortenerRoutes from './urlShortener.routes.js'
import textTransformRoutes from './textTransform.routes.js'

const router=express.Router()

router.use('/url',urlShortenerRoutes)

router.use('/text',textTransformRoutes)


export default router