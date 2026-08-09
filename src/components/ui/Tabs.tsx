import { haptic } from "@/lib/haptics";

export interface TabOption<T extends string> {
  value: T;
  label: string;
  count?: number;
}

interface TabsProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: TabOption<T>[];
}

export function Tabs<T extends string>({ value, onChange, options }: TabsProps<T>) {
  return (
    <div className="ui-tabs" role="tablist">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="tab"
          aria-selected={value === option.value}
          className={`ui-tabs__tab ${value === option.value ? "ui-tabs__tab--active" : ""}`}
          onClick={() => {
            haptic("selection");
            onChange(option.value);
          }}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="ui-tabs__count">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
