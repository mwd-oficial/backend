import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import FormData from "form-data";
import axios from "axios";
import sharp from 'sharp';
import path from "path"
import fs from "fs"
import { google } from "googleapis";
import { getUsers, postUser, getUsername, getEmail, deleteUser, putUser } from "../models/usersModel.js";


const oauth2Client = new google.auth.OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    process.env.REDIRECT_URI
)

oauth2Client.setCredentials({ refresh_token: process.env.REFRESH_TOKEN })

const drive = google.drive({
    version: "v3",
    auth: oauth2Client
})

async function getNewAccessToken(refreshToken, clientId, clientSecret) {
    const response = await axios.post('https://oauth2.googleapis.com/token', null, {
        params: {
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: 'refresh_token'
        }
    });
    return response.data.access_token;
}









export async function listarUsers(req, res) {
    const users = await getUsers();
    return res.status(200).json(users);
}










export async function cadastrarUser(req, res) {
    const userData = req.body;

    if (!userData.password) {
        return res.status(400).json({ msg: "A senha é obrigatória." });
    }

    if (await getUsername(userData.username) && await getEmail(userData.email)) {
        return res.status(200).json({ msg: "Nome de usuário e email já registrados. Clique em Entrar." });
    }

    if (await getUsername(userData.username)) {
        return res.status(200).json({ msg: "Nome de usuário já registrado. Tente novamente." });
    }

    if (await getEmail(userData.email)) {
        return res.status(200).json({ msg: "Email já registrado. Clique em Entrar." });
    }

    try {
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userData.password = hashedPassword;

        const newUser = await postUser({
            username: userData.username,
            email: userData.email,
            password: userData.password
        });

        if (req.file) {
            //await uploadImgbb(req.file.buffer, userData, newUser.insertedId);
            await uploadFile(req.file, "img", userData, newUser.insertedId)
        } else if (JSON.parse(userData.semFoto)) {
            userData.imagem = "";
            userData.preencher = false;
            await putUser(newUser.insertedId, { 
                imagemId: userData.imagem,
                preencher: userData.preencher 
            });
        }

        const resultado = await getUsername(userData.username);

        return res.status(200).json({
            resultado,
            msg: "Cadastro efetuado com sucesso!",
        });
    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

async function uploadFile(arquivo, tipo, bodyData, dbId) {
    try {
        const newAccessToken = await getNewAccessToken(process.env.REFRESH_TOKEN, process.env.CLIENT_ID, process.env.CLIENT_SECRET);
        if (tipo == "img") {
            const imageBuffer = arquivo.buffer
            const otimizado = await otimizarImg(imageBuffer)
            const folderId = "1WjnpiDtAcyIK8k8xE-weR2kTOu9Dsa9P";

            const form = new FormData();
            form.append('metadata', JSON.stringify({
                name: `${dbId}.png`,
                mimeType: 'image/png',
                parents: [folderId]
            }), {
                contentType: 'application/json'
            });
            form.append('file', otimizado, {
                filename: `${dbId}.png`,
                contentType: 'image/png'
            });

            const res = await axios.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', form, {
                headers: {
                    'Authorization': `Bearer ${newAccessToken}`,
                    ...form.getHeaders()
                }
            });
            bodyData.imagemId = res.data.id;
            await putUser(dbId, {
                imagemId: bodyData.imagemId,
                preencher: bodyData.preencher
            });

            await tornarPublico(res.data.id)

            console.log(res.data);
        } else {
            const folderId = "1sQ40PBHoq7PAOYHzbihvA7gew6f3CeBI";
            const form = new FormData();
            form.append('metadata', JSON.stringify({
                name: 'ar.glb',
                mimeType: 'model/gltf-binary',
                parents: [folderId]
            }), {
                contentType: 'application/json'
            });
            form.append('file', arquivo.buffer, {
                filename: 'ar.glb',
                contentType: 'model/gltf-binary'
            });

            const res = await axios.post('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', form, {
                headers: {
                    'Authorization': `Bearer ${newAccessToken}`,
                    ...form.getHeaders()
                }
            });

            await tornarPublico(res.data.id)

            console.log(res.data);
        }
    } catch (erro) {
        console.log("Erro ao fazer upload para o Google Drive: " + erro)
    }
}

