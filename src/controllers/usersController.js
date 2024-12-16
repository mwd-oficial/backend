import { ObjectId } from "mongodb";
import bcrypt from "bcrypt";
import FormData from "form-data";
import axios from "axios";
import sharp from 'sharp';
import { getUsers, postUser, getUsername, getEmail, deleteUser, putUser } from "../models/usersModel.js";

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
        });

        if (req.file) {
            await uploadImgbb(req.file.buffer, userData, newUser.insertedId);
        } else if (JSON.parse(userData.semFoto)) {
            userData.imagem = "";
            await putUser(newUser.insertedId, { imagem: userData.imagem });
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
        const excludedUser = await deleteUser(userData.username);
        return res.status(200).json(excludedUser);
    } catch (erro) {
        console.error(erro.message);
        return res.status(500).json({ "Erro": "Falha na requisição" });
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
            await uploadImgbb(req.file.buffer, userData, userId);
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

async function uploadImgbb(imageBuffer, userData, id) {

    const optimizedBuffer = await sharp(imageBuffer)
        .rotate()
        .resize(200, 200, { fit: 'inside' })
        .toFormat('png')
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
        await putUser(id, { imagem: userData.imagem });
        console.log(res.data);
    } catch (erro) {
        console.error('Erro ao fazer upload para ImgBB:' + erro);
    }
}



