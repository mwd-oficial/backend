import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import FormData from "form-data";
import axios from "axios";
import sharp from 'sharp';
import { google } from "googleapis";
import { NodeIO } from '@gltf-transform/core';
import { getUsers, postUser, getUsername, getEmail, deleteUser, putUser, getModels, postModels, getModelId, putModel, getAr, postAr } from "../models/usersModel.js";
import { file } from "googleapis/build/src/apis/file/index.js";


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
            password: userData.password,
            moedas3d: userData.moedas3d,
            favoritos: userData.favoritos,
            likes: userData.likes,
            dislikes: userData.dislikes,
            vistos: userData.vistos,
            comprados: userData.comprados,
            encontrados: userData.encontrados,
            douradosEncontrados: userData.douradosEncontrados,
            botoesDourados: userData.botoesDourados,
            ucnDesbloqueado: userData.ucnDesbloqueado,
        });

        if (req.file) {
            await uploadFile(req.file, "img", userData, newUser.insertedId)
        } else if (JSON.parse(userData.semFoto)) {
            await putUser(newUser.insertedId, {
                imagemId: "",
                preencher: false
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
            const nomeArquivo = `${bodyData.username}-${bodyData.nome}-${bodyData.timestamp}.glb`;

            form.append('metadata', JSON.stringify({
                name: nomeArquivo,
                mimeType: 'model/gltf-binary',
                parents: [folderId]
            }), {
                contentType: 'application/json'
            });

            form.append('file', arquivo, {
                filename: nomeArquivo,
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

            return res.data.id;
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
        await deleteFile(userData.imagemId)
        const excludedUser = await deleteUser({ username: userData.username });
        return res.status(200).json(excludedUser);
    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

export async function deleteFile(driveId) {
    try {
        const response = await drive.files.delete({
            fileId: driveId,
        })
        console.log(response.data, response.status)
    } catch (erro) {
        console.log(erro.message)
    }
}





export async function editarUser(req, res) {
    const userId = ObjectId.createFromHexString(req.params.id);
    const userData = req.body;

    const verificarUsername = await getUsername(userData.username) && userData.username !== userData.oldUsername;
    const verificarEmail = await getEmail(userData.email) && userData.email !== userData.oldEmail;

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
            preencher: userData.preencher
        });

        console.log(userData.semFoto)
        if (req.file) {
            await deleteFile(userData.oldImagemId)
            await uploadFile(req.file, "img", userData, userId)
        } else if (JSON.parse(userData.semFoto)) {
            await deleteFile(userData.oldImagemId)
            await putUser(userId, {
                imagemId: "",
                preencher: false
            });
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

export async function atualizarDado(req, res) {
    try {
        const userId = ObjectId.createFromHexString(req.params.id);
        const userData = req.body;

        if (userData.moedas3d) await putUser(userId, { moedas3d: userData.moedas3d });
        if (userData.favoritos) await putUser(userId, { favoritos: userData.favoritos });
        if (userData.likes) await putUser(userId, { likes: userData.likes });
        if (userData.dislikes) await putUser(userId, { dislikes: userData.dislikes });
        if (userData.vistos) await putUser(userId, { vistos: userData.vistos });
        if (userData.comprados) await putUser(userId, { comprados: userData.comprados });
        if (userData.encontrados) await putUser(userId, { encontrados: userData.encontrados });
        if (userData.douradosEncontrados) await putUser(userId, { douradosEncontrados: userData.douradosEncontrados });
        if (userData.botoesDourados) await putUser(userId, { botoesDourados: userData.botoesDourados });
        if (userData.ucnDesbloqueado) await putUser(userId, { ucnDesbloqueado: userData.ucnDesbloqueado });

        return res.status(200).json({
            msg: "Interacoes atualizadas com sucesso!"
        });

    } catch (erro) {
        console.log("Erro ao atualizar interações")
        return res.status(200).json({
            msg: "Erro ao atualizar interações"
        });
    }
}













////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////






// Models

export async function listarModels(req, res) {
    const models = await getModels();
    return res.status(200).json(models);
}


export async function cadastrarModels(req, res) {
    try {
        const modelos = req.body.modelos
        for (const modelo of modelos) {
            await postModels(modelo);
        }
    } catch (erro) {
        console.log("Erro ao cadastrar modelos")
    }
}

export async function editarModel(req, res) {
    try {
        const modelData = req.body;
        const idPorSrc = await getModelId(modelData.src)
        const modelId = idPorSrc._id;

        await putModel(modelId, {
            likes: modelData.likes,
            dislikes: modelData.dislikes
        });

        return res.status(200).json({
            msg: "Dados do modelo atualizado com sucesso!"
        });

    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}












// ar

export async function listarAr(req, res) {
    const models = await getAr();
    return res.status(200).json(models);
}

export async function cadastrarAr(req, res) {
    console.log("ar executado")
    try {
        const driveId = req.body.driveId;
        console.log("fileId: " + driveId)

         // 2. Download do arquivo GLB
         const resultado = await drive.files.get(
            { fileId: driveId, alt: 'media' },
            { responseType: 'arraybuffer' }
        );
        const buffer = Buffer.from(resultado.data);

        const arrayBuffer = await translateAndFilter(buffer, animacao, parseFloat(-17.25), parseFloat(-2), parseFloat(9));
        const novoBuffer = Buffer.from(arrayBuffer);

        // 7. Envio do novo GLB ao Drive
        const newDriveId = await uploadFile(novoBuffer, "glb", req.body, undefined);

        // 8. Gravação do registro AR no seu serviço
        await postAr({
            username: req.body.username,
            driveId: newDriveId,
            nome: req.body.nome,
            animacao: req.body.animacao,
            timestamp: req.body.timestamp
        });

        return res.status(200).json({
            newDriveId: newDriveId,
        });

    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

async function translateAndFilter(buffer, animacao, tx, ty, tz) {
  const io = new NodeIO();
  const doc = await io.readBinary(buffer);

  const root = doc.getRoot();
  // 1) filtrar animações
  root.listAnimations().forEach(anim => {
    if (anim.getName().toLowerCase() !== animacao.toLowerCase()) {
      anim.dispose();
    }
  });
  // 2) wrapper + tradução
  const scene   = root.listScenes()[0];
  const wrapper = doc.createNode('wrapper').setTranslation([tx, ty, tz]);
  scene.listNodes().forEach(node => wrapper.addChild(node));
  scene.listNodes().forEach(node => scene.removeChild(node));
  scene.addChild(wrapper);

  const out = await io.writeBinary(doc);
  return out;
}
