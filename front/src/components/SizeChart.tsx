import { PRODUCT_SIZES, type ProductSizeId } from "@/lib/product-sizes";

export function SizeChart({ selected }: { selected?: string }) {
  return (
    <div className="size-chart-wrap">
      <table className="size-chart">
        <thead>
          <tr>
            <th>Tamanho</th>
            <th>Largura</th>
            <th>Comprimento</th>
            <th>Manga</th>
          </tr>
        </thead>
        <tbody>
          {PRODUCT_SIZES.map((row) => (
            <tr key={row.id} className={selected === row.id ? "on" : ""}>
              <td>{row.id}</td>
              <td>{row.width} cm</td>
              <td>{row.length} cm</td>
              <td>{row.sleeve} cm</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function SizePicker({
  value,
  onChange,
  disabled,
}: {
  value?: string;
  onChange: (size: ProductSizeId) => void;
  disabled?: boolean;
}) {
  return (
    <div className="size-picker" role="listbox" aria-label="Tamanho">
      {PRODUCT_SIZES.map((row) => (
        <button
          key={row.id}
          className={value === row.id ? "on" : ""}
          type="button"
          role="option"
          aria-selected={value === row.id}
          disabled={disabled}
          onClick={() => onChange(row.id)}
        >
          {row.id}
        </button>
      ))}
    </div>
  );
}
