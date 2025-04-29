import { getAr } from "../models/usersModel.js";
import { deleteFile } from "../controllers/usersController.js";

export default async function handler(req, res) {
    const agora = new Date()
    const modelosAr = await getAr()

    const expirados = modelosAr.filter(model => {
        const timestamp = new Date(model.timestamp)
        const expiracao = new Date(timestamp.getTime() + 15 * 60 * 1000)
        return expiracao <= agora
    })

    for (const model of expirados) {
        try {
            await deleteFile(model.driveId)
            console.log(`modelo ${model.driveId} deletado.`)
        } catch (err) {
            console.error(`Erro ao deletar ${model.driveId}: ${err.message}`)
        }
    }

    return new Response(JSON.stringify({ deletados: expirados.length }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    })
}
