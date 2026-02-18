import { createServerSupabase } from '../../../lib/supabase'

/**
 * GET /api/servidores
 * Retorna lista de servidores ativos do Supabase.
 * Roda no servidor — as credenciais do Supabase NUNCA chegam ao browser.
 */
export async function GET() {
  try {
    const supabase = createServerSupabase()

    const { data, error } = await supabase
      .from('servidores')
      .select('id, url, usuario, senha, nome')
      .eq('ativo', true)
      .order('id', { ascending: true })

    if (error) throw error

    return Response.json({ servidores: data })
  } catch (err) {
    console.error('[/api/servidores] Erro:', err.message)
    return Response.json(
      { error: 'Erro ao buscar servidores', servidores: [] },
      { status: 500 }
    )
  }
}
