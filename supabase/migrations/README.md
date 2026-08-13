# Supabase Migrations (Manual)

Este diretório contém o histórico do schema da base de dados Supabase da MUSA.
Nota Importante: O schema original (`00001_initial_schema.sql`) foi aplicado **manualmente** via SQL Editor do Supabase Dashboard, e não via CLI do Supabase.

Estes ficheiros servem apenas como **registo e versionamento da fonte de verdade** do que já se encontra a correr em produção.

## Como aplicar o Schema num ambiente novo
Se precisares de recriar a base de dados (ex: num projeto Supabase novo para Staging):
1. Abre o Dashboard do teu novo projeto Supabase.
2. Vai ao **SQL Editor** no menu lateral.
3. Clica em **New Query**.
4. Abre o ficheiro `00001_initial_schema.sql` localmente, copia todo o conteúdo.
5. Cola no SQL Editor e clica em **Run**.
6. Repete os passos cronologicamente para eventuais ficheiros `00002_...`, `00003_...`, etc.

## Como criar uma nova Migration (Daqui para a frente)
Para introduzir alterações na base de dados (adicionar colunas, mudar RLS, criar tabelas), o processo é:
1. Testa e aplica a tua query SQL primeiramente de forma direta no **SQL Editor** do projeto real no Supabase Dashboard.
2. Certifica-te que funciona e que os dados/UI respondem bem.
3. Cria um ficheiro local nesta pasta numerado sequencialmente. Exemplo: `00002_add_discount_column.sql`.
4. Cola apenas a instrução SQL incremental (ex: `ALTER TABLE products ADD COLUMN discount INT;`) nesse ficheiro.
5. Faz _commit_ deste ficheiro no repositório.

Isto garante que o código versionado no repositório GitHub corresponde estritamente ao que já está online e funcional, evitando divergências.
