import { useEffect, useMemo, useState } from "react";
import { listenToVisitors } from "../services/visitor.service";
import type { Visitor } from "../models/Visitor";

export function useVisitors() {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToVisitors((data) => {
      setVisitors(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const scheduled = useMemo(
    () => visitors.filter((v) => v.status === "scheduled"),
    [visitors]
  );

  const checkedIn = useMemo(
    () => visitors.filter((v) => v.status === "checked-in"),
    [visitors]
  );

  const checkedOut = useMemo(
    () => visitors.filter((v) => v.status === "checked-out"),
    [visitors]
  );

  return {
    visitors,
    scheduled,
    checkedIn,
    checkedOut,
    insideCount: checkedIn.length,
    loading,
  };
}
