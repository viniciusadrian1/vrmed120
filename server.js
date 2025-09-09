require('./chat_context');
// Servidor Node/Express: proxy para OpenAI e host estático
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const OpenAI = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Servir a aplicação estática
app.use(express.static(path.join(__dirname)));
// Servir node_modules para importar módulos ES diretamente no navegador
app.use('/node_modules', express.static(path.join(__dirname, 'node_modules')));

// Endpoint de chat
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body || {};
    if (!Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages inválido' });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Injeta uma instrução de segurança para fontes confiáveis e citações
    const systemSafety = {
      role: 'system',
      content:
        'Você é um assistente médico especializado em pulmão e patologia. Responda SOMENTE com base em fontes médicas reconhecidas (ex.: diretrizes EASL/AASLD, OMS, UpToDate, Harrison, Robbins, Cochrane, PubMed, livros-texto padrão). Quando possível, inclua 1-3 citações curtas (autor/órgão, ano) no final. Não invente dados. Se não tiver certeza, diga que não tem evidência suficiente. Responda em português e inclua que não substitui consulta médica.'
    };

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [systemSafety, ...messages],
      temperature: 0.2,
      max_tokens: 600
    });

    const answer = response.choices?.[0]?.message?.content || '';
    res.json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao consultar o modelo. Verifique sua OPENAI_API_KEY.');
  }
});

app.listen(port, '0.0.0.0', () => {
  console.log(`VR Med rodando em http://localhost:${port} (acesse via IP da rede local)`);
});


