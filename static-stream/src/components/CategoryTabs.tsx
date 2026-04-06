interface CategoryTabsProps {
  active: string;
  onChange: (cat: string) => void;
  categories?: string[];
}

const CategoryTabs = ({ active, onChange, categories = [] }: CategoryTabsProps) => {
  return (
    <div className="flex flex-wrap gap-0 border border-border">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onChange(cat)}
          className={`px-4 py-2 font-body text-sm border-r border-border last:border-r-0 ${
            active === cat
              ? "bg-foreground text-background font-medium"
              : "bg-card text-muted-foreground"
          }`}
        >
          {cat}
        </button>
      ))}
    </div>
  );
};

export default CategoryTabs;
