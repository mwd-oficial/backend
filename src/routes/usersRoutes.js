import express from "express";
import { listarUsers, cadastrarUsers, excluirUsers } from "../controllers/usersController.js";

export function routes(app) {
    app.use(express.json());
    
    app.use((req, res, next) => {
        res.header("Access-Control-Allow-Origin", "https://mwd-oficial.github.io"); // Adicione os domínios permitidos aqui
        res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.header("Access-Control-Allow-Headers", "Content-Type");
        next();
    });

    app.get("/users", listarUsers);
    app.post("/users", cadastrarUsers);
    app.delete("/users", excluirUsers);
}
