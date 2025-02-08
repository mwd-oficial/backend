import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch"
import { listarUsers, cadastrarUser, validarSenha, pegarUserInfo, excluirUser, editarUser, atualizarInteracoes, listarModels, cadastrarModels, editarModel } from "../controllers/usersController.js";

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

    app.post("/users/cadastrar", upload.single("imagem"), cadastrarUser);
    app.post("/users/validarSenha", validarSenha);
    app.post("/users/pegarUserInfo", pegarUserInfo)

    app.delete("/users/excluir", excluirUser);

    app.put("/users/editar/:id", upload.single("imagem"), editarUser);

    app.put("/users/atualizarInteracoes/:id", atualizarInteracoes);



    app.get("/models", listarModels)

    app.post("/models/cadastrar", cadastrarModels)

    app.put("/models/editar", editarModel)


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