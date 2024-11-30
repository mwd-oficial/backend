import express from "express";
import { routes } from "./src/routes/usersRoutes.js";
import cors from "cors";

const app = express();

const corsOptions = {
    origin: ["https://mwd-oficial.github.io", "http://127.0.0.1:5500"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(express.json());
routes(app);

app.use((req, res) => {
    res.status(404).send('Página não encontrada');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor escutando na porta ${port}`);
});
