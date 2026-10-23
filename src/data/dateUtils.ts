/**
 * Helper utility for Real-time Indonesian Date & Time Formatting
 */

export function getIndonesianLiveDateTime(date: Date = new Date()): {
  dayName: string;
  formattedDate: string;
  timeString: string;
  fullString: string;
  isoString: string;
} {
  const days = [
    "Minggu",
    "Senin",
    "Selasa",
    "Rabu",
    "Kamis",
    "Jumat",
    "Sabtu",
  ];

  const months = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];

  const dayName = days[date.getDay()];
  const day = String(date.getDate()).padStart(2, "0");
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  const formattedDate = `${day} ${month} ${year}`;
  const timeString = `${hours}:${minutes}:${seconds} WIB`;
  const fullString = `${dayName}, ${formattedDate} - ${timeString}`;

  return {
    dayName,
    formattedDate,
    timeString,
    fullString,
    isoString: date.toISOString(),
  };
}

export function formatISODateToIndonesian(isoStr?: string): string {
  if (!isoStr) return "-";
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    const { fullString } = getIndonesianLiveDateTime(d);
    return fullString;
  } catch {
    return isoStr;
  }
}

export function formatIndonesianCurrency(num: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

