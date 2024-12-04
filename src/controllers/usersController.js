import bcrypt from "bcrypt";
import { getUsers, postUser, findUser, getEmail, getUsername, deleteUser, putUser } from "../models/usersModel.js";

export async function listarUsers(req, res) {
    const users = await getUsers();
    res.status(200).json(users);
}

export async function verificarUser(req, res) {
    const usernameCadastrar = req.body.username; 
    const emailCadastrar = req.body.email;
    try {
        const resultado = await findUser(usernameCadastrar, emailCadastrar)
        res.status(200).json(resultado)
    } catch (erro) {
        console.error("Erro ao buscar dados:", erro.message); 
        res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

export async function cadastrarUser(req, res) {
    const userData = req.body;
    try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userData.password = hashedPassword;

        const newUser = await postUser(userData);
        res.status(200).json(newUser);
    } catch (erro) {
        console.error(erro.message);
        res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

export async function validarSenha(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const userData = await getEmail(email);
        if (!userData) return res.status(404).json({ "Erro": "Usuário não encontrado" });

        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) return res.status(401).json({ "Erro": "Senha incorreta" });

        res.status(200).json({ "Mensagem": "Entrada bem-sucedida!" });
    } catch (erro) {
        console.error(erro.message);
        res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

export async function pegarUsername(req, res) {
    const username = req.body.username;
    try {
        const resultado = await getUsername(username);
        res.status(200).json(resultado)
    } catch(erro) {

    }
}

export async function excluirUser(req, res) {
    const userData = req.body;
    try {
        const excludedUser = await deleteUser(userData);
        res.status(200).json(excludedUser);
    } catch (erro) {
        console.error(erro.message);
        res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

export async function editarUser(req, res) {
    const userId = req.params.id;
    const userData = req.body;
    try {
        const editedUser = await putUser(userId, userData);
        res.status(200).json(editedUser);
    } catch (erro) {
        console.error(erro.message);
        res.status(500).json({ "Erro": "Falha na requisição" });
    }
}