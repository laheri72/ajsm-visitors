interface Props {
  scheduled: number;
  checkedIn: number;
  checkedOut: number;
  inside: number;
}

export default function VisitorStats({
  scheduled,
  checkedIn,
  checkedOut,
  inside,
}: Props) {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Stat label="Scheduled" value={scheduled} />
      <Stat label="Checked In" value={checkedIn} />
      <Stat label="Checked Out" value={checkedOut} />
      <Stat label="Inside Now" value={inside} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <p className="text-gray-500">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}
