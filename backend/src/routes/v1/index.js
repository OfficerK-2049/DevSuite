import express from 'express'
import urlShortenerRoutes from './urlShortener.routes.js'

const router=express.Router()

router.use('/url',urlShortenerRoutes)


export default router