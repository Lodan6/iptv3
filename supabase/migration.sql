-- =============================================
-- IPTV Ultra Vision - Supabase Migration
-- Execute este SQL no SQL Editor do Supabase
-- =============================================

-- 1. Criar tabela de servidores
CREATE TABLE IF NOT EXISTS servidores (
  id          BIGSERIAL PRIMARY KEY,
  nome        TEXT,
  url         TEXT NOT NULL,
  usuario     TEXT NOT NULL,
  senha       TEXT NOT NULL,
  ativo       BOOLEAN DEFAULT TRUE,
  criado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE servidores ENABLE ROW LEVEL SECURITY;

-- 3. Política: qualquer pessoa pode LER (SELECT) — acesso público à lista
CREATE POLICY "leitura_publica" ON servidores
  FOR SELECT USING (true);

-- 4. Política: só service_role pode inserir/editar/deletar (via API segura)
-- (nenhuma policy de INSERT/UPDATE/DELETE = bloqueado para anon)

-- 5. Inserir os servidores do JSON
INSERT INTO servidores (url, usuario, senha) VALUES
  ('http://cinefull.space:80',           '933159816',           '542764549'),
  ('http://play.xplist.vip:80',          'joaodovalelemos173',  'xjur78cyik'),
  ('http://bkgpt.xyz:80',                '122004707',           '825901539'),
  ('http://saltbrth.xyz',                '860094401',           '919954914'),
  ('http://pfsv.io:80',                  'ae1070',              'uf4852'),
  ('http://firetop1.site:80',            '882499451',           '755222663'),
  ('http://ibo.playmove.org:80',         '16981316369',         'qw169813163'),
  ('http://popo64.live:80',              '239461100',           '628218422'),
  ('http://voa1.online',                 '5193271958',          '5193271ips1'),
  ('http://7vnx.xyz',                    '9882848144',          '988284Bagtts'),
  ('http://acessar.fun:8080',            '438200193',           '440961511'),
  ('http://mw3.tvzinha.org',             'Avelinobaessa',       'Brava2'),
  ('http://7smartvplayers.top:2052',     '5193271958',          '5193271ips1'),
  ('http://arenaf.shop',                 '1428056',             '123456'),
  ('http://cdnrptv.com:80',              '151471364',           '789885229'),
  ('http://firetop1.site',               '396476813',           '316224872'),
  ('http://hsgbola1.xyz',                '12345678',            '12345678'),
  ('http://xcloudcine.xyz:80',           '821292513',           '696262652'),
  ('http://jrplay.online:80',            '264731652',           '591947819'),
  ('http://telefone.site:80',            '970812242170',        '581997329569'),
  ('http://2025easy.lat:80',             'dvezmaal',            'Rd2e7q64iP'),
  ('http://aetherflow.link:80',          '91976071',            '42026324'),
  ('http://sansuygtv.site:8080',         'augustolopes',        '72yekwxvia'),
  ('http://tvclick.icu:8080',            'Gizvid169@giz.com',   '1234@4321'),
  ('http://btkq72.net',                  'SOFIANBENAISSA',      'X7KJL94'),
  ('http://newvision.show',              '666666',              '666666'),
  ('http://play.1list.vip',             'Camillahrcc',          'lfc5ic3rw7v'),
  ('http://jsplus.click:80',             '228449635',           '936761862'),
  ('http://cdn4k.vip:80',               '9671a720u6',           '1r1936z19w'),
  ('http://primecdn.xyz:80',             '796057099',           '518547059'),
  ('http://yesme.shop',                  'bryan02',             '0102030405'),
  ('http://syncorecdn.online',           'JOEMESON960',         '895386791'),
  ('http://fripnt.xyz',                  '777777',              '777777'),
  ('http://croxm.site',                  'Gledson',             'Gledson'),
  ('http://cabide.top:80',               '709327053',           '557257162'),
  ('http://dnsit.click:8080',            'Izaque',              'tv866965590'),
  ('http://lphas.click:80',              '447426830844',        'gr4474268236'),
  ('http://dnssp.site:8080',             'Rosana001',           '24022022'),
  ('http://x2caverinhas.store',          'demazao',             '48988403794'),
  ('http://a.mx51.online:80',            'tuanyrodrigues01tv',  '1739174maac'),
  ('http://sigcine1.space',              '913172268',           '775188754'),
  ('http://osominfo.click',              'andrei1173',          '5596851173');
