import express from "express";
import { routes } from "./src/routes/usersRoutes.js";

const app = express();
routes(app);

// Rota padrão (fallback)
app.use((req, res) => {
    res.status(404).send('Página não encontrada');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor escutando na porta ${port}`);
});
