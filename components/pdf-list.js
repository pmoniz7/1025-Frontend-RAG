import styles from '../styles/pdf-list.module.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import { debounce } from 'lodash';
import PDFComponent from './pdf';

export default function PdfList() {
  const [pdfs, setPdfs] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filter, setFilter] = useState();
  const [questionText, setQuestionText] = useState(''); // Estado para o texto do input
  const didFetchRef = useRef(false);

  useEffect(() => {
    if (!didFetchRef.current) {
      didFetchRef.current = true;
      fetchPdfs();
    }
  }, []);

  async function fetchPdfs(selected) {
    let path = '/pdfs';
    if (selected !== undefined) {
      path = `/pdfs?selected=${selected}`;
    }
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + path);
    const json = await res.json();
    setPdfs(json);
  }

  const debouncedUpdatePdf = useCallback(debounce((pdf, fieldChanged) => {
    updatePdf(pdf, fieldChanged);
  }, 500), []);

  function handlePdfChange(e, id) {
    const target = e.target;
    const value = target.type === 'checkbox' ? target.checked : target.value;
    const name = target.name;
    const copy = [...pdfs];
    const idx = pdfs.findIndex((pdf) => pdf.id === id);
    const changedPdf = { ...pdfs[idx], [name]: value };
    copy[idx] = changedPdf;
    debouncedUpdatePdf(changedPdf, name);
    setPdfs(copy);
  }

  async function updatePdf(pdf, fieldChanged) {
    const body_data = JSON.stringify(pdf);
    const url = process.env.NEXT_PUBLIC_API_URL + `/pdfs/${pdf.id}`;
 
    await fetch(url, {
        method: 'PUT',
        body: body_data,
        headers: { 'Content-Type': 'application/json' }
    });
  }

  async function handleDeletePdf(id) {
    const res = await fetch(process.env.NEXT_PUBLIC_API_URL + `/pdfs/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });

    if (res.ok) {
      const copy = pdfs.filter((pdf) => pdf.id !== id);
      setPdfs(copy);
    }
  }

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  const handleUpload = async (event) => {
    event.preventDefault();
    if (!selectedFile) {
      alert("Please select file to load.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    const response = await fetch(process.env.NEXT_PUBLIC_API_URL + "/pdfs/upload", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      const newPdf = await response.json();
      setPdfs([...pdfs, newPdf]);
    } else {
      alert("Error loading file.");
    }
  };

  function handleFilterChange(value) {
    setFilter(value);
    fetchPdfs(value);
  }

  // Função para enviar a pergunta ao backend
  async function handleQuestionSubmit() {
    // Encontrar o PDF selecionado (assumindo que é o que tem selected: true)
    const selectedPdf = pdfs.find((pdf) => pdf.selected);
    if (!selectedPdf) {
      alert("Por favor, selecione um PDF antes de enviar uma pergunta.");
      return;
    }
    if (!questionText) {
      alert("Por favor, digite uma pergunta.");
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pdfs/qa-pdf/${selectedPdf.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: questionText }),
      });

      if (response.ok) {
        const answer = await response.text(); // A resposta é retornada como texto simples
        setQuestionText(answer); // Atualiza o input com a resposta
      } else {
        alert("Erro ao processar a pergunta.");
      }
    } catch (error) {
      console.error("Erro na requisição:", error);
      alert("Erro ao conectar com o backend.");
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.mainInputContainer}>
        <form onSubmit={handleUpload}>
          <input className={styles.mainInput} type="file" accept=".pdf" onChange={handleFileChange} />
          <button className={styles.loadBtn} type="submit">Load PDF</button>
        </form>
      </div>
      {!pdfs.length && <div>Loading...</div>}
      {pdfs.map((pdf) => (
        <PDFComponent key={pdf.id} pdf={pdf} onDelete={handleDeletePdf} onChange={handlePdfChange} />
      ))}
      <div className={styles.filters}>
        <button className={`${styles.filterBtn} ${filter === undefined && styles.filterActive}`} onClick={() => handleFilterChange()}>See All</button>
        <button className={`${styles.filterBtn} ${filter === true && styles.filterActive}`} onClick={() => handleFilterChange(true)}>See Selected</button>
        <button className={`${styles.filterBtn} ${filter === false && styles.filterActive}`} onClick={() => handleFilterChange(false)}>See Not Selected</button>
        <div className={styles.questionContainer}>
          <input 
            type="text" 
            className={styles.textInput} 
            placeholder="Digite sua pergunta sobre o PDF selecionado..." 
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
          />
          <button className={styles.submitBtn} onClick={handleQuestionSubmit}>Enviar</button>
        </div>
      </div>
    </div>
  );
}