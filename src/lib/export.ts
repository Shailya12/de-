import { Visitor } from "@/types/visitor";
import { format } from "date-fns";

export function exportToCSV(visitors: Visitor[]) {
  const headers = ["Name", "Phone", "Purpose", "Flat", "Check-In", "Check-Out", "Status", "Guard"];
  const rows = visitors.map(v => [
    v.name,
    v.phone,
    v.purpose,
    v.apartmentFloor || "N/A",
    format(v.checkInTime.toDate(), "yyyy-MM-dd HH:mm:ss"),
    v.checkOutTime ? format(v.checkOutTime.toDate(), "yyyy-MM-dd HH:mm:ss") : "N/A",
    v.status,
    v.checkedInByName
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map(r => r.map(field => `"${field}"`).join(","))
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `visitor_logs_${format(new Date(), "yyyy-MM-dd")}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
