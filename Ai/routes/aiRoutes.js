const express = require("express");
const router = express.Router();

const { analisarProblema } = require("../services/geminiService");
const { resumirAtendimento } = require("../services/resumoService");
const { gerarRespostaCliente } = require("../services/respostaClienteService");
const { analisarErro } = require("../services/analiseService");
const { copiloto, copilotoAnalista } = require("../services/copilotoService");





router.post("/copiloto", async (req,res)=>{

 try{

  const { pergunta } = req.body;

  const resposta = await copiloto(pergunta);

  res.json(resposta);

 }catch(err){

  console.error(err);

  res.json({
   resposta:"Erro ao consultar IA",
   origem:"ERRO"
  })

 }

});

module.exports = router;

router.post("/resumir", async (req,res)=>{

 try{

  const { texto } = req.body;

  const resumo = await resumirAtendimento(texto);

  res.json({ resumo });

 }catch(err){

  console.error(err);

  res.status(500).json({ erro:"Erro ao resumir atendimento" });

 }

});




router.post("/analise", async (req,res)=>{

 try{

  const { erro } = req.body;

  const resposta = await analisarErro(erro);

  res.json({ resposta });

 }catch(err){

  console.error(err);

  res.status(500).json({ erro:"Erro na análise" });

 }

});

router.get("/teste",(req,res)=>{
 res.json({status:"IA funcionando"})
});

// Diagnóstico de erro
router.post("/analise", async (req, res) => {

 try{

  const problema = req.body.problema;

  const resposta = await analisarProblema(problema);

  res.json({ resposta });

 }catch(err){

  console.error(err);

  res.status(500).json({erro:"Falha na análise"});

 }

});

// Resumo de atendimento
router.post("/resumir", async (req,res)=>{

 try{

  const texto = req.body.texto;

  const resumo = await resumirAtendimento(texto);

  res.json({ resumo });

 }catch(err){

  console.error(err);

  res.status(500).json({erro:"Erro ao resumir"});

 }

});

// Gerar resposta para cliente
router.post("/respostaCliente", async (req,res)=>{

 try{

  const { problema, solucao } = req.body;

  const resposta = await gerarRespostaCliente(problema, solucao);

  res.json({ resposta });

 }catch(err){

  console.error(err);

  res.status(500).json({erro:"Erro ao gerar resposta"});

 }

});

module.exports = router;