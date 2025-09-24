// import { useState } from "react";

// export default function TestDriveForm() {
//   const [formData, setFormData] = useState({
//     title: "",
//     imagemUrl: null,
//     content: "",
//     category: "",
//     attachmentUrl: ""
//   });

//   // Função para atualizar qualquer campo
//   function handleChange(e) {
//     const { name, value, files } = e.target;
//     setFormData((prev) => ({
//       ...prev,
//       [name]: files ? files[0] : value // se for file pega o arquivo
//     }));
//   }

//   // Função para enviar
//   function handleSubmit(e) {
//     e.preventDefault();
//     console.log(formData);
//     // aqui você pode mandar pro Firebase ou backend
//   }

//   return (
//     <section
//       style={{ display: "flex", flexDirection: "column", width: "30rem", padding: "2rem", margin: "0 auto" }}
//       className="teste"
//     >
//       <h1>Test-drive</h1>

//       <input
//         type="text"
//         name="title"
//         placeholder="title"
//         value={formData.title}
//         onChange={handleChange}
//       />

//       <input
//         type="file"
//         name="imagemUrl"
//         onChange={handleChange}
//       />

//       <input
//         type="text"
//         name="content"
//         placeholder="content"
//         value={formData.content}
//         onChange={handleChange}
//       />

//       <input
//         type="text"
//         name="category"
//         placeholder="category"
//         value={formData.category}
//         onChange={handleChange}
//       />

//       <input
//         type="text"
//         name="attachmentUrl"
//         placeholder="attachmentUrl"
//         value={formData.attachmentUrl}
//         onChange={handleChange}
//       />

//       <button onClick={handleSubmit}>Enviar</button>
//     </section>
//   );
// }


import { useState } from "react";

export default function TestDriveForm() {
  const [formData, setFormData] = useState({
    title: "",
    imagemFile: null,        // File (imagem)
    attachmentFile: null,    // File (anexo)
    content: "",
    category: "",
  });
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: files ? files[0] : value
    }));
  }

  // validações simples (opcional)
  function validate() {
    if (!formData.title.trim()) return "Título é obrigatório";
    if (!formData.content.trim()) return "Conteúdo é obrigatório";
    if (!formData.category.trim()) return "Categoria é obrigatória";

    // exemplo de limite de 8MB para uploads (ajuste conforme seu host)
    const MAX = 8 * 1024 * 1024;
    if (formData.imagemFile && formData.imagemFile.size > MAX) return "Imagem maior que 8MB";
    if (formData.attachmentFile && formData.attachmentFile.size > MAX) return "Anexo maior que 8MB";
    return null;
  }

  async function uploadFile(file) {
    if (!file) return null;
    const fd = new FormData();
    fd.append("file", file); // upload.php espera "file"

    const res = await fetch("/api/hostgator/upload", {
      method: "POST",
      body: fd
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Falha no upload (${file.name}): ${text}`);
    }
    const data = await res.json(); // { success, url }
    return data.url || null;       // ex: /vercel/arquivoXYZ.jpg
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const error = validate();
    if (error) {
      alert(error);
      return;
    }

    setLoading(true);
    try {
      // 1) sobe imagem e anexo (em paralelo)
      const [imageUrl, attachmentUrl] = await Promise.all([
        uploadFile(formData.imagemFile),
        uploadFile(formData.attachmentFile),
      ]);

      // 2) cria a notícia
      const res = await fetch("/api/hostgator/news", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title.trim(),
          content: formData.content.trim(),
          category: formData.category.trim(),
          imageUrl: imageUrl,                 // pode ser null
          attachmentUrl: attachmentUrl || null
        })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Erro ao salvar notícia");

      alert(`Notícia criada! ID: ${json.id}`);

      // limpar
      setFormData({
        title: "",
        imagemFile: null,
        attachmentFile: null,
        content: "",
        category: "",
      });
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section style={{ display:"flex", flexDirection:"column", width:"30rem", padding:"2rem", margin:"0 auto" }}>
      <h1>Test-drive</h1>

      <input
        type="text"
        name="title"
        placeholder="title"
        value={formData.title}
        onChange={handleChange}
        required
      />

      {/* Imagem */}
      <input
        type="file"
        name="imagemFile"
        accept="image/*"
        onChange={handleChange}
      />

      {/* Anexo (pdf/doc/docx/xls/xlsx/zip, etc) */}
      <input
        type="file"
        name="attachmentFile"
        accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleChange}
      />

      <input
        type="text"
        name="category"
        placeholder="category"
        value={formData.category}
        onChange={handleChange}
        required
      />

      <textarea
        name="content"
        placeholder="content"
        value={formData.content}
        onChange={handleChange}
        rows={6}
        required
      />

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </section>
  );
}
