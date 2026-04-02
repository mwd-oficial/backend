import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import sharp from 'sharp';
import { put, del } from '@vercel/blob';
import { NodeIO } from '@gltf-transform/core';
import { getUsers, postUser, getUsername, getEmail, deleteUser, putUser, getModels, postModels, getModelId, putModel, getAr, postAr, deleteAr } from "../models/usersModel.js";







export async function uploadToVercelBlob(buffer, pathname, contentType) {
    const blob = await put(pathname, buffer, {
        access: 'public', // ou 'private', dependendo do seu caso
        token: process.env.BLOB_READ_WRITE_TOKEN,
        content_type: contentType,
    });

    // blob.url é a URL base e blob.downloadUrl força o download
    return blob.url;
}

export async function deleteFile(blobPath) {
    try {
        await del(blobPath, {
            token: process.env.BLOB_READ_WRITE_TOKEN,
        })
        console.log(`Arquivo ${blobPath} deletado com sucesso.`)
    } catch (erro) {
        console.error(`Erro ao deletar ${blobPath}: ${erro.message}`)
    }
}







////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////





// Users


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
            const novoBuffer = req.file.buffer;
            const otimizado = await otimizarImg(novoBuffer)
            const blobFileName = `${req.body.username}.avif`;
            const contentType = 'image/avif';
            const blobUrl = await uploadToVercelBlob(otimizado, blobFileName, contentType);

            userData.imagemUrl = blobUrl;
            await putUser(newUser.insertedId, {
                imagemUrl: userData.imagemUrl,
                preencher: userData.preencher
            });
        } else if (JSON.parse(userData.semFoto)) {
            await putUser(newUser.insertedId, {
                imagemUrl: "",
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

async function otimizarImg(imageBuffer) {
    try {
        const optimizedBuffer = await sharp(imageBuffer)
            .rotate()
            .resize(600, 600, { fit: 'inside' })
            .toFormat('avif', { quality: 50 })
            .toBuffer();
        return optimizedBuffer
    } catch (erro) {
        console.log("Erro ao otimizar a imagem com sharp: " + erro)
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
        await deleteFile(userData.imagemUrl)
        const excludedUser = await deleteUser({ username: userData.username });
        return res.status(200).json(excludedUser);
    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

export async function excluirTodosUser(req, res) {
    try {
        const users = await getUsers();
        users.forEach(async (userData) => {
            await deleteUser({ username: userData.username });
        })
        return res.status(200).send("Todos os usuários foram excluídos com sucesso.");
    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
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
            await deleteFile(userData.oldimagemUrl)
            const novoBuffer = req.file.buffer;
            const otimizado = await otimizarImg(novoBuffer)
            const blobFileName = `${req.body.username}.avif`;
            const contentType = 'image/avif';
            const blobUrl = await uploadToVercelBlob(otimizado, blobFileName, contentType);

            userData.imagemUrl = blobUrl;
            await putUser(userId, {
                imagemUrl: userData.imagemUrl,
                preencher: userData.preencher
            });
        } else if (JSON.parse(userData.semFoto)) {
            await deleteFile(userData.oldimagemUrl)
            await putUser(userId, {
                imagemUrl: "",
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















////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////





// ar

export async function listarAr(req, res) {
    const models = await getAr();
    return res.status(200).json(models);
}

export async function cadastrarAr(req, res) {
    console.log("ar executado");

    try {
        const filePath = req.body.src;

        if (!filePath) {
            return res.status(400).json({ "Erro": "Caminho do arquivo não enviado" });
        }

        // 🔥 Monta URL pública do arquivo
        const fileUrl = `https://raw.githubusercontent.com/mwd-oficial/backend/main/public/${filePath}`

        console.log("fileUrl:", fileUrl);

        let buffer;

        try {
            // 🔥 Busca o arquivo via HTTP (em vez de fs)
            const response = await fetch(fileUrl);

            if (!response.ok) {
                throw new Error("Erro ao buscar arquivo");
            }

            const arrayBuffer = await response.arrayBuffer();
            buffer = Buffer.from(arrayBuffer);

        } catch (erro) {
            console.error("Erro ao buscar arquivo:", erro);
            return res.status(400).json({ "Erro": "Arquivo não encontrado" });
        }

        // 2️⃣ Lê o buffer usando glTF-transform
        const io = new NodeIO();
        const doc = await io.readBinary(buffer);

        if (req.body.animacao) {
            // 3️⃣ Filtra animações
            const root = doc.getRoot();
            const animations = root.listAnimations();
            animations.forEach(anim => {
                if (anim.getName().toLowerCase() !== req.body.animacao.toLowerCase()) {
                    anim.dispose();
                }
            });
        }

        // 4️⃣ Regrava o modelo filtrado em buffer
        const arrayBuffer = await io.writeBinary(doc);
        const novoBuffer = Buffer.from(arrayBuffer);

        console.log('Arquivo pronto para upload no Vercel Blob!');

        // 5️⃣ Upload para Vercel Blob
        const blobFileName = `${req.body.nome || 'modelo'}-${req.body.timestamp}.glb`;
        const contentType = 'model/gltf-binary';
        const blobUrl = await uploadToVercelBlob(novoBuffer, blobFileName, contentType);

        console.log('Upload finalizado: ', blobUrl);

        // 6️⃣ Salva registro no banco
        await postAr({
            username: req.body.username,
            blobUrl: blobUrl, // Agora armazenamos a URL do Blob
            nomeBlob: blobFileName, // Armazenamos o nome do arquivo no Blob para referência futura
            nome: req.body.nome,
            nomeAnimacao: req.body.nomeAnimacao,
            animacao: req.body.animacao,
            timestamp: req.body.timestamp
        });

        // 7️⃣ Retorna a URL do arquivo no Blob
        return res.status(200).json({
            blobUrl: blobUrl,
        });

    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}

export async function excluirTodosAr(req, res) {
    try {
        const ar = await getAr();
        ar.forEach(async (modelData) => {
            await deleteAr({ username: modelData.username });
        })
        return res.status(200).send("Todos os AR foram excluídos com sucesso.");
    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
    }
}