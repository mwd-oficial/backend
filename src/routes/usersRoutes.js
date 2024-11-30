import express from "express";
import { listarUsers, cadastrarUsers, excluirUsers } from "../controllers/usersController.js";

export function routes(app) {
    app.get("/users", listarUsers);
    app.post("/users", cadastrarUsers);
    app.delete("/users", excluirUsers);
}
