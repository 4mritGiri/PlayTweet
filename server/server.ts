import { app } from "./app";
import connectToDB from "./src/db";
require("dotenv").config();

// create a server
app.listen(process.env.PORT, () => {
  connectToDB();
});
