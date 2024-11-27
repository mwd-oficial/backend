import express from "express";
import {routes} from "./src/routes/usersRoutes.js";

const app = express();
routes(app);

app.listen(3000, () => {
    console.log("Servidor escutando na porta 3000");
})
