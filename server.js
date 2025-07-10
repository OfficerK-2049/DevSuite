import express from 'express'
const app=express()


app.get('/',(req,res)=>
{
    res.send("Welcome To DevSuite")
})












app.listen(process.env.PORT || 2002,()=>
{
    console.log("Listening on port 2002")
})