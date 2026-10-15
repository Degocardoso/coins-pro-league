-- A liga é no EA SPORTS FC 27: corrige o texto do regulamento já salvo no banco, sem mexer no resto do que foi editado
UPDATE "paginas" SET "conteudo" = replace("conteudo", 'FC 26', 'FC 27'), "titulo" = replace("titulo", 'FC 26', 'FC 27') WHERE "conteudo" LIKE '%FC 26%' OR "titulo" LIKE '%FC 26%';
