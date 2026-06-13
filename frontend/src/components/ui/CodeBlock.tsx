export default function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="bg-slate-900 text-slate-100 rounded-lg p-4 text-xs overflow-x-auto font-mono leading-relaxed">
      {code}
    </pre>
  );
}
