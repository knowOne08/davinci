const express = require('express')
const server = express()

server.all("/",(req,res)=>{
    console.log("bot is up")
    res.send("Bot is Running")
})

function keepAlive(){
    server.listen(3000,()=>{
        console.log("Server is Ready")
    })
}
module.exports = keepAlive