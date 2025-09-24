import { useState } from "react";

export default function TestDriveForm() {
  const [formData, setFormData] = useState({
    title: "",
    imagemUrl: null,
    content: "",
    category: "",
    attachmentUrl: ""
  });

  // Função para atualizar qualquer campo
  function handleChange(e) {
    const { name, value, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value // se for file pega o arquivo
    }));
  }

  // Função para enviar
  function handleSubmit(e) {
    e.preventDefault();
    console.log(formData);
    // aqui você pode mandar pro Firebase ou backend
  }

  return (
    <section
      style={{ display: "flex", flexDirection: "column", width: "30rem", padding: "2rem", margin: "0 auto" }}
      className="teste"
    >
      <h1>Test-drive</h1>

      <input
        type="text"
        name="title"
        placeholder="title"
        value={formData.title}
        onChange={handleChange}
      />

      <input
        type="file"
        name="imagemUrl"
        onChange={handleChange}
      />

      <input
        type="text"
        name="content"
        placeholder="content"
        value={formData.content}
        onChange={handleChange}
      />

      <input
        type="text"
        name="category"
        placeholder="category"
        value={formData.category}
        onChange={handleChange}
      />

      <input
        type="text"
        name="attachmentUrl"
        placeholder="attachmentUrl"
        value={formData.attachmentUrl}
        onChange={handleChange}
      />

      <button onClick={handleSubmit}>Enviar</button>
    </section>
  );
}
