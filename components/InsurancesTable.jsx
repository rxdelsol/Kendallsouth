{/* Type */}
<select
  value={item.type}
  onChange={(e) =>
    setItem({ ...item, type: e.target.value })
  }
  className="p-2 rounded bg-[#081424]"
>
  <option value="HMO">HMO</option>
  <option value="PPO">PPO</option>
  <option value="Medicare">Medicare</option>
  <option value="Medicaid">Medicaid</option>
  <option value="Other">Other</option>
</select>

{/* If type === Other → show input */}
{item.type === "Other" && (
  <input
    placeholder="Enter insurance type"
    className="p-2 rounded bg-[#081424]"
    value={item.customType || ""}
    onChange={(e) =>
      setItem({ ...item, type: e.target.value, customType: e.target.value })
    }
  />
)}
