/*const express = require('express');
const URLShortenerController = require('../../controllers/urlShortener.controller');
const { validate, validateParams } = require('../../middleware/validation.middleware');
const { urlShortenSchema, shortIdSchema } = require('../../utils/validators');

const router = express.Router();

// POST /api/v1/shorten
router.post('/shorten', 
  validate(urlShortenSchema),
  URLShortenerController.shortenUrl
);

// GET /api/v1/analytics/:shortId
router.get('/analytics/:shortId',
  validateParams(shortIdSchema),
  URLShortenerController.getAnalytics
);

module.exports = router;*/

import express from 'express'

const router=express.Router()


router.post('/shorten',(req,res)=>
{
    res.status(201).json({
        success:true,
        message:'URL shortened'
    })
})

router.get('/analytics/:shortId',(req,res)=>
{
    const {shortId}=req.params
    res.status(200).json({
        success:true,
        message :`Here are your clicks,createdAt and lastAccessed for ID ${shortId}`
    })
})

// router.get('/:shortId',validateParams(shortIdSchema),URLShortenerController.redirectToOriginal)
router.get('/:shortId',(req,res)=>
{
    const {shortId}=req.params
    res.status(200).json({
        success:true,
        message:`you are getting redirected for the ID ${shortId} from ${req.originalUrl}`
    })
})

export default router

