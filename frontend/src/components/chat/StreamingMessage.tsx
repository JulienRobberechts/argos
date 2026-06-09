export default function StreamingMessage({ text }: { text: string }) {
  return (
    <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
      {text}
      <span className="inline-block w-0.5 h-[1.1em] ml-0.5 bg-gray-400 animate-pulse align-text-bottom" />
    </div>
  );
}
