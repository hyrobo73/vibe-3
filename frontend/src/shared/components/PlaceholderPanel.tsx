type PlaceholderPanelProps = {
  title: string;
  items: string[];
};

export function PlaceholderPanel({ title, items }: PlaceholderPanelProps) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <div className="panel-grid">
        {items.map((item) => (
          <div className="module-tile" key={item}>
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
