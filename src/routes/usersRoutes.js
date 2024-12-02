import express from "express";
import cors from "cors";
import { listarUsers, cadastrarUsers, excluirUsers, editarUsers } from "../controllers/usersController.js"

const corsOptions = {
    origin: ["https://mwd-oficial.github.io", "http://127.0.0.1:5500"],
    optionsSuccessStatus: 200
}

export function routes(app) {
    app.use(express.json());
    app.use(cors(corsOptions));
    
    app.get("/users", listarUsers);
    app.post("/users", cadastrarUsers);
    app.delete("/users", excluirUsers);
    app.put("/users", editarUsers)
}