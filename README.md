# Central CEO de Bets

Painel executivo para acompanhar benchmarking, marcas, jornada publica, metricas externas e sinais operacionais.

## Rodar localmente

```bash
npm start
```

O servidor abre em `http://127.0.0.1:64869`.

## GitHub Pages

O projeto tambem funciona como site estatico no GitHub Pages. Quando as rotas `/api/...` nao existem, o painel usa os snapshots em `data/`.

Pontos interativos que exigem backend Node, como rodar conectores e salvar inputs manuais, ficam disponiveis apenas quando o `server.cjs` esta rodando.
