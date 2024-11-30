import express from "express";
import { routes } from "./src/routes/usersRoutes.js";

const app = express();
routes(app);

const PORT = process.env.PORT
app.listen(PORT, () => {
    console.log(`Servidor escutando na porta ${PORT}`);
})
