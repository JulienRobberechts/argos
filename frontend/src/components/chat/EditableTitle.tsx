import { Pencil } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useUpdateConversationTitle } from "../../hooks/useConversation";

export default function EditableTitle({
  id,
  title,
}: {
  id: string;
  title: string;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  const updateTitle = useUpdateConversationTitle();

  useEffect(() => {
    setValue(title);
  }, [title]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  function commit() {
    const trimmed = value.trim();
    if (trimmed && trimmed !== title) {
      updateTitle.mutate({ id, title: trimmed });
    } else {
      setValue(title);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(title);
            setEditing(false);
          }
        }}
        className="text-base font-semibold text-slate-800 bg-transparent border-b border-slate-400 outline-none w-full"
      />
    );
  }

  return (
    <button
      type="button"
      className="group flex items-center gap-1.5 text-base font-semibold text-slate-800 hover:text-slate-600 transition-colors"
      onClick={() => setEditing(true)}
      title="Edit title"
    >
      <span>{title}</span>
      <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
    </button>
  );
}
