export default function NetworkStatus({ expirationDate }) {
  if (!expirationDate) return null;

  const today = new Date();
  const expDate = new Date(expirationDate);
  const diffDays = Math.ceil((expDate - today) / (1000 * 60 * 60 * 24));

  const isInNetwork = expDate >= today;
  const isExpiringSoon = diffDays > 0 && diffDays <= 30;

  let bgColor = "bg-red-100 text-red-700";
  let label = "Out of Network";

  if (isInNetwork && isExpiringSoon) {
    bgColor = "bg-yellow-100 text-yellow-700";
    label = "Expiring Soon";
  } else if (isInNetwork) {
    bgColor = "bg-green-100 text-green-700";
    label = "In Network";
  }

  return (
    <span className={`px-3 py-1 text-sm font-semibold rounded-full shadow-sm ${bgColor}`}>
      {label}
    </span>
  );
}
