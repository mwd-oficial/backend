import conectarAoBanco from "../config/dbConfig.js";

const conexao = await conectarAoBanco(process.env.STRING_CONEXAO);

const db = conexao.db("cadastro")
const colecao = db.collection("users")

export async function getTodosUsers() {
    return colecao.find().toArray()
}

export async function postUsers(user) {
    return colecao.insertOne(user)
}

export async function deleteUsers(user) {
    return colecao.deleteOne(user)   
}

export async function putUsers(user) {
    const objID = ObjectId.createFromHexString(user._id)
    return colecao.updateOne({_id: new ObjectId(objID)}, {$set:user});
}