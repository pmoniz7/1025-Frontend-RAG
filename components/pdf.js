import Image from 'next/image';
import styles from '../styles/pdf.module.css';

export default function PDFComponent(props) {
  const { pdf, onChange, onDelete } = props;
  const [sumar, setSumar] = useState(null); // Add this line to define the sumar state
  const [isSumarVisible, setIsSumarVisible] = useState(false); // Track the visibility of the sumar box

  // The following function is added for our LangChain test:
  async function generateSumar(id) {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/pdfs/write-sumar/${id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
    if (res.ok) {
        const data = await res.json();
        setSumar(data.sumar);
        setIsSumarVisible(true); // Show the poem box when a poem is generated
    }
  }

  // Function to close the sumar box
  function closeSumarBox() {
    setIsSumarVisible(false);
  }

/* ###### ANALISANDO AQUI !!!!!! */
  return (
    <div className={styles.pdfRow}>
      <input
        className={styles.pdfCheckbox}
        name="selected"
        type="checkbox"
        checked={pdf.selected}
        onChange={(e) => onChange(e, pdf.id)}
      />
      <input
        className={styles.pdfInput}
        autoComplete="off"
        name="name"
        type="text"
        value={pdf.name}
        onChange={(e) => onChange(e, pdf.id)}
      />

      <button
        className={styles.generateSumarBtn} // Style the poem button as needed
        onClick={() => generateSumar(pdf.id)} // Call the generatePoem function
      >
        Generate Sumar
      </button>
      <button className={styles.deleteBtn} onClick={() => onDelete(pdf.id)}>
        <Image src="/delete-outline.svg" width="24" height="24" />
      </button>
      {isSumarVisible && (
        <div className={styles.sumarBox}>
          <button className={styles.closeButton} onClick={closeSumarBox}>
            &times; {/* Add a close icon (×) */}
          </button>
          <div className={styles.sumar}>
            <p>{sumar}</p>
          </div>
        </div>
      )}
    </div>
  );  

}

