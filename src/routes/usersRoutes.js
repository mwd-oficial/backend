import express from "express";
import cors from "cors";
import { listarUsers, cadastrarUsers, excluirUsers } from "../controllers/usersController.js"

const corsOption = {
    origin: ["https://mwd-oficial.github.io", "http://127.0.0.1:5500"],
    optionsSuccessStatus: 200
}

export function routes(app) {
    app.use(express.json());
    app.use(cors(corsOption))
    app.get("/teste", listarUsers);
    app.post("/teste", cadastrarUsers);
    app.delete("/teste", excluirUsers);
}