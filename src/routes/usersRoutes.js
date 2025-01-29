import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch"
import { listarUsers, cadastrarUser, validarSenha, pegarUserInfo, excluirUser, editarUser } from "../controllers/usersController.js";

const corsOptions = {
    origin: ["https://mwd-oficial.github.io", "http://127.0.0.1:5500"],
    optionsSuccessStatus: 200
}

const upload = multer()

export function routes(app) {
    app.use(express.json());
    app.use(cors(corsOptions));
    app.use((req, res, next) => {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
        next();
    });

    app.get("/users", listarUsers);

    app.post("/cadastrar", upload.single("imagem"), cadastrarUser);
    //app.post("/validarSenha", validarSenha);
    //app.post("/pegarUserInfo", pegarUserInfo)

    //app.delete("/excluir", excluirUser);

    //app.put("/users/:id", upload.single("imagem"), editarUser);


    app.get('/pegarArquivo/:id', async (req, res) => {
        const fileId = req.params.id;
        const url = `https://drive.google.com/uc?id=${fileId}`;

        try {
            const response = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });

            if (!response.ok) throw new Error('Erro ao acessar o arquivo');

            res.header('Access-Control-Allow-Origin', '*'); // Adiciona o cabeçalho CORS na resposta
            response.body.pipe(res);
        } catch (error) {
            res.status(500).json({ error: 'Erro ao acessar o arquivo' });
        }
    });
}