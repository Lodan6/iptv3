/**
 * GET /api/proxy?url=http://servidor.com/movie/user/pass/123.mp4
 *
 * Faz o proxy do stream IPTV (http) pelo servidor Next.js (https),
 * evitando o bloqueio de Mixed Content no browser.
 *
 * Suporta Range requests (seek no vídeo).
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const targetUrl = searchParams.get('url')

  if (!targetUrl) {
    return new Response('Parâmetro "url" ausente', { status: 400 })
  }

  // Segurança: só aceita URLs http/https
  if (!/^https?:\/\//i.test(targetUrl)) {
    return new Response('URL inválida', { status: 400 })
  }

  try {
    // Repassa o header Range para suportar seek no vídeo
    const headers = {}
    const range = request.headers.get('range')
    if (range) headers['Range'] = range

    const upstream = await fetch(targetUrl, {
      headers,
      // Não seguir redirect automático para manter controle
      redirect: 'follow',
    })

    // Monta headers de resposta
    const responseHeaders = {
      'Content-Type': upstream.headers.get('Content-Type') || 'video/mp4',
      'Accept-Ranges': 'bytes',
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*',
    }

    const contentLength = upstream.headers.get('Content-Length')
    if (contentLength) responseHeaders['Content-Length'] = contentLength

    const contentRange = upstream.headers.get('Content-Range')
    if (contentRange) responseHeaders['Content-Range'] = contentRange

    return new Response(upstream.body, {
      status: upstream.status,
      headers: responseHeaders,
    })
  } catch (err) {
    console.error('[/api/proxy] Erro:', err.message)
    return new Response('Erro ao conectar ao servidor IPTV', { status: 502 })
  }
}
