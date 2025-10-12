import express from 'express'
import urlShortenerRoutes from './urlShortener.routes.js'
import textTransformRoutes from './textTransform.routes.js'
import timeZoneRoutes from './timeZone.routes.js'

const router=express.Router()

router.use('/url',urlShortenerRoutes)

router.use('/text',textTransformRoutes)

router.use('/time',timeZoneRoutes)

export default router