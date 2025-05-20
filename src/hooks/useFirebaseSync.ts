
import { useEffect } from "react";
import { submitFormData } from "@/lib/projectOperations";
import { useNetwork } from "@/contexts/NetworkContext";

/**
 * Submits queued local offline records to Firebase when online.
 * The queued records are per project: localStorage key: "offline_records_{projectId}"
 */
export function useFirebaseSync(projectId: string, userId: string) {
  const { isOnline } = useNetwork();

  useEffect(() => {
    if (!isOnline) return;
    if (!projectId || !userId) return;

    // Get queued submissions for this project
    const key = `offline_records_${projectId}`;
    const queued = localStorage.getItem(key);
    if (queued) {
      const records = JSON.parse(queued);
      if (Array.isArray(records) && records.length > 0) {
        Promise.all(records.map((record: any) =>
          submitFormData(projectId, record, userId)
        )).then(() => {
          localStorage.removeItem(key);
          // optional: toast success?
        });
      }
    }
  }, [isOnline, projectId, userId]);
}
