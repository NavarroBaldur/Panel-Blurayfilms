import Select from "react-select"

type GenreMultiSelectProps = {
  value: string[]
  onChange: (genres: string[]) => void
  options: string[]
  placeholder?: string
  className?: string
}

export function GenreMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Seleccionar géneros",
  className = "",
}: GenreMultiSelectProps) {
  const selectOptions = options.map((g) => ({ value: g, label: g }))
  const selectedValues = selectOptions.filter((opt) => value.includes(opt.value))

  return (
    <Select
      isMulti
      options={selectOptions}
      value={selectedValues}
      onChange={(selected) => onChange(selected.map((opt) => opt.value))}
      placeholder={placeholder}
      className={className}
      classNamePrefix="react-select"
      styles={{
        control: (base) => ({
            ...base,
            backgroundColor: "#232323",
            border: "none", // ⬅️ Elimina el borde por completo
            padding: "0.25rem 0.5rem",
            borderRadius: "0.375rem",
            boxShadow: "none", // ⬅️ Elimina el resplandor en focus
            outline: "none",
            color: "#F3F4F6",
          }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? "#2b2b2b" : "#232323",
          color: "#F3F4F6",
          padding: "0.5rem",
          cursor: "pointer",
        }),
        menu: (base) => ({
          ...base,
          backgroundColor: "#2b2b2b",
          borderRadius: "0.375rem",
          zIndex: 50,
        }),
        multiValue: (base) => ({
          ...base,
          backgroundColor: "#2b2b2b",
          borderRadius: "0.25rem",
          padding: "0 0.25rem",
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: "#F3F4F6",
        }),
        multiValueRemove: (base) => ({
          ...base,
          color: "#9CA3AF",
          ":hover": {
            color: "#851d1e",
            backgroundColor: "#2b2b2b",
          },
        }),
        input: (base) => ({
          ...base,
          color: "#F3F4F6",
          borderColor: "#2b2b2b",
          outline: "none",
          border: "none",
          boxShadow: "none",
        }),
        placeholder: (base) => ({
          ...base,
          color: "#da3036", // text-muted
        }),
      }}
    />
  )
}