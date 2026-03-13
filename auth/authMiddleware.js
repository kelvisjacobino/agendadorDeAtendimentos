const jwt = require("jsonwebtoken")

function auth(req,res,next){

const token = req.headers.authorization

if(!token) return res.status(401).json({erro:"Não autenticado"})

try{

const decoded = jwt.verify(token,"docai_secret")

req.usuario = decoded

next()

}catch{

res.status(401).json({erro:"Token inválido"})

}

}

module.exports = auth