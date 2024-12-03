import express from "express";
import cors from "cors";
import { listarUsers, verificarUser, cadastrarUser, entrarUser, excluirUser, editarUser } from "../controllers/usersController.js";

const corsOptions = {
    origin: ["https://mwd-oficial.github.io", "http://127.0.0.1:5500"],
    optionsSuccessStatus: 200
}

export function routes(app) {
    app.use(express.json());
    app.use(cors(corsOptions));
    
    app.get("/users", listarUsers);
    app.post("/verificarUser", verificarUser);
    app.post("/cadastrar", cadastrarUser);
    app.post("/entrar", entrarUser)
    app.delete("/excluir", excluirUser);
    app.put("/users/:id", editarUser);
}