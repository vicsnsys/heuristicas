document.addEventListener("DOMContentLoaded", function() {
  // "banco de dados" de mentira só pra testar
  var livros = [
    {titulo:"Dom Casmurro", autor:"Machado de Assis", isbn:"9788535902775", ano:1899},
    {titulo:"Memórias Póstumas de Brás Cubas", autor:"Machado de Assis", isbn:"9788535911664", ano:1881},
    {titulo:"Vidas Secas", autor:"Graciliano Ramos", isbn:"9788501019356", ano:1938},
    {titulo:"Grande Sertão: Veredas", autor:"João Guimarães Rosa", isbn:"9788520925270", ano:1956},
    {titulo:"A Hora da Estrela", autor:"Clarice Lispector", isbn:"9788532524270", ano:1977},
    {titulo:"Capitães da Areia", autor:"Jorge Amado", isbn:"9788535914061", ano:1937}
  ];

  var campos = ["autor", "titulo", "isbn"];
  var timer = null;
  var recentes = [];
  var backup = null;

  function $(id){ return document.getElementById(id); }

  function semAcento(t){
    return t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  }

  function escapar(t){
    return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  function setStatus(msg, tipo){
    var s = $("status");
    s.textContent = msg;
    s.className = tipo || "";
  }

  function limparErros(){
    campos.forEach(function(c){
      $("erro-" + c).textContent = "";
      $(c).classList.remove("invalido");
    });
  }

  function mostrarErro(campo, msg){
    $("erro-" + campo).textContent = msg;
    $(campo).classList.add("invalido");
  }

  function valores(){
    return {autor:$("autor").value.trim(), titulo:$("titulo").value.trim(), isbn:$("isbn").value.trim()};
  }

  $("isbn").addEventListener("input", function(){
    this.value = this.value.replace(/[^0-9-]/g, "");
  });

  campos.forEach(function(c){
    $(c).addEventListener("input", function(){
      $("erro-" + c).textContent = "";
      $(c).classList.remove("invalido");
    });
  });

  function validar(v){
    limparErros();
    if(!v.autor && !v.titulo && !v.isbn){
      mostrarErro("autor", "Nenhum campo preenchido. Digite o autor, o título ou o ISBN.");
      setStatus("Não foi possível pesquisar: preencha pelo menos um campo.", "erro-s");
      $("autor").focus();
      return false;
    }
    if(v.isbn){
      var n = v.isbn.replace(/-/g, "");
      if(n.length != 10 && n.length != 13){
        mostrarErro("isbn", "O ISBN tem " + n.length + " números. Ele precisa ter 10 ou 13.");
        setStatus("Corrija o ISBN para continuar.", "erro-s");
        $("isbn").focus();
        return false;
      }
    }
    return true;
  }

  function guardarRecente(v){
    var texto = [v.autor, v.titulo, v.isbn].filter(Boolean).join(" / ");
    recentes = recentes.filter(function(r){ return r.texto != texto; });
    recentes.unshift({texto:texto, v:v});
    if(recentes.length > 4) recentes.pop();
    desenharRecentes();
  }

  function desenharRecentes(){
    var div = $("recentes");
    div.hidden = false;
    div.innerHTML = "Pesquisas recentes: ";
    recentes.forEach(function(r){
      var a = document.createElement("a");
      a.textContent = r.texto;
      a.tabIndex = 0;
      a.onclick = function(){ preencher(r.v); };
      a.onkeydown = function(e){ if(e.key == "Enter") preencher(r.v); };
      div.appendChild(a);
    });
  }

  function preencher(v){
    $("autor").value = v.autor;
    $("titulo").value = v.titulo;
    $("isbn").value = v.isbn;
    limparErros();
    setStatus("Campos preenchidos com a pesquisa recente. Clique em Pesquisar.");
  }

  function pesquisar(v){
    guardarRecente(v);
    $("resultado").innerHTML = "";
    $("btnPesquisar").disabled = true;
    $("btnCancelar").hidden = false;
    setStatus("Pesquisando, aguarde...");

    timer = setTimeout(function(){
      $("btnPesquisar").disabled = false;
      $("btnCancelar").hidden = true;

      var isbn = v.isbn.replace(/-/g, "");
      var achados = livros.filter(function(l){
        var okAutor = !v.autor || semAcento(l.autor).indexOf(semAcento(v.autor)) > -1;
        var okTitulo = !v.titulo || semAcento(l.titulo).indexOf(semAcento(v.titulo)) > -1;
        var okIsbn = !isbn || l.isbn == isbn;
        return okAutor && okTitulo && okIsbn;
      });

      var buscou = [v.autor && ("autor: " + v.autor), v.titulo && ("título: " + v.titulo), v.isbn && ("ISBN: " + v.isbn)].filter(Boolean).join(", ");
      var html = "<p>Você pesquisou por <b>" + escapar(buscou) + "</b></p>";

      if(achados.length == 0){
        setStatus("Pesquisa concluída: nenhum livro encontrado.", "erro-s");
        html += "<p>Nenhum livro encontrado. Sugestões:</p><ul><li>Confira a escrita dos dados.</li><li>Tente pesquisar com menos campos preenchidos.</li></ul>";
      } else {
        setStatus("Pesquisa concluída: " + achados.length + (achados.length == 1 ? " livro encontrado." : " livros encontrados."), "ok");
        achados.forEach(function(l){
          html += "<div class='livro'><b>" + escapar(l.titulo) + "</b><br>Autor: " + escapar(l.autor) + "<br>ISBN: " + l.isbn + "<br>Ano: " + l.ano + "</div>";
        });
      }
      $("resultado").innerHTML = html;
    }, 1200);
  }

  $("form").addEventListener("submit", function(e){
    e.preventDefault();
    $("btnDesfazer").hidden = true;
    var v = valores();
    if(validar(v)) pesquisar(v);
  });

  $("btnCancelar").onclick = function(){
    clearTimeout(timer);
    $("btnPesquisar").disabled = false;
    $("btnCancelar").hidden = true;
    setStatus("Pesquisa cancelada. Seus dados continuam nos campos.");
  };

  $("btnLimpar").onclick = function(){
    var v = valores();
    if(!v.autor && !v.titulo && !v.isbn){
      setStatus("Os campos já estão vazios.");
      return;
    }
    backup = v;
    $("autor").value = ""; $("titulo").value = ""; $("isbn").value = "";
    limparErros();
    $("resultado").innerHTML = "";
    $("btnDesfazer").hidden = false;
    setStatus("Campos limpos. Clique em Desfazer se foi sem querer.");
    $("autor").focus();
  };

  $("btnDesfazer").onclick = function(){
    preencher(backup);
    $("btnDesfazer").hidden = true;
    setStatus("Campos restaurados.");
  };
});