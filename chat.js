// Lógica do chat com backend (OpenAI via proxy local)

const chatMessagesEl = document.getElementById('chatMessages');
const chatFormEl = document.getElementById('chatForm');
const chatInputEl = document.getElementById('chatInput');
const sendBtnEl = document.getElementById('sendBtn');
let typingEl = null;

addAssistantMessage('Olá! Sou seu assistente especializado em pulmão, doenças hepáticas e patologia. Como posso ajudar hoje?');

chatFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = chatInputEl.value.trim();
  if (!text) return;
  addUserMessage(text);
  chatInputEl.value = '';

  sendBtnEl.disabled = true;
  try {
    showTyping();
    const answer = await fetchAnswer(text);
    hideTyping();
    addAssistantMessage(answer);
  } catch (err) {
    console.error(err);
    hideTyping();
    addAssistantMessage('Desculpe, ocorreu um erro ao consultar o modelo. Tente novamente.');
  } finally {
    sendBtnEl.disabled = false;
  }
});

async function fetchAnswer(userText) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: 'Você é um assistente médico especializado em pulmão, doenças hepáticas e patologia. Responda em linguagem simples, técnica quando necessário, e sempre em português. Inclua avisos de que não substitui consulta médica.' },
        { role: 'user', content: userText }
      ]
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || 'Erro na API');
  }

  const data = await res.json();
  return data.answer || 'Sem resposta.';
}

function addUserMessage(text) {
  const el = document.createElement('div');
  el.className = 'flex justify-end';
  el.innerHTML = `
    <div class="max-w-[85%] rounded-lg bg-emerald-700 text-white px-3 py-2 text-sm">${escapeHtml(text)}</div>
  `;
  chatMessagesEl.appendChild(el);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function addAssistantMessage(text) {
  const el = document.createElement('div');
  el.className = 'flex justify-start';
  el.innerHTML = `
    <div class="max-w-[85%] rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm whitespace-pre-wrap">${escapeHtml(text)}</div>
  `;
  chatMessagesEl.appendChild(el);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function showTyping() {
  if (typingEl) return;
  typingEl = document.createElement('div');
  typingEl.className = 'flex justify-start';
  typingEl.innerHTML = `
    <div class="max-w-[85%] rounded-lg bg-slate-800 border border-slate-700 px-3 py-2 text-sm whitespace-pre-wrap">
      <span class="inline-flex">
        <span class="w-1.5 h-1.5 bg-slate-300 rounded-full mx-[2px] animate-pulse"></span>
        <span class="w-1.5 h-1.5 bg-slate-300 rounded-full mx-[2px] animate-pulse" style="animation-delay:120ms"></span>
        <span class="w-1.5 h-1.5 bg-slate-300 rounded-full mx-[2px] animate-pulse" style="animation-delay:240ms"></span>
      </span>
    </div>`;
  chatMessagesEl.appendChild(typingEl);
  chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
}

function hideTyping() {
  if (!typingEl) return;
  typingEl.remove();
  typingEl = null;
}

function escapeHtml(unsafe) {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}


