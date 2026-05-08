import { useEffect, useState, lazy, Suspense } from "react";
import "react-quill/dist/quill.snow.css";

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

// Lazy-load react-quill (browser only)
const ReactQuill = lazy(() => import("react-quill"));

const modules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ["bold", "italic", "underline", "strike"],
    [{ color: [] }, { background: [] }],
    [{ list: "ordered" }, { list: "bullet" }],
    [{ align: [] }],
    ["link", "image", "blockquote"],
    ["clean"],
  ],
};

const WysiwygEditor = ({ value, onChange, placeholder, className }: Props) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className={className}>
        <div style={{ minHeight: 320, background: "white" }} />
      </div>
    );
  }

  return (
    <div className={className}>
      <Suspense fallback={<div style={{ minHeight: 320, background: "white" }} />}>
        <ReactQuill
          theme="snow"
          value={value}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder || "Composez votre email…"}
          style={{ background: "white", color: "black", minHeight: 280 }}
        />
      </Suspense>
    </div>
  );
};

export default WysiwygEditor;
