import express from "express";
import cors from "cors";
import multer from "multer";
import fetch from "node-fetch"
import { listarUsers, cadastrarUser, validarSenha, pegarUserInfo, excluirUser, excluirTodosUser, editarUser, atualizarDado, listarModels, cadastrarModels, editarModel, listarAr, cadastrarAr,  excluirTodosAr } from "../controllers/usersController.js";
import excluirAr from "../programado.js"

const corsOptions = {
    origin: ["https://mwd-oficial.github.io", "http://127.0.0.1:5500"],
    optionsSuccessStatus: 200
}

const upload = multer({
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

export function routes(app) {
    app.use(express.json())
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
    //app.get("/users/excluirTodos", excluirTodosUser)

    app.put("/users/editar/:id", upload.single("imagem"), editarUser);

    app.put("/users/atualizarDado/:id", atualizarDado);



    app.get("/models", listarModels)

    app.post("/models/cadastrar", cadastrarModels)

    app.put("/models/editar", editarModel)
    



    app.get("/ar", listarAr)
    
    app.post("/ar/cadastrar", cadastrarAr)

    app.get("/ar/excluir", excluirAr);
    //app.get("/ar/excluirTodos", excluirTodosAr);
}