// joaoaugusto.dev (raiz) -> www, preservando caminho e query. O hosting liga um
// endereço por app, então a raiz precisa de um app só pra isso.
require("http")
  .createServer((req, res) => {
    res.writeHead(308, { Location: `https://www.joaoaugusto.dev${req.url}` });
    res.end();
  })
  .listen(3000);
