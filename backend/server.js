import 'dotenv/config'
import app from "./src/app.js";
import { connectDB } from "./src/utils/database.js";
import logger from "./src/utils/logger.js";

const PORT=process.env.PORT || 3000;


async function startServer(){
    try{
        await connectDB();
        app.listen(PORT,()=>
        {
            logger.info(`DevSuite Listening on PORT : ${PORT}`)
        })
    }
    catch(err){
        logger.error(`Server Crashed during start`,err)
        process.exit(1)
    }
}

startServer();