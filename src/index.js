import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

const listening = process.env.PORT || 8000;
connectDB()
  .then(() => {
    app.listen(listening, () => {
      console.log(`App is watching at : ${listening}`);
    });
    app.on("error",(error)=>{
        console.log(`Error on app: ${error}`)
    })
  })
  .catch((err) => {
    console.log(`MongoDB Connection failed at : ${err}`);
  });
