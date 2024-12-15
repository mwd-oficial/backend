import express from "express";
import multer from "multer";
import cors from "cors";
import { listarUsers, cadastrarUser, validarSenha, pegarUserInfo, excluirUser, editarUser } from "../controllers/usersController.js";

const corsOptions = {
    origin: ["https://mwd-oficial.github.io", "http://127.0.0.1:5500"],
    optionsSuccessStatus: 200
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
})
const upload = multer({ dest: "./uploads" , storage})


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