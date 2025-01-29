import { ObjectId } from "mongodb";
import conectarAoBanco from "../config/dbConfig.js";

const conexao = await conectarAoBanco(process.env.STRING_CONEXAO);

const db = conexao.db("fnaf3d");
const colecaoUsers = db.collection("users");
const colecaoModels = db.collection("models");

export async function getUsers() {
    return await colecaoUsers.find().toArray();
}

export async function postUser(userData) {
    return await colecaoUsers.insertOne(userData);
}

export async function getUsername(usernamep) {
    return await colecaoUsers.findOne({ username: usernamep });
}

export async function getEmail(emailp) {
    return await colecaoUsers.findOne({ email: emailp });
}

export async function deleteUser(userData) {
    return await colecaoUsers.deleteOne(userData);
}

export async function putUser(userId, userData) {
    const objId = new ObjectId(userId);
    return await colecaoUsers.updateOne({ _id: objId }, { $set: userData });
}
