const express=require('express')
const cors=require('cors')
const app=express()
const port=process.env.PORT||5000

// MIDDLEWARE
app.use(cors())
app.use(express.json())

// server APIs

app.get('/',(req,res)=>{
    res.send('Job portal server is running...')
})

// Listen to post: MUST
app.listen(port,()=>{
    console.log('Listening to port=>',port);
})
