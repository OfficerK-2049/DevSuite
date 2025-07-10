import express from 'express'
import urlShortenerRoutes from './urlShortener.routes.js'

const router=express.Router()

router.use('/',urlShortenerRoutes)


export default router