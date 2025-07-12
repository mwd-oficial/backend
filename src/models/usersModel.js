import { ObjectId } from "mongodb";
import conectarAoBanco from "../config/dbConfig.js";

const conexao = await conectarAoBanco(process.env.STRING_CONEXAO);

const db = conexao.db("fnaf3d");

// Users
const colecaoUsers = db.collection("users");

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


// Models

const colecaoModels = db.collection("models");

export async function getModels() {
    return await colecaoModels.find().toArray();
}

export async function postModels(modelData) {
    const encontrou = await colecaoModels.findOne({ src: modelData.src })
    if (!encontrou) {
        await colecaoModels.insertOne(modelData);
    }
}

export async function getModelId(srcp) {
    return await colecaoModels.findOne({ src: srcp });
}

export async function putModel(userId, modelData) {
    const objId = new ObjectId(userId);
    return await colecaoModels.updateOne({ _id: objId }, { $set: modelData });
}




// ar

const colecaoAr = db.collection("ar");

export async function getAr() {
    return await colecaoAr.find().toArray();
}

export async function postAr(modelData) {
    await colecaoAr.insertOne(modelData);
}

export async function deleteAr(modelData) {
    return await colecaoAr.deleteOne(modelData);
}