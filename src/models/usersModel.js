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

export async function findUser(usernameCadastrar, emailCadastrar) {
    const username = await colecao.findOne({ username: usernameCadastrar });
    const email = await colecao.findOne({ email: emailCadastrar });
    if (username && email) return { 
        usernameRegistrado: true,
        emailRegistrado: true 
    }
    if (username) return { 
        usernameRegistrado: true,
        emailRegistrado: false 
    }
    if (email) return { 
        usernameRegistrado: false,
        emailRegistrado: true 
    }
    return { 
        usernameRegistrado: false,
        emailRegistrado: false 
    }
}

export async function getEmail(email) {
    return await colecao.findOne({email: email})
}

export async function getUsername(username) {
    return await colecao.findOne({username: username})
}

export async function deleteUser(userData) {
    return await colecao.deleteOne(userData);
}

export async function putUser(userId, userData) {
    const objId = ObjectId.createFromHexString(userId);
    return await colecao.updateOne({_id: new ObjectId(objId)}, {$set:userData});
}