async function otimizarImg(imageBuffer) {
    try {
        const optimizedBuffer = await sharp(imageBuffer)
            .rotate()
            .resize(600, 600, { fit: 'inside' })
            .toFormat('png', {
                quality: 80,
                compressionLevel: 8
            })
            .toBuffer();
        return optimizedBuffer
    } catch (erro) {
        console.log("Erro ao otimizar a imagem com sharp: " + erro)
    }
}

async function tornarPublico(id) {
    try {
        await drive.permissions.create({
            fileId: id,
            requestBody: {
                role: "reader",
                type: "anyone"
            }
        })
        console.log(`Arquivo com ID ${id} agora está público.`);
    } catch (erro) {
        console.log(erro.message)
    }
}










export async function validarSenha(req, res) {
    const email = req.body.email;
    const password = req.body.password;

    try {
        const userData = await getEmail(email);
        if (!userData) return res.status(200).json({
            msg: "Email não encontrado."
        });

        const isPasswordValid = await bcrypt.compare(password, userData.password);
        if (!isPasswordValid) return res.status(200).json({
            emailEncontrado: true,
            msg: "A senha está incorreta."
        });

        return res.status(200).json({
            userData,
            emailEncontrado: true,
            senhaCorreta: true,
            msg: "Entrada efetuada com sucesso!"
        });
    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

export async function pegarUserInfo(req, res) {
    const username = req.body.username ?? undefined;
    const email = req.body.email ?? undefined;
    try {
        var resultado
        if (username) {
            resultado = await getUsername(username)
        } else if (email) {
            resultado = await getEmail(email)
        }
        return res.status(200).json(resultado)
    } catch (erro) {
        console.error("Erro ao buscar dados:", erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}








export async function excluirUser(req, res) {
    const userData = req.body;
    try {
        const excludedUser = await deleteUser({ username: userData.username });
        return res.status(200).json(excludedUser);
    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

export async function deleteFile() {
    try {
        const response = await drive.files.delete({
            fileId: "1tS_JOulug5uN6RkW2ATHdoCCJU4-V-4v",
        })
        console.log(response.data, response.status)
    } catch (erro) {
        console.log(erro.message)
    }
}










export async function editarUser(req, res) {
    const userId = ObjectId.createFromHexString(req.params.id);
    const userData = req.body;

    const verificarUsername = await getUsername(userData.username) && userData.username !== userData.usernameCadastrado
    const verificarEmail = await getEmail(userData.email) && userData.email !== userData.emailCadastrado

    try {
        if (verificarUsername && verificarEmail) {
            return res.status(200).json({
                msg: "Nome de usuário e email já registrados. Tente novamente."
            })
        }

        if (verificarUsername) {
            return res.status(200).json({
                msg: "Nome de usuário já registrado. Tente novamente."
            })
        }

        if (verificarEmail) {
            return res.status(200).json({
                msg: "Email já registrado. Tente novamente."
            })
        }


        const hashedPassword = await bcrypt.hash(userData.password, 10);
        userData.password = hashedPassword;

        await putUser(userId, {
            username: userData.username,
            email: userData.email,
            password: userData.password,
        });

        console.log(userData.semFoto)
        if (req.file) {
            //await uploadImgbb(req.file.buffer, userData, userId);
        } else if (JSON.parse(userData.semFoto)) {
            userData.imagem = "";
            await putUser(userId, { imagem: userData.imagem });
        }

        const resultado = await getUsername(userData.username)
        return res.status(200).json({
            resultado,
            msg: "Informações atualizadas com sucesso!"
        });

    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}
/*
async function uploadImgbb(imageBuffer, userData, id) {

    const optimizedBuffer = await sharp(imageBuffer)
        .rotate()
        .resize(400, 400, { fit: 'inside' })
        .toFormat('png', { 
            quality: 80,
            compressionLevel: 9
        })
        .toBuffer();


    const formData = new FormData();
    formData.append("image", optimizedBuffer, {
        filename: 'image.png', contentType: "image/png"
    });

    try {
        const res = await axios.post('https://api.imgbb.com/1/upload?key=aeeccd59401ce854b426c20ed68d789a', formData, {
            headers: formData.getHeaders(),
        });
        userData.imagem = res.data.data.url;
        await putUser(id, { 
            imagem: userData.imagem,
            preencher: userData.preencher
        });
        console.log(res.data);
    } catch (erro) {
        console.error('Erro ao fazer upload para ImgBB:' + erro);
    }
}
*/