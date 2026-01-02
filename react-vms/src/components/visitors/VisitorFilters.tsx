interface Props {
  active: string;
  onChange: (filter: string) => void;
}

export default function VisitorFilters({ active, onChange }: Props) {
  const filters = ["all", "scheduled", "checked-in", "checked-out"];

  return (
    <div className="flex gap-2 mb-4">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`px-4 py-2 rounded ${
            active === f
              ? "bg-black text-white"
              : "bg-gray-200"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}
