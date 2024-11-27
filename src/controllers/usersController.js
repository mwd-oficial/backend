import { getTodosUsers, postUsers, deleteUsers } from "../models/usersModel.js";

export async function listarUsers(req, res) {
    const users = await getTodosUsers()
    res.status(200).json(users)
}

export async function cadastrarUsers(req, res) {
    const user = req.body
    try {
        const newUser = await postUsers(user)
        res.status(200).json(newUser)
    } catch(erro) {
        console.error(erro.message)
        res.status(500).json({"Erro": "Falha na requisição"})
    }
}

export async function excluirUsers(req, res) {
    const user = req.body
    try {
        const excludedUser = await deleteUsers(user)
        res.status(200).json(excludedUser)
    } catch(erro) {
        console.error(erro.message)
        res.status(500).json({"Erro": "Falha na requisição"})
    }
}