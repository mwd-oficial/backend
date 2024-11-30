import express from "express";
import { routes } from "./src/routes/usersRoutes.js";

const allowCors = fn => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    // outra configuração comum
    // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    return await fn(req, res);
}

const app = express();
const handler = (req, res) => {
    const port = process.env.PORT || 3000;
    app.listen(port, () => {
        console.log(`Servidor escutando na porta ${port}`);
    });
};

app.use(express.json());
routes(app);

// Rota padrão (fallback)
app.use((req, res) => {
    res.status(404).send('Página não encontrada');
});

module.exports = allowCors(handler);
