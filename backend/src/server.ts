import http from "http"
import mongoose from "mongoose"
import dotenv from "dotenv"
import app from "./app.js"


dotenv.config();
const MONGODB_URI: string = process.env.MONGODB_URI || "";
const PORT = process.env.PORT;
const server = http.createServer(app);



async function connect_db(){
    try{
        await mongoose.connect(MONGODB_URI);
        server.listen(PORT, ()=>{
            console.log(`listening at port number ${PORT}`)
        })
        console.log("sucessfully connected with mongodb")
    }
    catch(e: any){
        console.log("error in connecting with database ", e.message);
    }
}


connect_db();