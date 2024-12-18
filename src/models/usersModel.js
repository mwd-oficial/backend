import { ObjectId } from "mongodb";
import conectarAoBanco from "../config/dbConfig.js";

const conexao = await conectarAoBanco(process.env.STRING_CONEXAO);

const db = conexao.db("cadastro");
const colecao = db.collection("users");

export async function getUsers() {
    return await colecao.find().toArray();
}

export async function postUser(userData) {
    return await colecao.insertOne(userData);
}

export async function getUsername(usernamep) {
    return await colecao.findOne({ username: usernamep });
}

export async function getEmail(emailp) {
    return await colecao.findOne({ email: emailp });
}

export async function deleteUser(userData) {
    return await colecao.deleteOne(userData);
}

export async function putUser(userId, userData) {
    const objId = new ObjectId(userId);
    return await colecao.updateOne({ _id: objId }, { $set: userData });
}
