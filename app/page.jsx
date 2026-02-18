'use client'

import { useState, useEffect, useRef } from 'react'

// ===== PROXIES CORS em cascata =====
const PROXIES = [
  (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url) => `https://corsproxy.io/?url=${encodeURIComponent(url)}`,
  (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url) => url,
]
let proxyAtivo = 0

async function fetchComProxy(url) {
  for (let i = proxyAtivo; i < PROXIES.length; i++) {
    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 8000)
      const res = await fetch(PROXIES[i](url), { signal: controller.signal })
      clearTimeout(timeout)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = JSON.parse(await res.text())
      proxyAtivo = i
      return data
    } catch (e) {
      /* tenta próximo */
    }
  }
  throw new Error('Todos os proxies falharam')
}

function extrairNome(url) {
  try {
    const u = new URL(url)
    return u.hostname.replace('www.', '')
  } catch {
    return url.replace(/https?:\/\//, '').split(':')[0]
  }
}

// ===== COMPONENTE: Card de Servidor =====
function ServidorCard({ srv, index, onEntrar, onExcluir }) {
  const [status, setStatus] = useState({ text: 'verificando...', tipo: 'idle' })
  const [expDate, setExpDate] = useState('')

  useEffect(() => {
    let mounted = true
    async function verificar() {
      try {
        const apiUrl = `${srv.baseUrl}player_api.php?username=${srv.username}&password=${srv.password}`
        const data = await fetchComProxy(apiUrl)
        if (!mounted) return
        if (data.user_info && data.user_info.auth === 1) {
          setStatus({ text: 'Online', tipo: 'online' })
          if (data.user_info.exp_date && data.user_info.exp_date !== '0' && data.user_info.exp_date !== null) {
            const d = new Date(parseInt(data.user_info.exp_date) * 1000).toLocaleDateString('pt-BR')
            setExpDate(`Expira: ${d}`)
          } else {
            setExpDate('Plano Vitalício')
          }
        } else {
          setStatus({ text: 'Acesso Negado', tipo: 'negado' })
        }
      } catch {
        if (mounted) setStatus({ text: 'Offline', tipo: 'offline' })
      }
    }
    verificar()
    return () => { mounted = false }
  }, [srv])

  const statusColor =
    status.tipo === 'online'
      ? 'text-green-400'
      : status.tipo === 'negado'
      ? 'text-red-400'
      : 'text-white/40'

  const dotColor =
    status.tipo === 'online'
      ? 'bg-green-400 shadow-[0_0_8px_#00ff88]'
      : status.tipo === 'negado'
      ? 'bg-red-400'
      : 'bg-white/20'

  return (
    <div
      className="relative flex flex-col items-center text-center rounded-3xl p-6 border transition-all duration-300 hover:-translate-y-2 hover:border-cyan-400 hover:bg-white/15"
      style={{
        background: 'var(--glass)',
        backdropFilter: 'blur(20px)',
        border: srv.preset ? '1px solid rgba(0,210,255,0.3)' : '1px solid var(--glass-border)',
      }}
    >
      {srv.preset && (
        <span className="absolute top-3 left-3 text-[9px] font-bold tracking-wide px-2 py-0.5 rounded-full bg-cyan-400 text-black">
          LISTA
        </span>
      )}
      {!srv.preset && (
        <button
          onClick={() => onExcluir(index)}
          className="absolute top-3 right-3 text-white/20 hover:text-red-400 text-xl bg-transparent border-none cursor-pointer transition-colors"
        >
          ×
        </button>
      )}

      {/* Ícone */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4 text-2xl"
        style={{
          background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
          boxShadow: '0 0 15px rgba(0,210,255,0.3)',
        }}
      >
        🎬
      </div>

      <h4 className="text-sm font-semibold break-all mb-1">{srv.nome}</h4>
      <p className="text-xs text-white/45 mb-2">👤 {srv.username}</p>

      {/* Status */}
      <div className={`flex items-center gap-1.5 text-xs ${statusColor}`}>
        <span
          className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor} ${status.tipo === 'online' ? 'dot-online' : ''}`}
        />
        {status.tipo === 'online' ? <strong>{status.text}</strong> : status.text}
      </div>
      {expDate && <p className="text-[10px] text-cyan-400 mt-1 font-light">{expDate}</p>}

      <button
        onClick={() => onEntrar(srv)}
        className="mt-4 w-full py-2.5 rounded-2xl font-semibold text-sm bg-white text-black hover:bg-cyan-400 transition-colors cursor-pointer border-none"
      >
        ACESSAR
      </button>
    </div>
  )
}

// ===== COMPONENTE: View do Player / Conteúdo =====
function PlayerView({ srv, onVoltar }) {
  const [view, setView] = useState('categorias') // 'categorias' | 'filmes' | 'player'
  const [categorias, setCategorias] = useState([])
  const [filmes, setFilmes] = useState([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState(null)
  const [filmeAtual, setFilmeAtual] = useState(null)
  const videoRef = useRef(null)

  useEffect(() => {
    carregarCategorias()
  }, [srv])

  async function carregarCategorias() {
    setLoading(true)
    setErro(null)
    setView('categorias')
    try {
      const data = await fetchComProxy(
        `${srv.baseUrl}player_api.php?username=${srv.username}&password=${srv.password}&action=get_vod_categories`
      )
      setCategorias(Array.isArray(data) ? data : [])
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  async function carregarFilmes(catId) {
    setLoading(true)
    setErro(null)
    setView('filmes')
    try {
      const data = await fetchComProxy(
        `${srv.baseUrl}player_api.php?username=${srv.username}&password=${srv.password}&action=get_vod_streams&category_id=${catId}`
      )
      setFilmes(Array.isArray(data) ? data : [])
    } catch (e) {
      setErro(e.message)
    } finally {
      setLoading(false)
    }
  }

  function abrirFilme(f) {
    setFilmeAtual(f)
    setView('player')
  }

  // Usa o proxy interno para evitar bloqueio Mixed Content (http → https)
  const rawStreamUrl = filmeAtual
    ? `${srv.baseUrl}movie/${srv.username}/${srv.password}/${filmeAtual.stream_id}.mp4`
    : ''
  const streamUrl = rawStreamUrl ? `/api/proxy?url=${encodeURIComponent(rawStreamUrl)}` : ''
  const streamUrlMkv = rawStreamUrl ? `/api/proxy?url=${encodeURIComponent(rawStreamUrl.replace('.mp4', '.mkv'))}` : ''
  const streamUrlTs  = rawStreamUrl ? `/api/proxy?url=${encodeURIComponent(rawStreamUrl.replace('.mp4', '.ts'))}` : ''

  return (
    <div>
      <button
        onClick={onVoltar}
        className="mb-10 px-8 py-4 rounded-2xl font-semibold text-base border transition-all cursor-pointer hover:bg-cyan-400 hover:text-black hover:border-transparent"
        style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: '#fff' }}
      >
        ← VOLTAR AO MENU PRINCIPAL
      </button>

      {loading && (
        <h3 className="text-center text-white/70 py-10">🔄 Sincronizando Biblioteca...</h3>
      )}

      {erro && (
        <div className="text-center py-10">
          <h3 className="text-red-400">❌ Erro de Conexão</h3>
          <p className="text-white/50 mt-2">{erro}</p>
        </div>
      )}

      {/* CATEGORIAS */}
      {!loading && !erro && view === 'categorias' && (
        <>
          <h2
            className="text-base uppercase tracking-widest mb-8 pl-4 text-white/80"
            style={{ borderLeft: '5px solid var(--primary)' }}
          >
            📁 Categorias de Filmes
          </h2>
          <div className="grid gap-6 pb-12" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {categorias.map((c) => (
              <div
                key={c.category_id}
                onClick={() => carregarFilmes(c.category_id)}
                className="rounded-2xl p-10 text-center cursor-pointer flex items-center justify-center min-h-28 border transition-all hover:bg-cyan-400 hover:border-white"
                style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
              >
                <h3 className="text-xl font-semibold tracking-wide m-0">{c.category_name}</h3>
              </div>
            ))}
          </div>
        </>
      )}

      {/* FILMES */}
      {!loading && !erro && view === 'filmes' && (
        <>
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={carregarCategorias}
              className="text-sm px-4 py-2 rounded-xl border cursor-pointer hover:bg-white/10 transition-colors"
              style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)', color: '#fff' }}
            >
              ← Categorias
            </button>
            <h2
              className="text-base uppercase tracking-widest pl-4 text-white/80 m-0"
              style={{ borderLeft: '5px solid var(--primary)' }}
            >
              🎬 Filmes Disponíveis
            </h2>
          </div>
          <div className="grid gap-6 pb-12" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
            {filmes.map((f) => (
              <div
                key={f.stream_id}
                onClick={() => abrirFilme(f)}
                className="rounded-2xl cursor-pointer border overflow-hidden transition-all hover:scale-[1.03] hover:border-cyan-400 hover:z-10"
                style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
              >
                <img
                  src={f.stream_icon}
                  alt={f.name}
                  loading="lazy"
                  className="w-full object-cover block"
                  style={{ height: '400px' }}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x450/0a0e17/00d2ff?text=Sem+Imagem'
                  }}
                />
                <div
                  className="p-4 flex items-center justify-center min-h-16"
                  style={{ background: 'rgba(0,0,0,0.5)' }}
                >
                  <p className="text-base font-semibold m-0 leading-tight text-center">{f.name}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* PLAYER */}
      {view === 'player' && filmeAtual && (
        <div className="text-center pb-12">
          <h3 className="mb-6 text-3xl font-semibold text-cyan-400">▶️ {filmeAtual.name}</h3>
          <video
            ref={videoRef}
            controls
            autoPlay
            className="w-full max-w-5xl"
            onError={() => {
              document.getElementById('playerErro')?.style && (document.getElementById('playerErro').style.display = 'block')
            }}
          >
            <source src={streamUrl} type="video/mp4" />
            <source src={streamUrlMkv} type="video/x-matroska" />
            <source src={streamUrlTs} type="video/mp2t" />
          </video>

            <div
            id="playerErro"
            className="hidden mt-5 mx-auto max-w-2xl p-5 rounded-2xl border border-red-400 text-left"
            style={{ background: 'rgba(255,71,87,0.1)' }}
          >
            <p className="text-red-400 mb-3 m-0">⚠️ Erro ao reproduzir o vídeo.</p>
            <p className="text-white/60 text-sm mb-5">Tente abrir externamente:</p>
            <div className="flex gap-3 flex-wrap justify-center">
              <a
                href={rawStreamUrl}
                target="_blank"
                rel="noreferrer"
                className="bg-cyan-400 text-black px-5 py-3 rounded-xl font-bold text-sm no-underline"
              >
                🔗 Abrir em nova aba
              </a>
              <button
                onClick={() => { window.location.href = `vlc://${rawStreamUrl}` }}
                className="px-5 py-3 rounded-xl font-bold text-sm cursor-pointer border border-orange-400 text-orange-400"
                style={{ background: 'rgba(255,165,0,0.15)' }}
              >
                🎬 Abrir no VLC
              </button>
              <button
                onClick={() => navigator.clipboard.writeText(rawStreamUrl).then(() => alert('✅ Link copiado!'))}
                className="px-5 py-3 rounded-xl font-bold text-sm cursor-pointer text-white border"
                style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
              >
                📋 Copiar Link
              </button>
            </div>
          </div>

          <div className="mt-6 flex gap-3 justify-center flex-wrap">
            <button
              onClick={carregarCategorias}
              className="px-6 py-3 rounded-xl cursor-pointer text-white border transition-all hover:bg-white/10"
              style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
            >
              ← Voltar para Filmes
            </button>
            <a
              href={rawStreamUrl}
              target="_blank"
              rel="noreferrer"
              className="px-6 py-3 rounded-xl font-semibold text-cyan-400 border border-cyan-400 no-underline transition-all hover:bg-cyan-400 hover:text-black"
              style={{ background: 'rgba(0,210,255,0.1)' }}
            >
              🔗 Link Direto
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

// ===== PÁGINA PRINCIPAL =====
export default function Home() {
  const [tab, setTab] = useState('servidores')
  const [servidoresDB, setServidoresDB] = useState([])
  const [servidoresSalvos, setServidoresSalvos] = useState([])
  const [loadingDB, setLoadingDB] = useState(true)
  const [erroCarregamento, setErroCarregamento] = useState(null)
  const [srvAtivo, setSrvAtivo] = useState(null) // servidor selecionado para o player

  // Form de adicionar
  const [formNome, setFormNome] = useState('')
  const [formUrl, setFormUrl] = useState('')
  const [formUser, setFormUser] = useState('')
  const [formPass, setFormPass] = useState('')

  // Busca servidores do Supabase via API route (servidor-side)
  useEffect(() => {
    async function buscarServidores() {
      try {
        const res = await fetch('/api/servidores')
        const json = await res.json()
        if (json.error) throw new Error(json.error)

        // Converte formato do banco para formato interno
        const convertidos = (json.servidores || []).map((s) => {
          let url = s.url
          if (!url.endsWith('/')) url += '/'
          return {
            nome: s.nome || extrairNome(s.url),
            baseUrl: url,
            username: s.usuario,
            password: s.senha,
            preset: true,
            dbId: s.id,
          }
        })
        setServidoresDB(convertidos)
      } catch (e) {
        setErroCarregamento(e.message)
      } finally {
        setLoadingDB(false)
      }
    }

    buscarServidores()
  }, [])

  // Carrega servidores manuais do localStorage
  useEffect(() => {
    const salvos = JSON.parse(localStorage.getItem('servidoresIPTV') || '[]')
    setServidoresSalvos(salvos)
  }, [])

  const todosServidores = [...servidoresDB, ...servidoresSalvos]

  function excluirServidor(indexManual) {
    if (!confirm('Excluir servidor?')) return
    const novos = [...servidoresSalvos]
    novos.splice(indexManual, 1)
    localStorage.setItem('servidoresIPTV', JSON.stringify(novos))
    setServidoresSalvos(novos)
  }

  function adicionarServidor() {
    if (!formNome || !formUrl || !formUser || !formPass) {
      alert('Preencha todos os campos!')
      return
    }
    let url = formUrl.trim()
    if (!url.endsWith('/')) url += '/'
    const novo = { nome: formNome.trim(), baseUrl: url, username: formUser.trim(), password: formPass.trim() }
    const novos = [...servidoresSalvos, novo]
    localStorage.setItem('servidoresIPTV', JSON.stringify(novos))
    setServidoresSalvos(novos)
    setFormNome(''); setFormUrl(''); setFormUser(''); setFormPass('')
    setTab('servidores')
  }

  if (srvAtivo) {
    return (
      <div>
        <header className="py-10 px-5 text-center">
          <h1
            className="text-4xl font-semibold m-0"
            style={{
              background: 'linear-gradient(to right, #ffffff, var(--primary))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 15px rgba(0,210,255,0.4))',
            }}
          >
            🎬 IPTV ULTRA VISION
          </h1>
        </header>
        <main className="max-w-[1600px] mx-auto px-5">
          <PlayerView srv={srvAtivo} onVoltar={() => setSrvAtivo(null)} />
        </main>
      </div>
    )
  }

  return (
    <div>
      <header className="py-10 px-5 text-center">
        <h1
          className="text-4xl font-semibold m-0"
          style={{
            background: 'linear-gradient(to right, #ffffff, var(--primary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 15px rgba(0,210,255,0.4))',
          }}
        >
          🎬 IPTV ULTRA VISION
        </h1>
      </header>

      <main className="max-w-[1600px] mx-auto px-5 pb-20">
        {/* Tabs */}
        <div className="flex gap-2.5 mb-8">
          {[
            { id: 'servidores', label: '📡 Servidores' },
            { id: 'adicionar', label: '➕ Adicionar' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 py-2.5 rounded-full font-semibold text-sm cursor-pointer border transition-all ${
                tab === t.id
                  ? 'bg-cyan-400 border-cyan-400 text-black'
                  : 'text-white hover:bg-cyan-400 hover:text-black hover:border-cyan-400'
              }`}
              style={
                tab !== t.id
                  ? { background: 'var(--glass)', border: '1px solid var(--glass-border)' }
                  : {}
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* TAB: SERVIDORES */}
        {tab === 'servidores' && (
          <>
            <p className="text-center text-sm text-white/35 mb-5">
              {loadingDB
                ? '⏳ Carregando servidores do banco de dados...'
                : erroCarregamento
                ? `⚠️ Erro ao carregar do banco: ${erroCarregamento}`
                : `${servidoresDB.length} servidores do banco  |  ${servidoresSalvos.length} adicionados manualmente`}
            </p>

            {loadingDB ? (
              <div className="grid gap-5" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="rounded-3xl h-52 animate-pulse"
                    style={{ background: 'var(--glass)' }}
                  />
                ))}
              </div>
            ) : (
              <div
                className="grid gap-5 mb-14"
                style={{
                  gridTemplateColumns: 'repeat(5, 1fr)',
                }}
              >
                {todosServidores.map((srv, index) => (
                  <ServidorCard
                    key={srv.dbId ?? `manual-${index}`}
                    srv={srv}
                    index={index}
                    onEntrar={(s) => setSrvAtivo(s)}
                    onExcluir={(i) => excluirServidor(i - servidoresDB.length)}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* TAB: ADICIONAR */}
        {tab === 'adicionar' && (
          <div
            className="max-w-2xl mx-auto rounded-3xl p-10 border"
            style={{ background: 'var(--glass)', border: '1px solid var(--glass-border)' }}
          >
            <h2 className="text-center mt-0 mb-6 text-xl font-semibold">➕ Adicionar Novo Acesso</h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                { val: formNome, set: setFormNome, ph: 'Nome da Lista', type: 'text' },
                { val: formUrl, set: setFormUrl, ph: 'URL Host (ex: http://servidor.com:80)', type: 'text' },
                { val: formUser, set: setFormUser, ph: 'Usuário', type: 'text' },
                { val: formPass, set: setFormPass, ph: 'Senha', type: 'password' },
              ].map(({ val, set, ph, type }) => (
                <input
                  key={ph}
                  type={type}
                  placeholder={ph}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  className="col-span-1 px-4 py-4 rounded-xl text-sm text-white outline-none focus:border-cyan-400 transition-colors"
                  style={{
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--glass-border)',
                    fontFamily: 'Poppins, sans-serif',
                  }}
                />
              ))}
              <button
                onClick={adicionarServidor}
                className="col-span-2 py-4 rounded-xl font-semibold text-base cursor-pointer transition-all hover:bg-white hover:text-black border-none text-white"
                style={{ background: 'var(--primary)' }}
              >
                CONECTAR E SALVAR
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Responsividade via style tag */}
      <style jsx>{`
        @media (max-width: 1200px) {
          main > div:last-child > div.grid {
            grid-template-columns: repeat(3, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          main > div:last-child > div.grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  )
}
