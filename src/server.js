// const express = require('express')
import express from "express";
const server = express()

server.all("/",(req,res)=>{
    console.log("bot is up")
    res.send("Bot is Running")
})

export const keepAlive = () =>{
    server.listen(3000,()=>{
        console.log("Server is Ready")
    })
}
// module.exports = keepAlive