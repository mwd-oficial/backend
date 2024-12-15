import express from "express";
import cors from "cors";
import multer from "multer";
import { listarUsers, cadastrarUser, validarSenha, pegarUserInfo, excluirUser, editarUser } from "../controllers/usersController.js";

const corsOptions = {
    origin: ["https://mwd-oficial.github.io", "http://127.0.0.1:5500"],
    optionsSuccessStatus: 200
}

const upload = multer()

export function routes(app) {
    app.use(express.json());
    app.use(cors(corsOptions));
    
    app.get("/users", listarUsers);

    app.post("/cadastrar", upload.single("imagem"), cadastrarUser);
    app.post("/validarSenha", validarSenha);
    app.post("/pegarUserInfo", pegarUserInfo)

    app.delete("/excluir", excluirUser);

    app.put("/users/:id", upload.single("imagem"), editarUser);
}