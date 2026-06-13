import ReactMarkdown from "react-markdown";

export default function StreamingMessage({ text }: { text: string }) {
  return (
    <div className="prose prose-sm prose-slate max-w-none streaming-cursor">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
  );
}
